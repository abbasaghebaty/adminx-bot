import { sendMessage } from '../api/telegram.js';

import {
  getMainMenuKeyboard,
  MAIN_MENU_BUTTONS,
} from '../keyboards/mainMenu.js';

import { LINKS } from '../config/links.js';

import { TRUST_MESSAGE } from '../messages/trust.js';
import { ABOUT_MESSAGE } from '../messages/about.js';

import {
  handleAdminRegistrationMessage,
  startAdminRegistration,
} from './adminHandler.js';

import {
  sendActiveAdmins,
} from './activeAdminsHandler.js';

export async function handleMessage(
  message,
  env,
  ctx,
) {
  const text = message.text;
  const chatId = message.chat.id;

  const handledByAdminSession =
    await handleAdminRegistrationMessage(
      message,
      env,
      ctx,
    );

  if (handledByAdminSession) {
    return;
  }

  if (
    text ===
    MAIN_MENU_BUTTONS.ACTIVE_ADMINS
  ) {
    await sendActiveAdmins(
      chatId,
      env,
      1,
    );

    return;
  }

  if (
    text ===
    MAIN_MENU_BUTTONS.MANAGE_ADMINS
  ) {
    await startAdminRegistration(
      message,
      env,
    );

    return;
  }

  if (
    text ===
    MAIN_MENU_BUTTONS.CHANNEL
  ) {
    await sendMessage(
      chatId,
      '📢 کانال اصلی AdminX:',
      env,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'ورود به کانال',
                url: LINKS.MAIN_CHANNEL,
              },
            ],
          ],
        },
      },
    );

    return;
  }

  if (
    text ===
    MAIN_MENU_BUTTONS.TRUST
  ) {
    await sendMessage(
      chatId,
      TRUST_MESSAGE,
      env,
      {
        reply_markup:
          getMainMenuKeyboard(),
      },
    );

    return;
  }

  if (
    text ===
    MAIN_MENU_BUTTONS.SUPPORT
  ) {
    await sendMessage(
      chatId,
      '💬 <b>پشتیبانی AdminX</b>\n\n' +
        'یکی از راه‌های ارتباطی زیر را انتخاب کنید:',
      env,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '👨‍💻 پشتیبانی آموزش',
                url: LINKS.EDUCATION_ADMIN,
              },
            ],
            [
              {
                text: '👑 مدیریت ارشد',
                url: LINKS.OWNER_ADMIN,
              },
            ],
          ],
        },
      },
    );

    return;
  }

  if (
    text ===
    MAIN_MENU_BUTTONS.ABOUT
  ) {
    await sendMessage(
      chatId,
      ABOUT_MESSAGE,
      env,
      {
        reply_markup:
          getMainMenuKeyboard(),
      },
    );

    return;
  }

  if (
    text ===
    MAIN_MENU_BUTTONS.SUGGESTIONS
  ) {
    await sendMessage(
      chatId,
      '📮 <b>صندوق انتقادات و پیشنهادات</b>\n\n' +
        'برای ارسال نظر، پیشنهاد یا انتقاد خود وارد صندوق زیر شوید.',
      env,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📮 ورود به صندوق',
                url: LINKS.SUGGESTIONS,
              },
            ],
          ],
        },
      },
    );
  }
}
