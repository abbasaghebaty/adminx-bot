/**
 * Telegram Bot API
 *
 * مسیر:
 * src/api/telegram.js
 *
 * مسئول:
 * - ارتباط با Telegram Bot API
 * - ارسال درخواست
 * - ارسال پیام
 */

const TELEGRAM_API = 'https://api.telegram.org';

async function telegramRequest(method, payload, env) {
  if (!env?.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is missing');
  }

  const url = `${TELEGRAM_API}/bot${env.BOT_TOKEN}/${method}`;

  const response = await fetch(url, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log('Telegram API:', method, JSON.stringify(data));

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram API error: ${method} - ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function sendMessage(
  chatId,
  text,
  env,
  options = {},
) {
  return telegramRequest(
    'sendMessage',
    {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    },
    env,
  );
}
