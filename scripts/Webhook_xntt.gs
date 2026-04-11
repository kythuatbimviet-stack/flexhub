/**
 * Webhook_xntt.gs
 * Chuyên xử lý gửi Email Xác nhận thanh toán (XNTT) từ bảng xntt_history
 */

const SUPABASE_URL = "https://iecyckrbxtofxfweaipy.supabase.co";
// Lưu ý: Key này cần quyền service_role để update status vào DB
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllY3lja3JieHRvZnhmd2VhaXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwNjg2OCwiZXhwIjoyMDg1MzgyODY4fQ.Au_R-BZ8H_XyQfMICAZakT3ad_yT0iHcg0fsU6kIOpM";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const record = payload.record; // Dữ liệu dòng mới chèn vào xntt_history
    const type = payload.type;   // INSERT

    console.log("XNTT Event Type: " + type + " | Log ID: " + record.id);

    // Chỉ xử lý khi là dòng mới chèn vào (INSERT)
    if (type !== 'INSERT') {
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Only INSERT is handled" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Xử lý gửi Email dựa trên send_payload
    try {
      const xnttData = JSON.parse(record.send_payload); // { email, subject, htmlBody }
      
      if (!xnttData.email || !xnttData.subject || !xnttData.htmlBody) {
        throw new Error("Payload XNTT thiếu email/subject/htmlBody");
      }

      console.log("Đang gửi XNTT tới: " + xnttData.email);

      // Gửi Email qua Gmail
      GmailApp.sendEmail(xnttData.email, xnttData.subject, "", {
        htmlBody: xnttData.htmlBody,
        name: "Eva's Fit"
      });

      // Cập nhật trạng thái 'done' về Supabase bảng xntt_history
      updateXnttHistoryStatus(record.id, 'done');
      console.log("Gửi XNTT thành công cho Log ID: " + record.id);

    } catch (err) {
      console.error("Lỗi xử lý XNTT: " + err.message);
      updateXnttHistoryStatus(record.id, 'error');
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Critical Error in Webhook_xntt: " + error.message);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Cập nhật trạng thái gửi vào bảng xntt_history
 */
function updateXnttHistoryStatus(logId, status) {
  const url = `${SUPABASE_URL}/rest/v1/xntt_history?id=eq.${logId}`;
  const options = {
    method: "patch",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY
    },
    payload: JSON.stringify({ status: status })
  };
  UrlFetchApp.fetch(url, options);
}
