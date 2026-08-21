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
 * - حذف پیام
 * - Callback Query
 * - ویرایش پیام
 * - Rich Messages
 */

const TELEGRAM_API =
  'https://api.telegram.org';


async function telegramRequest(
  method,
  payload,
  env,
) {
  if (!env?.BOT_TOKEN) {
    throw new Error(
      'BOT_TOKEN is missing',
    );
  }

  const url =
    `${TELEGRAM_API}/bot${env.BOT_TOKEN}/${method}`;

  const response = await fetch(
    url,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body:
        JSON.stringify(payload),
    },
  );

  const data =
    await response.json();

  console.log(
    'Telegram API:',
    method,
    JSON.stringify(data),
  );

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      `Telegram API error: ${method} - ${JSON.stringify(data)}`,
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


export async function sendRichMessage(
  chatId,
  richMessage,
  env,
  options = {},
) {
  return telegramRequest(
    'sendRichMessage',
    {
      chat_id: chatId,
      rich_message:
        richMessage,
      ...options,
    },
    env,
  );
}


export async function deleteMessage(
  chatId,
  messageId,
  env,
) {
  return telegramRequest(
    'deleteMessage',
    {
      chat_id: chatId,
      message_id: messageId,
    },
    env,
  );
}


export async function deleteMessages(
  chatId,
  messageIds,
  env,
) {
  const ids = [
    ...new Set(messageIds),
  ].filter(
    (id) =>
      Number.isInteger(id),
  );

  if (!ids.length) {
    return null;
  }

  const results = [];

  for (
    let i = 0;
    i < ids.length;
    i += 100
  ) {
    const chunk =
      ids.slice(i, i + 100);

    results.push(
      await telegramRequest(
        'deleteMessages',
        {
          chat_id: chatId,
          message_ids: chunk,
        },
        env,
      ),
    );
  }

  return results;
}


export async function answerCallbackQuery(
  callbackQueryId,
  env,
  options = {},
) {
  return telegramRequest(
    'answerCallbackQuery',
    {
      callback_query_id:
        callbackQueryId,
      ...options,
    },
    env,
  );
}


export async function editMessageText(
  chatId,
  messageId,
  text,
  env,
  options = {},
) {
  const payload = {
    chat_id: chatId,
    message_id: messageId,
    ...options,
  };

  if (
    Object.prototype.hasOwnProperty.call(
      options,
      'rich_message',
    )
  ) {
    payload.rich_message =
      options.rich_message;
  } else {
    payload.text = text;
    payload.parse_mode = 'HTML';
  }

  delete payload.rich_message_placeholder;

  return telegramRequest(
    'editMessageText',
    payload,
    env,
  );
}
