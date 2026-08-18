/**
 * Message Handler
 *
 * مسیر:
 * src/handlers/messageHandler.js
 *
 * مسئول پردازش:
 * - پیام‌های عادی
 * - دکمه‌های منوی اصلی
 * - منوی خرید دوره
 * - منوی کسب درآمد
 */

import { sendMessage } from '../api/telegram.js';

import {
  MAIN_MENU_BUTTONS,
  getMainMenuKeyboard,
} from '../../keyboards/mainMenu.js';

import {
  COURSE_MENU_BUTTONS,
  getCourseMenuKeyboard,
} from '../../keyboards/courseMenu.js';

import { isFriday } from '../utils/date.js';

export async function handleMessage(message, env, db) {
  try {
    const text = message.text || '';
    const chatId = message.chat.id;
    const botToken = env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('❌ Bot token not available in handleMessage');
      return;
    }

    if (!chatId) {
      console.error('❌ Chat ID not available');
      return;
    }

    console.log(`💬 Handling message: "${text}"`);

    switch (text) {

      // =====================================================
      // 🛍 خرید دوره
      // =====================================================

      case MAIN_MENU_BUTTONS.BUY_COURSE:
        return await sendMessage(
          botToken,
          chatId,
          `🛍 <b>خرید دوره AdminX</b>

برای ادامه یکی از گزینه‌های زیر را انتخاب کنید:

💳 دریافت شماره کارت
🔎 استعلام ادمین`,
          getCourseMenuKeyboard(),
        );


      // =====================================================
      // 💳 دریافت شماره کارت
      // =====================================================

      case COURSE_MENU_BUTTONS.GET_CARD:

        // جمعه تعطیل است
        if (isFriday()) {
          return await sendMessage(
            botToken,
            chatId,
            `📅 <b>دریافت شماره کارت فعلاً فعال نیست.</b>

امروز جمعه است.

ان‌شاءالله از <b>شنبه</b> می‌توانید برای دریافت شماره کارت و ثبت‌نام دوره اقدام کنید.`,
            getCourseMenuKeyboard(),
          );
        }

        // فعلاً شماره کارت را اینجا قرار می‌دهیم
case COURSE_MENU_BUTTONS.GET_CARD:

  if (isFriday()) {
    return await sendMessage(
      botToken,
      chatId,
      `📅 <b>دریافت شماره کارت فعلاً فعال نیست.</b>

امروز جمعه است.

ان‌شاءالله از <b>شنبه</b> می‌توانید شماره کارت را دریافت کنید.`,
      getCourseMenuKeyboard(),
    );
  }

  return await sendMessage(
    botToken,
    chatId,
    `💳 <b>اطلاعات پرداخت دوره AdminX</b>

💰 مبلغ دوره:
<b>۲۰۰,۰۰۰ تومان</b>

💳 شماره کارت:
<b>0000-0000-0000-0000</b>

بعد از واریز، لطفاً <b>رسید پرداخت را برای ادمین مربوطه ارسال کنید.</b>

⚠️ قبل از واریز، حتماً از بخش <b>🔎 استعلام ادمین</b> معتبر بودن ادمین را بررسی کنید.`,
    getCourseMenuKeyboard(),
  );


      // =====================================================
      // 🔎 استعلام ادمین
      // =====================================================

      case COURSE_MENU_BUTTONS.VERIFY_ADMIN:
        return await sendMessage(
          botToken,
          chatId,
          `🔎 <b>استعلام ادمین AdminX</b>

لطفاً آیدی ادمین موردنظر را ارسال کنید.

مثال:

<code>@Amozesh_adminx</code>

یا بدون @:

<code>Amozesh_adminx</code>

سپس بررسی می‌کنیم که آیا این ادمین توسط AdminX تأیید شده است یا خیر.`,
          getCourseMenuKeyboard(),
        );


      // =====================================================
      // 🔙 بازگشت
      // =====================================================

      case COURSE_MENU_BUTTONS.BACK:
        return await sendMessage(
          botToken,
          chatId,
          `🏠 <b>منوی اصلی</b>

گزینه موردنظر خود را انتخاب کنید:`,
          getMainMenuKeyboard(),
        );


      // =====================================================
      // 💰 کسب درآمد
      // =====================================================

      case MAIN_MENU_BUTTONS.EARN_MONEY:
        return await sendMessage(
          botToken,
          chatId,
          `💰 <b>کسب درآمد با AdminX</b>

برای ورود به بخش کسب درآمد، ابتدا باید شرایط لازم را داشته باشید.

این بخش به‌زودی تکمیل می‌شود.`,
        );


      // =====================================================
      // ❓ پشتیبانی
      // =====================================================

      case MAIN_MENU_BUTTONS.SUPPORT:
        return await sendMessage(
          botToken,
          chatId,
          `❓ <b>راهنما و پشتیبانی</b>

در صورت داشتن هرگونه سؤال می‌توانید با پشتیبانی AdminX در ارتباط باشید.`,
          getMainMenuKeyboard(),
        );


      // =====================================================
      // پیام ناشناخته
      // =====================================================

      default:
        console.log(`⚠️ Unknown message: "${text}"`);

        return await sendMessage(
          botToken,
          chatId,
          '🤔 متوجه نشدم! لطفاً از منوی زیر استفاده کنید.',
          getMainMenuKeyboard(),
        );
    }

  } catch (error) {
    console.error(
      '❌ Error in handleMessage:',
      error.message,
      error.stack
    );

    try {
      const chatId = message?.chat?.id;
      const botToken = env?.TELEGRAM_BOT_TOKEN;

      if (chatId && botToken) {
        await sendMessage(
          botToken,
          chatId,
          '😞 متاسفانه خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        );
      }
    } catch (err) {
      console.error(
        'Failed to send error message:',
        err.message
      );
    }
  }
}

export default handleMessage;
