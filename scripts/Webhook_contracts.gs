const SUPABASE_URL = "https://iecyckrbxtofxfweaipy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllY3lja3JieHRvZnhmd2VhaXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwNjg2OCwiZXhwIjoyMDg1MzgyODY4fQ.Au_R-BZ8H_XyQfMICAZakT3ad_yT0iHcg0fsU6kIOpM"; 
const TEMPLATE_ID = "1zC8GDUuynsQ5UU2dbXU6-8n2sIq5igbXGXAGGYIYink";
const FOLDER_ID = "1vKraumWp05a1QkhVr8aUbup0sgR-6sIH";
//https://script.google.com/macros/s/AKfycbz0npJ9lf3xmaOZezXvCJtzOs9XwxFsjiK-p8XcMXxFGmLcS0X-RO9tkqDrW68uSJy_/exec
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // 1. CHẾ ĐỘ GỬI TRỰC TIẾP (DIRECT POST)
    // Dùng khi Web App gửi thẳng subject/message/pdfBase64 mà không qua database webhook
    if (!payload.record && payload.email) {
      console.log("Direct POST request target: " + payload.email);
      let pdfBlob = null;
      if (payload.pdfBase64) {
        pdfBlob = Utilities.newBlob(Utilities.base64Decode(payload.pdfBase64), 'application/pdf', payload.fileName || 'document.pdf');
      }
      
      webapp_guiemail(
        payload.subject || "Thông tin từ Eva's Fit Việt Nam", 
        payload.email, 
        pdfBlob, 
        payload.name || "Quý khách", 
        null, // contract object is missing in direct post, but we have the fields
        payload.message || ""
      );
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, method: "direct_post" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const record = payload.record; // New record from Supabase Webhook
    const type = payload.type; // INSERT, UPDATE

    // Log the event type for debugging
    console.log("Event Type: " + type + " | Contract ID: " + record.id);
    
    // 2. PDF GENERATION LOGIC
    if (record.contract_file_url === 'create_contract') { 
      const contract = fetchFullContractData(record.id);
      tg_log("Tạo hợp đồng mới","Mã hợp đồng"+ record.id,JSON.stringify(contract))     
      const pdfResult = generateContractPDF(contract);
      updateSupabaseContract(contract.id, pdfResult.url);      
      return ContentService.createTextOutput(JSON.stringify({ success: true, url: pdfResult.url }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. SHARING LOGIC (ZALO & EMAIL)
    // - Zalo: Gửi khi cột sendzalo chứa giá trị khác 'done'
    // - Email: CHỈ gửi khi cột sendemail có giá trị là 'trigger_email' (Tránh vòng lặp)
    const isZaloReq = record.sendzalo && record.sendzalo !== 'done';
    const isEmailReq = record.sendemail === 'trigger_email';

    if (isZaloReq || isEmailReq) {
      console.log("Processing sharing request for contract ID: " + record.id + " | EmailReq: " + isEmailReq);
      const contract = fetchFullContractData(record.id);
      const branchName = "Eva's Fit Việt Nam";
      
      const fileId = extractFileIdFromUrl(contract.contract_file_url);
      let pdfBlob = null;
      if (fileId) {
        try {
          pdfBlob = DriveApp.getFileById(fileId).getBlob();
        } catch (e) {
          console.warn("Could not fetch PDF blob: " + e.message);
        }
      }
      
      if (isZaloReq && pdfBlob) {
        const zaloUserId = contract.zalo_id || (contract.clients && contract.clients.zalo_id);
        if (zaloUserId) {
          tg_log("Gửi Zalo khách ", "Zalo:"+ contract.zalo_id, "Mã hợp đồng"+record.id)     
          const msg = `${branchName} gửi chị ${contract.member_name} hợp đồng điện tử. Chị vui lòng xem file đính kèm.`;
          webapp_guizalo(zaloUserId, msg, pdfBlob);
          
          // Ghi lại thời gian gửi Zalo thay vì dùng chữ 'done'
          updateSupabaseSharingStatus(contract.id, 'sendzalo', new Date().toISOString());
        } else {
          console.warn("No Zalo UID found for contract: " + record.id);
        }
      }

      if (isEmailReq) {
        const email = contract.email || (contract.clients && contract.clients.email);
        if (email) {
          tg_log("Gửi Email khách ", "Email:"+ contract.email, "Mã hợp đồng"+record.id)     
          const subject = `Hợp đồng ${contract.member_name} - ${branchName}`;
          const customMessage = record.email_message || ""; // Lấy nội dung tùy chỉnh từ cột email_message trong DB
          webapp_guiemail(subject, email, pdfBlob, contract.member_name, contract, customMessage);
          
          // Sau khi gửi xong, ghi đè 'trigger_email' bằng dấu thời gian (Timestamp)
          // Vì Timestamp !== 'trigger_email', Webhook tiếp theo sẽ không gửi lặp lại.
          updateSupabaseSharingStatus(contract.id, 'sendemail', new Date().toISOString());
        } else {
          console.warn("No Email found for contract: " + record.id);
        }
      }
    }

    // 4. XNTT - XÁC NHẬN THANH TOÁN (Email HTML, không PDF)
    const isXNTTReq = record.sendemail_xntt && record.sendemail_xntt !== 'done' && record.sendemail_xntt !== 'error';

    if (isXNTTReq) {
      try {
        const xnttData = JSON.parse(record.sendemail_xntt);
        const branchNameXNTT = "Eva's Fit Việt Nam";

        tg_log("XNTT", "Gửi XNTT", "To: " + xnttData.email);
        GmailApp.sendEmail(xnttData.email, xnttData.subject, "", {
          htmlBody: xnttData.htmlBody,
          name: branchNameXNTT
        });
        updateSupabaseSharingStatus(record.id, 'sendemail_xntt', 'done');
      } catch (xnttErr) {
        console.error("Lỗi xử lý XNTT: " + xnttErr.message);
        updateSupabaseSharingStatus(record.id, 'sendemail_xntt', 'error');
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Handled" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    tg_log("Có lỗi","doPost",error.message)
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
  
  const pdfUrl = pdfFile.getUrl();
  // Move temporary Doc to trash
  copyFile.setTrashed(true);

  return { url: pdfUrl };
}

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
  data["{{initial_height}}"] = c.initial_height || cl.height || cl.initial_height || "";
  data["{{initial_weight}}"] = c.initial_weight || cl.weight || cl.initial_weight || "";
  data["{{id_number}}"] = c.id_number || cl.id_number || "";
  data["{{medical_condition}}"] = c.medical_condition || cl.medical_history || cl.medical_condition || "Không";
  data["{{address}}"] = c.member_address || cl.address || "";

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
  data["{{center_name}}"] = "Eva's Fit Việt Nam";
  data["{{center_short_name}}"] = "Eva's Fit Việt Nam";
  data["{{branch_name}}"] = "Eva's Fit Việt Nam";
  data["{{center_address}}"] = br.center_address || br.address || c.address || "";
  data["{{center_phone}}"] = c.center_phone || br.center_phone || br.phone || "";
  data["{{representative_phone}}"] = c.representative_phone || "";
  data["{{center_representative}}"] = c.center_representative || br.representative || ""; 
  data["{{legal_representative}}"] = c.legal_representative || "";
  data["{{center_legal_representative}}"] = br.legal_representative || "";
  data["{{center_representative_phone}}"] = br.representative_phone || "";
  data["{{account_number}}"] = br.account_number ? String(br.account_number) : (c.account_number ? String(c.account_number) : "");
  data["{{bank_name}}"] = br.bank_name || c.bank_name || "";
  data["{{account_holder}}"] = br.account_holder || c.account_holder || "";

  return data;
}

function formatVND(amount) {
  if (isNaN(amount)) return "0 ₫";
  return amount.toLocaleString('vi-VN') + " ₫";
}


function formatDate(dateStr) {
  if (!dateStr) return "....................";
  try {
    // Tách trực tiếp từ chuỗi ISO để tránh lệch timezone
    const datePart = dateStr.split('T')[0]; // "2024-01-15T..." → "2024-01-15"
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // "15/01/2024"
    }
    // Fallback nếu format lạ
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

function replacePlaceholderWithImage(body, placeholder, imageUrl) {
  if (!imageUrl || imageUrl.trim() === "" || imageUrl.startsWith('data:')) {
    body.replaceText(placeholder, "");
    return;
  }
  
  try {
    const response = UrlFetchApp.fetch(imageUrl, { "muteHttpExceptions": true });
    if (response.getResponseCode() !== 200) {
      console.error("Không thể tải ảnh từ URL: " + imageUrl + " (Status: " + response.getResponseCode() + ")");
      body.replaceText(placeholder, "");
      return;
    }
    
    const imageBlob = response.getBlob();
    let next = body.findText(placeholder);
    let safetyCount = 0; 

    while (next && safetyCount < 20) {
      safetyCount++;
      const el = next.getElement();
      const offset = next.getStartOffset();
      const parent = el.getParent();
      
      const targetWidth = placeholder.includes("signature_center") ? 180 : 150;
      let inserted = false;

      if (parent.getType() === DocumentApp.ElementType.PARAGRAPH) {
        const p = parent.asParagraph();
        const img = p.appendInlineImage(imageBlob);
        const ratio = img.getHeight() / img.getWidth();
        img.setWidth(targetWidth);
        img.setHeight(targetWidth * ratio);
        el.asText().deleteText(offset, offset + placeholder.length - 1);
        inserted = true;

      } else if (parent.getType() === DocumentApp.ElementType.TABLE_CELL) {
        const cell = parent.asTableCell();
        const img = cell.appendImage(imageBlob);
        const ratio = img.getHeight() / img.getWidth();
        img.setWidth(targetWidth - 10);
        img.setHeight((targetWidth - 10) * ratio);
        el.asText().deleteText(offset, offset + placeholder.length - 1);
        inserted = true;
      }

      if (!inserted) {
        body.replaceText(placeholder, "");
        break;
      }
      next = body.findText(placeholder);
    }

    if (safetyCount >= 20) {
      body.replaceText(placeholder, "");
    }

  } catch (e) {
    console.error("Lỗi nghiêm trọng khi chèn ảnh " + placeholder + ": " + e.message);
    body.replaceText(placeholder, "");
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

function webapp_guizalo(userid, text_message, pdfBlob) {
  try {
    zalo_gettokenfromsheet(); 
    var fileToken = uploadFileToZalo(zalo_token, pdfBlob);

    if (!fileToken) {
      console.error("Tải file lên Zalo thất bại.");
      return;
    }

    var rs = zalo_sendsms_tuvan_attachfile(zalo_token, userid, fileToken);
    if (rs && rs.responseData && rs.responseData.data) {
      var data = rs.responseData.data;
      var message_id = data.message_id;
      var user_id = data.user_id;
      if (message_id && user_id) {
        zalo_sendsms_tuvan_trichdan(zalo_token, user_id, message_id, text_message);
      }
    }
  } catch (e) {
    console.error("Lỗi webapp_guizalo: " + e.message);
  }
}

function webapp_guiemail(subject, email, pdfBlob, client_name, contract, customMessage) {
  try {
    const emailMessage = customMessage || "";
    const branch = contract && contract.branches;
    
    // Gửi qua Webhook chi nhánh (nếu có)
    if (branch && branch.url_guimail && branch.url_guimail.startsWith('http')) {
      console.log("Sử dụng Webhook chi nhánh để gửi email: " + branch.url_guimail);
      
      const payload = {
        "email": email,
        "name": client_name,
        "subject": subject,
        "message": emailMessage
      };

      if (pdfBlob) {
        payload.pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());
        payload.fileName = `HD_${contract.id}_${client_name}.pdf`;
      }

      const options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };

      const resp = UrlFetchApp.fetch(branch.url_guimail, options);
      console.log("Kết quả gửi mail từ Webhook chi nhánh: " + resp.getContentText());
      return;
    }

    // Default system email body
    const branchName = "Eva's Fit Việt Nam";
    const htmlBody = emailMessage ? 
      `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${emailMessage}</div>` :
      `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
          <p>${branchName} xin chào chị <strong>${client_name}</strong>,</p>
          <p>Cảm ơn chị đã tin tưởng và lựa chọn tập luyện cùng Eva's Fit Việt Nam.</p>
          <p>Vui lòng xem chi tiết thông tin đính kèm.</p>
          <br>
          <p>Trân trọng,<br><strong>${branchName}</strong></p>
      </div>`;

    const mailOptions = {
      htmlBody: htmlBody,
      name: branchName
    };

    if (pdfBlob) {
      mailOptions.attachments = [pdfBlob];
    }

    GmailApp.sendEmail(email, subject, "", mailOptions);
    console.log("Gửi Email thành công tới: " + email);
  } catch (e) {
    console.error("Lỗi webapp_guiemail: " + e.message);
  }
}

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
            if (u === 1) res += "một "; 
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