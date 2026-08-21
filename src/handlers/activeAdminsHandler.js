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


function utf16Length(value) {
  return [...String(value ?? '')]
    .reduce(
      (length, character) =>
        length +
        (character.codePointAt(0) > 0xffff
          ? 2
          : 1),
      0,
    );
}


function buildTopAdminsMessage(data) {
  if (!data.total) {
    return {
      text: [
        '👑 ادمین‌های برتر',
        '',
        'فعلاً ادمینی ثبت نشده است.',
      ].join('\n'),

      entities: [
        {
          type: 'bold',
          offset: 0,
          length: utf16Length(
            '👑 ادمین‌های برتر',
          ),
        },
      ],
    };
  }


  const lines = [
    '👑 ادمین‌های برتر',
    '',
  ];

  const entities = [
    {
      type: 'bold',
      offset: 0,
      length: utf16Length(
        '👑 ادمین‌های برتر',
      ),
    },
  ];


  for (const admin of data.admins) {
    const displayName =
      String(
        admin?.display_name ??
          'بدون نام',
      ).trim() || 'بدون نام';

    const telegramId =
      String(
        admin?.telegram_id ??
          '',
      ).trim();


    const line =
      telegramId
        ? `🆔 ${displayName}`
        : displayName;


    const currentText =
      lines.join('\n');

    const prefix =
      currentText.length === 0
        ? ''
        : '\n';


    const offset =
      utf16Length(
        currentText + prefix,
      );


    lines.push(line);


    if (telegramId) {
      entities.push({
        type: 'text_mention',
        offset:
          offset +
          utf16Length('🆔 '),
        length:
          utf16Length(displayName),

        user: {
          id: Number(telegramId),
          is_bot: false,
          first_name: displayName,
        },
      });
    }
  }


  return {
    text: lines.join('\n'),
    entities,
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


  const message =
    buildTopAdminsMessage(data);


  return sendMessage(
    chatId,
    message.text,
    env,
    {
      parse_mode: undefined,
      entities:
        message.entities,

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


  const topAdminsMessage =
    buildTopAdminsMessage(
      result,
    );


  await editMessageText(
    message.chat.id,
    message.message_id,
    topAdminsMessage.text,
    env,
    {
      parse_mode: undefined,
      entities:
        topAdminsMessage.entities,

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
