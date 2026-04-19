const SUPABASE_URL = "https://iecyckrbxtofxfweaipy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllY3lja3JieHRvZnhmd2VhaXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwNjg2OCwiZXhwIjoyMDg1MzgyODY4fQ.Au_R-BZ8H_XyQfMICAZakT3ad_yT0iHcg0fsU6kIOpM"; 
const TEMPLATE_ID = "1zC8GDUuynsQ5UU2dbXU6-8n2sIq5igbXGXAGGYIYink";
const FOLDER_ID = "1vKraumWp05a1QkhVr8aUbup0sgR-6sIH";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // 0. NHÁNH BỔ SUNG: XỬ LÝ GỬI TRỰC TIẾP (Hợp đồng & Biên nhận)
    // Giúp xử lý các yêu cầu POST trực tiếp từ Server mà không qua trigger DB
    if (payload.email && payload.subject) {
      if (typeof tg_log === 'function') tg_log("HÀNH ĐỘNG", "Gửi trực tiếp", "To: " + payload.email);
      let pdfBlob = null;
      if (payload.pdfBase64) {
        pdfBlob = Utilities.newBlob(Utilities.base64Decode(payload.pdfBase64), 'application/pdf', payload.fileName || 'Document.pdf');
      }
      sendEmailActual(payload.subject, payload.email, pdfBlob, payload.name || "Quý khách", payload.message || "");
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Direct email sent" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. CHUẨN CŨ: XỬ LÝ WEBHOOK TỪ SUPABASE (Trigger)
    const record = payload.record; // New record
    const type = payload.type; // INSERT, UPDATE

    // Log the event type for debugging
    console.log("Event Type: " + type + " | Contract ID: " + (record ? record.id : "No Record"));
    
    if (!record) return ContentService.createTextOutput("No record").setMimeType(ContentService.MimeType.TEXT);

    // 1.1 LOGIC TẠO PDF (Giữ nguyên từ file chuẩn)
    if (record.contract_file_url === 'create_contract') { 
      const contract = fetchFullContractData(record.id);
      if (typeof tg_log === 'function') tg_log("Tạo hợp đồng mới","Mã hợp đồng"+ record.id,JSON.stringify(contract));
      const pdfResult = generateContractPDF(contract);
      updateSupabaseContract(contract.id, pdfResult.url);      
      return ContentService.createTextOutput(JSON.stringify({ success: true, url: pdfResult.url }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1.2 LOGIC CHIA SẺ (ZALO & EMAIL - Trigger)
    // - Zalo: CHỈ gửi khi có yêu cầu (khác 'done')
    // - Email: CHỈ gửi khi cột sendemail có giá trị là 'trigger_email' (Tránh vòng lặp)
    const isZaloReq = record.sendzalo && record.sendzalo !== 'done';
    const isEmailReq = record.sendemail === 'trigger_email';

    if (isZaloReq || isEmailReq) {
      console.log("Processing sharing request for contract ID: " + record.id + " | EmailReq: " + isEmailReq);
      const contract = fetchFullContractData(record.id);
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
          if (typeof tg_log === 'function') tg_log("Gửi Zalo khách ", "Zalo:"+ contract.zalo_id, "Mã hợp đồng"+record.id);
          const msg = `Eva's Fit gửi chị ${contract.member_name} hợp đồng điện tử. Chị vui lòng xem file đính kèm.`;
          webapp_guizalo(zaloUserId, msg, pdfBlob);
          updateSupabaseSharingStatus(contract.id, 'sendzalo', 'done');
        }
      }

      if (isEmailReq) {
        const email = contract.email || (contract.clients && contract.clients.email);
        if (email) {
          if (typeof tg_log === 'function') tg_log("Gửi Email khách ", "Email:"+ contract.email, "Mã hợp đồng"+record.id);
          const subject = `Hợp đồng ${contract.member_name} - Eva's Fit Nam Định`;
          const customMessage = record.email_message || "";
          webapp_guiemail(subject, email, pdfBlob, contract.member_name, contract, customMessage);
          
          // Sau khi gửi xong, ghi đè bằng dấu thời gian (Timestamp) thay vì dùng chữ 'done'
          // Vì Timestamp !== 'trigger_email', Webhook tiếp theo sẽ không gửi lặp lại.
          updateSupabaseSharingStatus(contract.id, 'sendemail', new Date().toISOString());
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Handled" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    if (typeof tg_log === 'function') tg_log("Có lỗi","doPost",error.message);
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
  return data[0];
}

function generateContractPDF(contract) {
  const templateFile = DriveApp.getFileById(TEMPLATE_ID);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const memberName = (contract.clients && contract.clients.member_name) || "Anonymous";
  const fileName = `HD_${contract.id}_${memberName}_${new Date().getTime()}`;  
  const copyFile = templateFile.makeCopy(fileName, folder);
  const doc = DocumentApp.openById(copyFile.getId());
  const body = doc.getBody();
  const placeholders = buildFullPlaceholders(contract);
  for (let key in placeholders) {
    body.replaceText(key, placeholders[key] || "");
  }
  replacePlaceholderWithImage(body, "{{signature_url}}", contract.signature_url);
  const branchSig = (contract.branches && contract.branches.signature_center) || "";
  replacePlaceholderWithImage(body, "{{signature_center}}", branchSig);
  doc.saveAndClose();
  const pdfBlob = copyFile.getAs(MimeType.PDF);
  const pdfFile = folder.createFile(pdfBlob);
  pdfFile.setName(fileName + ".pdf");
  const pdfUrl = pdfFile.getUrl();
  copyFile.setTrashed(true);
  return { url: pdfUrl };
}

function buildFullPlaceholders(contract) {
  const c = contract || {};
  const cl = contract.clients || {};
  const br = contract.branches || {};
  const data = {};
  data["{{member_name}}"] = (cl.member_name || c.member_name || "").toUpperCase();
  data["{{phone}}"] = cl.phone || c.phone || "";
  data["{{email}}"] = cl.email || c.email || "";
  data["{{dob}}"] = formatDate(cl.dob || c.dob || c.date_of_birth);
  data["{{initial_height}}"] = cl.height || cl.initial_height || c.initial_height || "";
  data["{{initial_weight}}"] = cl.weight || cl.initial_weight || c.initial_weight || "";
  data["{{id_number}}"] = cl.id_number || c.id_number || "";
  data["{{medical_condition}}"] = c.medical_condition || cl.medical_history || cl.medical_condition || "Không";
  data["{{address}}"] = cl.address || c.member_address || "";
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
  data["{{contract_id}}"] = c.id || "";
  data["{{signing_date}}"] = formatDate(c.signing_date || c.created_at);
  const totalAmount = Number(c.total_amount || 0);
  data["{{total_amount}}"] = formatVND(totalAmount);
  data["{{total_amount_words}}"] = c.total_amount_text || numberToVietnameseWords(totalAmount);
  data["{{payment_method}}"] = c.payment_method || "Tiền mặt";
  data["{{center_name}}"] = br.name || c.facility_name || "TRUNG TÂM LADY FIT";
  data["{{center_short_name}}"] = br.short_name || c.short_name || "LADY FIT";
  data["{{branch_name}}"] = br.name || "";
  data["{{center_address}}"] = br.center_address || br.address || c.address || "";
  data["{{center_phone}}"] = c.center_phone || br.center_phone || br.phone || "";
  data["{{representative_phone}}"] = c.representative_phone || "";
  data["{{center_representative}}"] = c.center_representative || br.representative || "Nguyễn Minh Trí"; 
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
    const datePart = dateStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) { return dateStr; }
}

function replacePlaceholderWithImage(body, placeholder, imageUrl) {
  if (!imageUrl || imageUrl.trim() === "" || imageUrl.startsWith('data:')) {
    body.replaceText(placeholder, "");
    return;
  }
  try {
    const response = UrlFetchApp.fetch(imageUrl, { "muteHttpExceptions": true });
    if (response.getResponseCode() !== 200) { body.replaceText(placeholder, ""); return; }
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
      if (!inserted) { body.replaceText(placeholder, ""); break; }
      next = body.findText(placeholder);
    }
    if (safetyCount >= 20) body.replaceText(placeholder, "");
  } catch (e) { body.replaceText(placeholder, ""); }
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
    if (!fileToken) return;
    var rs = zalo_sendsms_tuvan_attachfile(zalo_token, userid, fileToken);
    if (rs && rs.responseData && rs.responseData.data) {
      var data = rs.responseData.data;
      var message_id = data.message_id;
      var user_id = data.user_id;
      if (message_id && user_id) zalo_sendsms_tuvan_trichdan(zalo_token, user_id, message_id, text_message);
    }
  } catch (e) { console.error("Lỗi webapp_guizalo: " + e.message); }
}

function webapp_guiemail(subject, email, pdfBlob, client_name, contract, customMessage) {
  try {
    const emailMessage = customMessage || "";
    const branch = contract && contract.branches;
    const currentScriptUrl = ScriptApp.getService().getUrl();
    
    if (branch && branch.url_guimail && branch.url_guimail.startsWith('http') && branch.url_guimail !== currentScriptUrl) {
      const payload = { "email": email, "name": client_name, "subject": subject, "message": emailMessage };
      if (pdfBlob) {
        payload.pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());
        payload.fileName = `HD_${contract.id}_${client_name}.pdf`;
      }
      UrlFetchApp.fetch(branch.url_guimail, { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true });
      return;
    }

    sendEmailActual(subject, email, pdfBlob, client_name, emailMessage);
  } catch (e) { console.error("Lỗi webapp_guiemail: " + e.message); }
}

function sendEmailActual(subject, email, pdfBlob, client_name, message) {
  let htmlBody = "";
  if (message && (message.indexOf("<html") !== -1 || message.indexOf("<!DOCTYPE") !== -1)) {
    htmlBody = message;
  } else {
    htmlBody = message ? `<div style="font-family:Arial;white-space:pre-wrap;">${message}</div>` : `Chào ${client_name}, vui lòng xem đính kèm.`;
  }
  const mailOptions = { htmlBody: htmlBody, name: "Eva's Fit" };
  if (pdfBlob) mailOptions.attachments = [pdfBlob];
  GmailApp.sendEmail(email, subject, "", mailOptions);
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
        } else if (u > 0) res += units[u];
        return res;
    }
    let groups = [];
    let n = Math.abs(number);
    while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
    const labels = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    let res = "";
    for (let i = groups.length - 1; i >= 0; i--) {
        let g = readGroup(groups[i]);
        if (g !== "") res += g + " " + labels[i] + " ";
    }
    return res.trim().charAt(0).toUpperCase() + res.trim().slice(1) + " đồng chẵn";
}

// TELEGRAM CONFIG (Lưu giữ từ phần bạn đã thêm)
const TELEGRAM_BOT_TOKEN = "8618264496:AAFScnM8zwMysNnre72kCc6DUDSGTwWSzcA";
const TELEGRAM_GROUP_ID = "-5259611743";

function tg_log(level, context, message) {
  try {
    const emoji = level === "ERROR" || level === "LỖI" ? "🔴" : level === "WARN" ? "🟡" : "🟢";
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
    const text = `${emoji} *[${level}]* \`${context}\`\n📅 ${timestamp}\n📝 ${message}`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ chat_id: TELEGRAM_GROUP_ID, text: text, parse_mode: "Markdown" }),
      muteHttpExceptions: true
    });
  } catch (e) {
    console.error("Telegram log thất bại: " + e.message);
  }
}