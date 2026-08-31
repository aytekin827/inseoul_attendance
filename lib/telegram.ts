/**
 * 텔레그램 알림 발송 유틸리티
 */
export async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram Alert] TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID 환경 변수가 설정되지 않았습니다.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Telegram Alert] 텔레그램 알림 전송 실패:", errText);
    } else {
      console.log("[Telegram Alert] 텔레그램 알림 전송 완료");
    }
  } catch (error) {
    console.error("[Telegram Alert] 알림 전송 중 예기치 않은 오류 발생:", error);
  }
}
