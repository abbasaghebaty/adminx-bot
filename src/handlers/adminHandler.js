import {
  sendMessage,
  getChat,
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
  return String(value ?? '')
    .replaceAll(
      '&',
      '&amp;',
    )
    .replaceAll(
      '<',
      '&lt;',
    )
    .replaceAll(
      '>',
      '&gt;',
    )
    .replaceAll(
      '"',
      '&quot;',
    )
    .replaceAll(
      "'",
      '&#039;',
    );
}


function parseAdminInput(text) {
  const trimmed =
    String(text ?? '').trim();

  const ids =
    trimmed.match(
      /\b\d{5,20}\b/g,
    ) ?? [];

  if (!ids.length) {
    return {
      ok: false,
      error:
        '❌ <b>آیدی عددی</b> را وارد نکردی.\n\n' +
        'مثال:\n' +
        '<code>عباس عاقبتی 123456789</code>',
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

  const telegramId =
    Number(ids[0]);

  if (
    !Number.isSafeInteger(
      telegramId,
    )
  ) {
    return {
      ok: false,
      error:
        '❌ آیدی عددی واردشده معتبر نیست.',
    };
  }

  const displayName =
    trimmed
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

  if (
    displayName.length > 128
  ) {
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
  const sent =
    await sendMessage(
      message.chat.id,
      text,
      env,
    );

  const messageId =
    sent?.result?.message_id;

  if (
    Number.isInteger(
      messageId,
    )
  ) {
    await addSessionMessage(
      env.DB,
      telegramId,
      messageId,
    );
  }
}


async function validateTelegramUser(
  telegramId,
  env,
) {
  try {
    const result =
      await getChat(
        telegramId,
        env,
      );

    const chat =
      result?.result;

    if (!chat) {
      return {
        ok: false,
        error:
          '❌ Telegram اطلاعات این کاربر را برنگرداند.',
      };
    }

    if (
      chat.type !== 'private'
    ) {
      return {
        ok: false,
        error:
          '❌ این آیدی مربوط به یک کاربر خصوصی نیست.',
      };
    }

    return {
      ok: true,
      user: chat,
    };
  } catch (error) {
    console.error(
      'GET CHAT ERROR:',
      error,
    );

    return {
      ok: false,
      error:
        '❌ این کاربر هنوز با ربات تعامل نکرده است.\n\n' +
        'ابتدا کاربر باید ربات را باز کند و <b>/start</b> بزند، ' +
        'بعد دوباره او را به لیست ادمین‌های برتر اضافه کن.',
    };
  }
}


async function handleAdminRegistration(
  message,
  env,
  ctx,
) {
  const telegramId =
    message.from.id;

  const chatId =
    message.chat.id;

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
    parseAdminInput(
      message.text,
    );

  if (!parsed.ok) {
    await sendTemporaryError(
      message,
      env,
      telegramId,
      parsed.error,
    );

    return true;
  }


  const target =
    await validateTelegramUser(
      parsed.telegramId,
      env,
    );

  if (!target.ok) {
    await sendTemporaryError(
      message,
      env,
      telegramId,
      target.error,
    );

    return true;
  }


  const { existed } =
    await createAdmin(
      env.DB,
      parsed.telegramId,
      parsed.displayName,
    );


  const successText =
    existed
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
    );

  const successMessageId =
    successMessage?.result?.message_id;


  await deleteSessionMessages(
    env,
    chatId,
    telegramId,
  );


  if (
    Number.isInteger(
      successMessageId,
    )
  ) {
    ctx.waitUntil(
      new Promise(
        (resolve) => {
          setTimeout(
            async () => {
              await deleteMessages(
                chatId,
                [
                  successMessageId,
                ],
                env,
              ).catch(
                (error) => {
                  console.error(
                    'SUCCESS MESSAGE DELETE ERROR:',
                    error,
                  );
                },
              );

              resolve();
            },
            10_000,
          );
        },
      ),
    );
  }

  return true;
}


export async function startAdminRegistration(
  message,
  env,
) {
  const telegramId =
    message.from.id;

  if (
    !(await isBotAdmin(
      env.DB,
      telegramId,
      env,
    ))
  ) {
    return false;
  }

  await startAdminSession(
    env.DB,
    telegramId,
  );

  await sendMessage(
    message.chat.id,
    '👑 <b>مدیریت ادمین‌های برتر</b>\n\n' +
      'اطلاعات ادمین را در قالب زیر ارسال کن:\n\n' +
      '<code>نام نمایشی آیدی عددی</code>\n\n' +
      'مثال:\n' +
      '<code>عباس عاقبتی 123456789</code>\n\n' +
      '⚠️ ادمین موردنظر باید ابتدا ربات را باز کند و <b>/start</b> بزند.',
    env,
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
    [
      message.message_id,
    ],
    env,
  ).catch(
    (error) => {
      console.error(
        'START MESSAGE CLEANUP ERROR:',
        error,
      );
    },
  );
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
      env,
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
