/**
 * Google Apps Script Webhook for Contract PDF Generation (V2 - Full Placeholders)
 * This script should be deployed as a "Web App" in Google Apps Script.
 * Set "Execute as: Me" and "Who has access: Anyone".
 */

// --- CONFIGURATION ---
const SUPABASE_URL = "https://iecyckrbxtofxfweaipy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "PASTE_YOUR_SERVICE_ROLE_KEY_HERE"; 
const TEMPLATE_ID = "1zC8GDUuynsQ5UU2dbXU6-8n2sIq5igbXGXAGGYIYink";
const FOLDER_ID = "1vKraumWp05a1QkhVr8aUbup0sgR-6sIH";

/**
 * Handle POST request from Supabase Webhook
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const record = payload.record; // New record
    const type = payload.type; // INSERT, UPDATE

    // Log the event type for debugging
    console.log("Event Type: " + type + " | Contract ID: " + record.id);

    // 1. PDF GENERATION LOGIC
    if (record.contract_file_url === 'create_contract') {
      console.log("Processing PDF generation for contract ID: " + record.id);
      const contract = fetchFullContractData(record.id);
      const pdfResult = generateContractPDF(contract);
      updateSupabaseContract(contract.id, pdfResult.url);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, url: pdfResult.url }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. SHARING LOGIC (ZALO & EMAIL)
    // We expect sendzalo and sendemail columns to be updated with a timestamp or "pending" 
    // and we update them to "done" after processing.
    const isZaloReq = record.sendzalo && record.sendzalo !== 'done';
    const isEmailReq = record.sendemail && record.sendemail !== 'done';

    if (isZaloReq || isEmailReq) {
      console.log("Processing sharing request for contract ID: " + record.id);
      const contract = fetchFullContractData(record.id);
      
      if (!contract.contract_file_url || contract.contract_file_url === 'create_contract') {
        console.warn("PDF not ready, skipping sharing.");
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "PDF not ready" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const fileId = extractFileIdFromUrl(contract.contract_file_url);
      if (fileId) {
        const pdfBlob = DriveApp.getFileById(fileId).getBlob();
        
        if (isZaloReq) {
          const zaloUserId = contract.zalo_id || (contract.clients && contract.clients.zalo_id);
          if (zaloUserId) {
            const msg = `Eva's Fit gửi chị ${contract.member_name} hợp đồng điện tử. Chị vui lòng xem file đính kèm.`;
            webapp_guizalo(zaloUserId, msg, pdfBlob);
            updateSupabaseSharingStatus(contract.id, 'sendzalo', 'done');
          } else {
            console.warn("No Zalo UID found for contract: " + record.id);
          }
        }

        if (isEmailReq) {
          const email = contract.email || (contract.clients && contract.clients.email);
          if (email) {
            const subject = `Hợp đồng ${contract.member_name} - Eva's Fit Nam Định`;
            webapp_guiemail(subject, email, pdfBlob, contract.member_name);
            updateSupabaseSharingStatus(contract.id, 'sendemail', 'done');
          } else {
            console.warn("No Email found for contract: " + record.id);
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Handled" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Error: " + error.message);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function extractFileIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

function updateSupabaseSharingStatus(contractId, field, value) {
  const url = `${SUPABASE_URL}/rest/v1/contracts?id=eq.${contractId}`;
  const updates = {};
  updates[field] = value;
  
  const options = {
    method: "patch",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY
    },
    payload: JSON.stringify(updates)
  };
  UrlFetchApp.fetch(url, options);
}

/**
 * Fetch full data including clients and branches
 */
function fetchFullContractData(contractId) {
  const url = `${SUPABASE_URL}/rest/v1/contracts?id=eq.${contractId}&select=*,clients(*),branches(*)`;
  const options = {
    method: "get",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (!data || data.length === 0) throw new Error("Contract not found in Supabase: " + contractId);
  
  return data[0]; // Returns single contract object with .clients and .branches properties
}

/**
 * Logic to fill template and export PDF
 */
function generateContractPDF(contract) {
  const templateFile = DriveApp.getFileById(TEMPLATE_ID);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  
  const memberName = (contract.clients && contract.clients.member_name) || "Anonymous";
  const fileName = `HD_${contract.id}_${memberName}_${new Date().getTime()}`;
  
  // Copy template
  const copyFile = templateFile.makeCopy(fileName, folder);
  const doc = DocumentApp.openById(copyFile.getId());
  const body = doc.getBody();

  // Mapping placeholders
  const placeholders = buildFullPlaceholders(contract);
  
  // Replace text
  for (let key in placeholders) {
    body.replaceText(key, placeholders[key] || "");
  }

  // Replace images (Signatures)
  replacePlaceholderWithImage(body, "{{signature_url}}", contract.signature_url);
  
  const branchSig = (contract.branches && contract.branches.signature_center) || "";
  replacePlaceholderWithImage(body, "{{signature_center}}", branchSig);

  doc.saveAndClose();

  // Export to PDF
  const pdfBlob = copyFile.getAs(MimeType.PDF);
  const pdfFile = folder.createFile(pdfBlob);
  pdfFile.setName(fileName + ".pdf");
  
  // Set permissions
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const pdfUrl = pdfFile.getUrl();

  // Move temporary Doc to trash
  copyFile.setTrashed(true);

  return { url: pdfUrl };
}

/**
 * Build mapping for all placeholders defined in CSV
 */
function buildFullPlaceholders(contract) {
  const c = contract || {};
  const cl = contract.clients || {};
  const br = contract.branches || {};
  
  const data = {};

  // --- MEMBER CATEGORY ---
  data["{{member_name}}"] = (cl.member_name || c.member_name || "").toUpperCase();
  data["{{phone}}"] = cl.phone || c.phone || "";
  data["{{email}}"] = cl.email || c.email || "";
  data["{{dob}}"] = formatDate(cl.dob || c.dob || c.date_of_birth);
  data["{{initial_height}}"] = cl.height || cl.initial_height || c.initial_height || "";
  data["{{initial_weight}}"] = cl.weight || cl.initial_weight || c.initial_weight || "";
  data["{{id_number}}"] = cl.id_number || c.id_number || "";
  data["{{medical_condition}}"] = c.medical_condition || cl.medical_history || cl.medical_condition || "Không";
  data["{{address}}"] = cl.address || c.member_address || "";

  // --- PACKAGE CATEGORY ---
  data["{{package_name}}"] = c.package_name || "";
  data["{{total_sessions}}"] = c.total_sessions || "";
  data["{{start_date}}"] = formatDate(c.start_date);
  data["{{end_date}}"] = formatDate(c.end_date);
  data["{{trainer_name}}"] = c.trainer_name || c.assigned_pt || ""; 
  data["{{trainer_type}}"] = c.trainer_type || "Trực tiếp";
  
  const pkgPrice = Number(c.package_price || 0);
  data["{{package_price}}"] = formatVND(pkgPrice);
  data["{{package_price_words}}"] = c.package_price_text || numberToVietnameseWords(pkgPrice);
  
  const discPrice = Number(c.discounted_price || 0);
  data["{{discounted_price}}"] = formatVND(discPrice);
  data["{{discounted_price_words}}"] = c.discounted_price_text || numberToVietnameseWords(discPrice);

  // --- CONTRACT CATEGORY ---
  data["{{contract_id}}"] = c.id || "";
  data["{{signing_date}}"] = formatDate(c.signing_date || c.created_at);
  
  const totalAmount = Number(c.total_amount || 0);
  data["{{total_amount}}"] = formatVND(totalAmount);
  data["{{total_amount_words}}"] = c.total_amount_text || numberToVietnameseWords(totalAmount);
  
  data["{{payment_method}}"] = c.payment_method || "Tiền mặt";

  // --- CENTER/BRANCH CATEGORY ---
  data["{{center_name}}"] = br.name || c.facility_name || "TRUNG TÂM LADY FIT";
  data["{{center_short_name}}"] = br.short_name || c.short_name || "LADY FIT";
  data["{{branch_name}}"] = br.name || "";
  data["{{center_address}}"] = br.center_address || br.address || c.address || "";
  data["{{center_phone}}"] = br.center_phone || br.phone || c.center_phone || "";
  data["{{representative_phone}}"] = br.representative_phone || "";
  data["{{center_representative}}"] = br.representative || c.center_representative || "Nguyễn Minh Trí"; 
  data["{{legal_representative}}"] = br.legal_representative || "";
  data["{{account_number}}"] = br.account_number ? String(br.account_number) : (c.account_number ? String(c.account_number) : "");
  data["{{bank_name}}"] = br.bank_name || c.bank_name || "";
  data["{{account_holder}}"] = br.account_holder || c.account_holder || "";

  return data;
}

/**
 * Helpers
 */
function formatVND(amount) {
  if (isNaN(amount)) return "0 ₫";
  return amount.toLocaleString('vi-VN') + " ₫";
}

function formatDate(dateStr) {
  if (!dateStr) return "....................";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Chèn ảnh vào placeholder trong Google Doc
 */
function replacePlaceholderWithImage(body, placeholder, imageUrl) {
  if (!imageUrl || imageUrl.startsWith('data:')) return; 
  try {
    const response = UrlFetchApp.fetch(imageUrl);
    const imageBlob = response.getBlob();
    let next = body.findText(placeholder);
    while (next) {
      const el = next.getElement();
      const offset = next.getStartOffset();
      
      // Chèn ảnh vào paragraph chứa placeholder
      const parent = el.getParent();
      if (parent.getType() === DocumentApp.ElementType.PARAGRAPH) {
        const p = parent.asParagraph();
        const img = p.appendInlineImage(imageBlob);
        
        // Tùy chỉnh kích thước
        img.setWidth(120);
        img.setHeight(60); 
        
        // Xóa text placeholder
        el.asText().deleteText(offset, offset + placeholder.length - 1);
      }
      
      // Tìm placeholder tiếp theo nếu có
      next = body.findText(placeholder, next);
    }
  } catch (e) {
    console.error("Lỗi chèn ảnh " + placeholder + ": " + e.message);
  }
}

function updateSupabaseContract(contractId, pdfUrl) {
  const url = `${SUPABASE_URL}/rest/v1/contracts?id=eq.${contractId}`;
  const options = {
    method: "patch",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY
    },
    payload: JSON.stringify({ contract_file_url: pdfUrl })
  };
  UrlFetchApp.fetch(url, options);
}

/**
 * --- NEW SHARING FUNCTIONS ---
 */

function webapp_guizalo(userid, text_message, pdfBlob) {
  try {
    zalo_gettokenfromsheet(); // Assuming this is defined elsewhere in your GAS project
    
    // Step 2: Upload file to Zalo API
    var fileToken = uploadFileToZalo(zalo_token, pdfBlob);

    if (!fileToken) {
      console.error("Tải file lên Zalo thất bại. Không thể gửi tin nhắn.");
      return;
    }
    
    console.log("File token từ Zalo: " + fileToken);

    // Step 3: Send message with file token
    var rs = zalo_sendsms_tuvan_attachfile(zalo_token, userid, fileToken);

    if (rs && rs.responseData && rs.responseData.data) {
      var data = rs.responseData.data;
      var message_id = data.message_id;
      var user_id = data.user_id;
      
      if (message_id && user_id) {
        zalo_sendsms_tuvan_trichdan(zalo_token, user_id, message_id, text_message);
        console.log("Gửi tin nhắn Zalo kèm trích dẫn thành công");
      }
    }
  } catch (e) {
    console.error("Lỗi webapp_guizalo: " + e.message);
  }
}

function webapp_guiemail(emailSubject, client_email, pdfBlob, client_name) {
  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
          <p>Trung tâm Eva's Fit Nam Định xin chào chị <strong>${client_name}</strong>,</p>
          
          <p>Cảm ơn chị đã tin tưởng và lựa chọn Eva's Fit.</p>
          
          <p>Đây là biên nhận và hợp đồng của chị tại Eva's Fit (HĐ). Mọi thông tin chi tiết chị vui lòng kiểm tra trong file đính kèm.</p>
          
          <p>Nếu cần hỗ trợ thêm, chị có thể phản hồi lại email này hoặc liên hệ trực tiếp với quản lý trung tâm.</p>
          <br>
          <p>Trân trọng,<br>
          <strong>Đội ngũ Eva's Fit Nam Định</strong></p>
          <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;">
          <small style="color: #888;">Email này được gửi tự động từ hệ thống.</small>
      </div>
    `;

    GmailApp.sendEmail(client_email, emailSubject, "", {
      htmlBody: htmlBody,
      attachments: [pdfBlob],
      name: "Eva's Fit Nam Định"
    });
    console.log("Gửi Email thành công tới: " + client_email);
  } catch (e) {
    console.error("Lỗi webapp_guiemail: " + e.message);
  }
}

/**
 * --- END SHARING FUNCTIONS ---
 */

/**
 * Vietnamese Number to Words Conversion
 */
function numberToVietnameseWords(number) {
    if (number === 0) return "không đồng";
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    
    function readGroup(n) {
        let res = "";
        let h = Math.floor(n / 100);
        let t = Math.floor((n % 100) / 10);
        let u = n % 10;

        if (h > 0) {
            res += units[h] + " trăm ";
            if (t === 0 && u > 0) res += "lẻ ";
        }
        
        if (t > 1) {
            res += units[t] + " mươi ";
            if (u === 1) res += "mốt ";
            else if (u === 5) res += "lăm ";
            else if (u > 0) res += units[u];
        } else if (t === 1) {
            res += "mười ";
            if (u === 1) res += "một "; // or skip
            else if (u === 5) res += "lăm ";
            else if (u > 0) res += units[u];
        } else if (u > 0) {
            res += units[u];
        }
        return res;
    }

    let groups = [];
    let n = Math.abs(number);
    while (n > 0) {
        groups.push(n % 1000);
        n = Math.floor(n / 1000);
    }

    const labels = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    let res = "";
    for (let i = groups.length - 1; i >= 0; i--) {
        let g = readGroup(groups[i]);
        if (g !== "") {
            res += g + " " + labels[i] + " ";
        }
    }
    
    return res.trim().charAt(0).toUpperCase() + res.trim().slice(1) + " đồng chẵn";
}
