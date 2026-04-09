// =============================================
// TELEGRAM CONFIG
// =============================================
const TELEGRAM_BOT_TOKEN = "8618264496:AAFScnM8zwMysNnre72kCc6DUDSGTwWSzcA";
const TELEGRAM_GROUP_ID = "-5259611743";

/**
 * Gửi log lỗi lên Telegram
 * @param {string} level   - "ERROR" | "WARN" | "INFO"
 * @param {string} context - Tên hàm hoặc bước đang chạy
 * @param {string} message - Nội dung lỗi
 */
function test_tele(){
   tg_log("doPost","payload","JSON.stringify(payload)")
}
function tg_log(level, context, message) {
  try {
    const emoji = level === "ERROR" ? "🔴" : level === "WARN" ? "🟡" : "🟢";
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");

    const text = `${emoji} *[${level}]* \`${context}\`\n📅 ${timestamp}\n📝 ${message}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: TELEGRAM_GROUP_ID,
        text: text,
        parse_mode: "Markdown"
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    console.error("Telegram log thất bại: " + e.message);
  }
}