exports.handler = async (event) => {

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const data = JSON.parse(event.body);

  const message = `
📥 NEW LOAN APPLICATION

👤 Name: ${data.fullName}
📧 Email: ${data.email}
💰 Amount: $${data.amount}
📅 Duration: ${data.duration} months
🌍 Country: ${data.country}
`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message
    })
  });

  return {
    statusCode: 200,
    body: "Telegram sent"
  };
};
