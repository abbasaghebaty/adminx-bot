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

function buildAdminMention(
  admin,
) {
  const telegramId =
    String(
      admin?.telegram_id ?? '',
    ).trim();

  const displayName =
    escapeHtml(
      admin?.display_name ??
        'بدون نام',
    );

  if (!telegramId) {
    return displayName;
  }

  return (
    `<a href="tg://user?id=${encodeURIComponent(telegramId)}">` +
    `${displayName}` +
    `</a>`
  );
}

function buildTopAdminsMessage(
  data,
) {
  if (!data.total) {
    return [
      '<b>👑 ادمین‌های برتر</b>',
      '',
      'فعلاً ادمینی ثبت نشده است.',
    ].join('\n');
  }

  const lines =
    data.admins.map(
      (admin, index) => {
        const number =
          String(
            (data.page - 1) *
              10 +
              index +
              1,
          ).padStart(2, '0');

        return (
          `${number}. ` +
          buildAdminMention(admin)
        );
      },
    );

  return [
    '<b>👑 ادمین‌های برتر</b>',
    '',
    ...lines,
    '',
    `صفحه <b>${data.page}</b> از <b>${data.totalPages}</b>`,
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
  const data =
    callbackQuery.data ?? '';

  if (
    !data.startsWith(
      'top_admins:',
    )
  ) {
    return false;
  }

  const page =
    Number(
      data.split(':')[1],
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
