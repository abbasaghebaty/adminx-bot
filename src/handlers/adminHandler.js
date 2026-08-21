import {
  sendMessage,
  deleteMessages,
} from '../api/telegram.js';

import {
  isBotAdmin,
  createAdmin,
} from '../database/admins.js';

import {
  getAdminSession,
  startAdminSession,
  addSessionMessage,
  finishAdminSession,
} from '../database/adminSessions.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function parseAdminInput(text) {
  const trimmed = String(text ?? '').trim();

  const ids =
    trimmed.match(/\b\d{5,20}\b/g) ?? [];

  if (ids.length === 0) {
    return {
      ok: false,
      error:
        '❌ <b>آیدی عددی</b> را وارد نکردی.\n\n' +
        'مثال:\n' +
        '<code>123456789</code>',
    };
  }

  if (ids.length > 1) {
    return {
      ok: false,
      error:
        '❌ بیش از یک آیدی عددی پیدا شد.\n\n' +
        'فقط <b>یک آیدی عددی</b> وارد کن.',
    };
  }

  const telegramId = Number(ids[0]);

  if (!Number.isSafeInteger(telegramId)) {
    return {
      ok: false,
      error:
        '❌ آیدی عددی واردشده معتبر نیست.',
    };
  }

  const displayName = trimmed
    .replace(ids[0], '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!displayName) {
    return {
      ok: false,
      error:
        '❌ <b>نام نمایشی</b> را وارد نکردی.\n\n' +
        'مثال:\n' +
        '<code>عباس عاقبتی 123456789</code>',
    };
  }

  if (displayName.length > 128) {
    return {
      ok: false,
      error:
        '❌ نام نمایشی بیش از حد طولانی است.\n\n' +
        'حداکثر ۱۲۸ کاراکتر وارد کن.',
    };
  }

  return {
    ok: true,
    telegramId,
    displayName,
  };
}

async function deleteSessionMessages(
  env,
  chatId,
  telegramId,
) {
  const messageIds =
    await finishAdminSession(
      env.DB,
      telegramId,
    );

  if (!messageIds.length) {
    return;
  }

  await deleteMessages(
    chatId,
    messageIds,
    env,
  ).catch((error) => {
    console.error(
      'SESSION CLEANUP ERROR:',
      error,
    );
  });
}

async function sendTemporaryError(
  message,
  env,
  telegramId,
  text,
) {
  const sent = await sendMessage(
    message.chat.id,
    text,
    env,
  );

  const messageId =
    sent?.result?.message_id;

  if (Number.isInteger(messageId)) {
    await addSessionMessage(
      env.DB,
      telegramId,
      messageId,
    );
  }
}

async function handleAdminRegistration(
  message,
  env,
  ctx,
) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  const session =
    await getAdminSession(
      env.DB,
      telegramId,
    );

  if (!session) {
    return false;
  }

  await addSessionMessage(
    env.DB,
    telegramId,
    message.message_id,
  );

  const parsed =
    parseAdminInput(message.text);

  if (!parsed.ok) {
    await sendTemporaryError(
      message,
      env,
      telegramId,
      parsed.error,
    );

    return true;
  }

  const { existed } =
    await createAdmin(
      env.DB,
      parsed.telegramId,
      parsed.displayName,
    );

  const successText = existed
    ? `✅ <b>اطلاعات ادمین به‌روزرسانی شد</b>\n\n` +
      `👤 ${escapeHtml(parsed.displayName)}\n` +
      `🆔 <code>${parsed.telegramId}</code>`
    : `✅ <b>ادمین جدید ثبت شد</b>\n\n` +
      `👤 ${escapeHtml(parsed.displayName)}\n` +
      `🆔 <code>${parsed.telegramId}</code>`;

  const successMessage =
    await sendMessage(
      chatId,
      successText,
      env,
      {
        disable_notification: false,
      },
    );

  const successMessageId =
    successMessage?.result?.message_id;

  await deleteSessionMessages(
    env,
    chatId,
    telegramId,
  );

  if (
    Number.isInteger(successMessageId)
  ) {
    ctx.waitUntil(
      new Promise((resolve) => {
        setTimeout(async () => {
          await deleteMessages(
            chatId,
            [successMessageId],
            env,
          ).catch((error) => {
            console.error(
              'SUCCESS MESSAGE DELETE ERROR:',
              error,
            );
          });

          resolve();
        }, 10_000);
      }),
    );
  }

  return true;
}

export async function startAdminRegistration(
  message,
  env,
) {
  if (
    !(await isBotAdmin(
      env.DB,
      message.from.id,
    ))
  ) {
    return false;
  }

  await startAdminSession(
    env.DB,
    message.from.id,
  );

  return true;
}

export async function cancelAdminRegistration(
  message,
  env,
) {
  const session =
    await getAdminSession(
      env.DB,
      message.from.id,
    );

  if (!session) {
    return;
  }

  await deleteSessionMessages(
    env,
    message.chat.id,
    message.from.id,
  );

  await deleteMessages(
    message.chat.id,
    [message.message_id],
    env,
  ).catch((error) => {
    console.error(
      'START MESSAGE DELETE ERROR:',
      error,
    );
  });
}

export async function handleAdminRegistrationMessage(
  message,
  env,
  ctx,
) {
  if (!message.text) {
    return false;
  }

  if (
    !(await isBotAdmin(
      env.DB,
      message.from.id,
    ))
  ) {
    return false;
  }

  return handleAdminRegistration(
    message,
    env,
    ctx,
  );
}
