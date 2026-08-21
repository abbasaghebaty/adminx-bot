import {
  answerCallbackQuery,
  editMessageText,
  sendRichMessage,
} from '../api/telegram.js';

import {
  listAdmins,
} from '../database/admins.js';

import {
  getAdminsPaginationKeyboard,
} from '../keyboards/adminsKeyboard.js';


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


function buildTopAdminsRichHtml(
  data,
) {
  if (!data.total) {
    return [
      '<b>👑 ادمین‌های برتر</b>',
      '',
      'فعلاً ادمینی ثبت نشده است.',
    ].join('\n');
  }


  const lines = [
    '<b>👑 ادمین‌های برتر</b>',
    '',
  ];


  for (
    const admin of data.admins
  ) {
    const telegramId =
      String(
        admin?.telegram_id ?? '',
      ).trim();


    const displayName =
      escapeHtml(
        String(
          admin?.display_name ??
            'بدون نام',
        ).trim() ||
          'بدون نام',
      );


    if (!telegramId) {
      lines.push(
        displayName,
      );

      continue;
    }


    lines.push(
      `🆔 <a href="tg://user?id=${telegramId}">${displayName}</a>`,
    );
  }


  return lines.join('\n');
}


function buildTopAdminsRichMessage(
  data,
) {
  return {
    html:
      buildTopAdminsRichHtml(
        data,
      ),

    is_rtl: true,
  };
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


  return sendRichMessage(
    chatId,
    buildTopAdminsRichMessage(
      data,
    ),
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
        show_alert:
          true,
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
    null,
    env,
    {
      rich_message:
        buildTopAdminsRichMessage(
          result,
        ),

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
