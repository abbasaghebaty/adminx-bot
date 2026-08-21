import {
  answerCallbackQuery,
  editMessageText,
  sendMessage,
} from '../api/telegram.js';

import {
  listAdmins,
} from '../database/admins.js';

import {
  getAdminsPaginationKeyboard,
} from '../keyboards/adminsKeyboard.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildAdminMention(admin) {
  const telegramId =
    String(
      admin?.telegram_id ?? '',
    ).trim();

  const displayName =
    escapeHtml(
      admin?.display_name ??
        'بدون نام',
    );

  /*
   * اگر آیدی وجود نداشت،
   * فقط اسم نمایش داده شود.
   */
  if (!telegramId) {
    return displayName;
  }

  /*
   * فقط خود اسم لینک است.
   *
   * 🆔 خارج از تگ <a> قرار می‌گیرد.
   */
  return (
    `🆔 ` +
    `<a href="tg://user?id=${encodeURIComponent(telegramId)}">` +
    `${displayName}` +
    `</a>`
  );
}

function buildTopAdminsMessage(data) {
  if (!data.total) {
    return [
      '<b>👑 ادمین‌های برتر</b>',
      '',
      'فعلاً ادمینی ثبت نشده است.',
    ].join('\n');
  }

  const lines =
    data.admins.map(
      (admin) =>
        buildAdminMention(admin),
    );

  return [
    '<b>👑 ادمین‌های برتر</b>',
    '',
    ...lines,
  ].join('\n');
}

export async function sendTopAdmins(
  chatId,
  env,
  page = 1,
) {
  const data =
    await listAdmins(
      env.DB,
      page,
      10,
    );

  return sendMessage(
    chatId,
    buildTopAdminsMessage(data),
    env,
    {
      reply_markup:
        getAdminsPaginationKeyboard(
          data.page,
          data.totalPages,
        ),
    },
  );
}

export async function handleTopAdminsCallback(
  callbackQuery,
  env,
) {
  const callbackData =
    callbackQuery.data ?? '';

  if (
    !callbackData.startsWith(
      'top_admins:',
    )
  ) {
    return false;
  }

  const page =
    Number(
      callbackData.split(':')[1],
    );

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    await answerCallbackQuery(
      callbackQuery.id,
      env,
      {
        text:
          'صفحه نامعتبر است.',
        show_alert: true,
      },
    );

    return true;
  }

  const message =
    callbackQuery.message;

  if (!message) {
    await answerCallbackQuery(
      callbackQuery.id,
      env,
    );

    return true;
  }

  const result =
    await listAdmins(
      env.DB,
      page,
      10,
    );

  await editMessageText(
    message.chat.id,
    message.message_id,
    buildTopAdminsMessage(
      result,
    ),
    env,
    {
      reply_markup:
        getAdminsPaginationKeyboard(
          result.page,
          result.totalPages,
        ),
    },
  );

  await answerCallbackQuery(
    callbackQuery.id,
    env,
  );

  return true;
}
