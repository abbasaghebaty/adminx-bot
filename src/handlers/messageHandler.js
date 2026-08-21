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
  sendTopAdmins,
} from './activeAdminsHandler.js';

import {
  isBotAdmin,
} from '../database/admins.js';

export async function handleMessage(
  message,
  env,
  ctx,
) {
  const text =
    message.text?.trim();

  const chatId =
    message.chat.id;

  if (!text) {
    return;
  }

  /*
   * اگر کاربر در حالت مدیریت ادمین باشد،
   * پیام او باید اول توسط سیستم مدیریت ادمین بررسی شود.
   *
   * تشخیص دسترسی فقط با آیدی عددی ثابت
   * داخل admins.js انجام می‌شود.
   */
  const handledByAdminSession =
    await handleAdminRegistrationMessage(
      message,
      env,
      ctx,
    );

  if (handledByAdminSession) {
    return;
  }

  /*
   * ادمین‌های برتر
   *
   * اگر کاربر یکی از ادمین‌های اصلی باشد:
   * وارد حالت مدیریت و افزودن ادمین می‌شود.
   *
   * اگر ادمین اصلی نباشد:
   * فقط لیست ادمین‌های برتر نمایش داده می‌شود.
   */
  if (
    text ===
    MAIN_MENU_BUTTONS.TOP_ADMINS
  ) {
    const isAdmin =
      isBotAdmin(
        null,
        message.from.id,
      );

    if (isAdmin) {
      const started =
        await startAdminRegistration(
          message,
          env,
        );

      if (!started) {
        await sendMessage(
          chatId,
          '❌ <b>خطا در ورود به مدیریت ادمین‌ها</b>\\n\\n' +
            'سیستم نتوانست حالت مدیریت ادمین را فعال کند.',
          env,
        );
      }

      return;
    }

    await sendTopAdmins(
      chatId,
      env,
      1,
    );

    return;
  }

  /*
   * دستور مستقیم مدیریت ادمین‌ها
   *
   * این مسیر هم همچنان فقط برای
   * دو آیدی اصلی مجاز است.
   */
  if (
    text === '/manage_admins'
  ) {
    const isAdmin =
      isBotAdmin(
        null,
        message.from.id,
      );

    if (!isAdmin) {
      await sendMessage(
        chatId,
        '❌ <b>دسترسی غیرمجاز</b>\\n\\n' +
          'شما دسترسی مدیریت ادمین‌ها را ندارید.',
        env,
      );

      return;
    }

    const started =
      await startAdminRegistration(
        message,
        env,
      );

    if (!started) {
      await sendMessage(
        chatId,
        '❌ <b>خطا در ورود به مدیریت ادمین‌ها</b>\\n\\n' +
          'سیستم نتوانست حالت مدیریت ادمین را فعال کند.',
        env,
      );
    }

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
      '💬 <b>پشتیبانی AdminX</b>\\n\\n' +
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
      '📮 <b>صندوق انتقادات و پیشنهادات</b>\\n\\n' +
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
