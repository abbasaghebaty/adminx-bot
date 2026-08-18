/**
 * Message Handler
 *
 * مسیر:
 * src/handlers/messageHandler.js
 *
 * مسئول پردازش:
 * - منوی اصلی
 * - خرید دوره
 * - استعلام ادمین
 * - پیام استعلام
 * - Forward استعلام
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

import {
  isFriday,
} from '../utils/date.js';

import {
  getUserByTelegramId,
  checkAdminValidity,
  checkAdminValidityByTelegramId,
} from '../database/adminVerifications.js';

import {
  USER_STATES,
  setUserState,
  getUserState,
  clearUserState,
} from '../database/userStates.js';


/**
 * استخراج Username از متن
 */
function extractUsername(text) {
  if (!text) {
    return null;
  }

  const value = text.trim();

  // اگر فقط یک @username ارسال شده
  if (/^@?[a-zA-Z0-9_]{5,32}$/.test(value)) {
    return value;
  }

  return null;
}


/**
 * استخراج Telegram ID از متن
 *
 * اگر کاربر عدد ارسال کند، آن را به عنوان Telegram ID
 * در نظر می‌گیریم.
 */
function extractTelegramId(text) {
  if (!text) {
    return null;
  }

  const value = text.trim();

  if (/^\d{5,15}$/.test(value)) {
    return Number(value);
  }

  return null;
}


/**
 * پردازش استعلام ادمین
 */
async function handleAdminVerificationInput(
  message,
  env,
  db
) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = message.chat.id;

  if (!db) {
    return await sendMessage(
      botToken,
      chatId,
      '❌ در حال حاضر امکان استعلام وجود ندارد. لطفاً بعداً دوباره تلاش کنید.'
    );
  }

  /**
   * =====================================================
   * حالت اول: پیام Forward شده
   * =====================================================
   */

  if (message.forward_origin) {

    const origin = message.forward_origin;

    console.log(
      '📨 Forward origin:',
      JSON.stringify(origin)
    );

    /**
     * Telegram ممکن است Forward را به شکل
     * user داشته باشد.
     */
    if (
      origin.type === 'user' &&
      origin.sender_user
    ) {
      const originalUserId =
        origin.sender_user.id;

      console.log(
        `🔎 Checking forwarded user ID: ${originalUserId}`
      );

      const admin =
        await checkAdminValidityByTelegramId(
          db,
          originalUserId
        );

      await clearUserState(
        db,
        message.from.id
      );

      if (admin) {
        return await sendMessage(
          botToken,
          chatId,
          `✅ <b>ادمین معتبر است</b>

این ادمین توسط AdminX تأیید شده است.

👤 ادمین:
<b>@${admin.admin_username}</b>

می‌توانید با اطمینان بیشتری با این ادمین ادامه دهید.`,
          getCourseMenuKeyboard()
        );
      }

      return await sendMessage(
        botToken,
        chatId,
        `❌ <b>این ادمین در سیستم AdminX تأیید نشده است.</b>

اطلاعات این ادمین در لیست ادمین‌های معتبر ما پیدا نشد.

⚠️ قبل از هرگونه پرداخت، حتماً از معتبر بودن ادمین اطمینان حاصل کنید.`,
        getCourseMenuKeyboard()
      );
    }

    /**
     * اگر Telegram اطلاعات فرستنده اصلی را نداد
     */
    await clearUserState(
      db,
      message.from.id
    );

    return await sendMessage(
      botToken,
      chatId,
      `⚠️ <b>امکان شناسایی فرستنده اصلی این پیام وجود ندارد.</b>

تلگرام اطلاعات لازم برای شناسایی ادمین را در اختیار ربات قرار نداده است.

لطفاً آیدی ادمین را به صورت مستقیم ارسال کنید.`,
      getCourseMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * حالت دوم: Username
   * =====================================================
   */

  const username =
    extractUsername(message.text);

  if (username) {

    console.log(
      `🔎 Checking admin username: ${username}`
    );

    const admin =
      await checkAdminValidity(
        db,
        username
      );

    await clearUserState(
      db,
      message.from.id
    );

    if (admin) {
      return await sendMessage(
        botToken,
        chatId,
        `✅ <b>ادمین معتبر است</b>

این ادمین توسط AdminX تأیید شده است.

👤 ادمین:
<b>@${admin.admin_username}</b>

می‌توانید با اطمینان بیشتری با این ادمین ادامه دهید.`,
        getCourseMenuKeyboard()
      );
    }

    return await sendMessage(
      botToken,
      chatId,
      `❌ <b>این ادمین در سیستم AdminX تأیید نشده است.</b>

این آیدی در لیست ادمین‌های معتبر ما پیدا نشد.

⚠️ قبل از هرگونه پرداخت، حتماً از معتبر بودن ادمین اطمینان حاصل کنید.`,
      getCourseMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * حالت سوم: Telegram ID
   * =====================================================
   */

  const telegramId =
    extractTelegramId(message.text);

  if (telegramId) {

    console.log(
      `🔎 Checking admin Telegram ID: ${telegramId}`
    );

    const user =
      await getUserByTelegramId(
        db,
        telegramId
      );

    let admin = null;

    if (user) {
      admin =
        await checkAdminValidityByTelegramId(
          db,
          telegramId
        );
    }

    await clearUserState(
      db,
      message.from.id
    );

    if (admin) {
      return await sendMessage(
        botToken,
        chatId,
        `✅ <b>ادمین معتبر است</b>

این ادمین توسط AdminX تأیید شده است.

👤 ادمین:
<b>@${admin.admin_username}</b>`,
        getCourseMenuKeyboard()
      );
    }

    return await sendMessage(
      botToken,
      chatId,
      `❌ <b>این ادمین در سیستم AdminX تأیید نشده است.</b>

این اطلاعات در لیست ادمین‌های معتبر ما پیدا نشد.`,
      getCourseMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * ورودی نامعتبر
   * =====================================================
   */

  return await sendMessage(
    botToken,
    chatId,
    `⚠️ اطلاعات قابل شناسایی نبود.

لطفاً آیدی ادمین یا یک پیام از طرف همان ادمین را ارسال کنید.`,
    getCourseMenuKeyboard()
  );
}


/**
 * Handler اصلی
 */
export async function handleMessage(
  message,
  env,
  db
) {
  try {

    const text = message.text || '';
    const chatId = message.chat.id;
    const botToken = env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error(
        '❌ Bot token not available'
      );
      return;
    }

    if (!chatId) {
      console.error(
        '❌ Chat ID not available'
      );
      return;
    }


    /**
     * =====================================================
     * اگر کاربر در State خاصی باشد
     * =====================================================
     */

    if (db && message.from?.id) {

      const user =
        await getUserByTelegramId(
          db,
          message.from.id
        );

      if (user) {

        const state =
          await getUserState(
            db,
            user.id
          );

        if (
          state?.state ===
          USER_STATES.WAITING_FOR_ADMIN_VERIFICATION
        ) {
          return await handleAdminVerificationInput(
            message,
            env,
            db
          );
        }
      }
    }


    /**
     * =====================================================
     * منوی اصلی
     * =====================================================
     */

    switch (text) {

      /**
       * 🛍 خرید دوره
       */
      case MAIN_MENU_BUTTONS.BUY_COURSE:

        return await sendMessage(
          botToken,
          chatId,
          `🛍 <b>خرید دوره AdminX</b>

برای ادامه یکی از گزینه‌های زیر را انتخاب کنید:`,
          getCourseMenuKeyboard()
        );


      /**
       * 💳 دریافت شماره کارت
       */
      case COURSE_MENU_BUTTONS.GET_CARD:

        if (isFriday()) {

          return await sendMessage(
            botToken,
            chatId,
            `📅 <b>دریافت شماره کارت فعلاً فعال نیست.</b>

امروز جمعه است.

ان‌شاءالله از <b>شنبه</b> می‌توانید شماره کارت را دریافت کنید.`,
            getCourseMenuKeyboard()
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

⚠️ قبل از پرداخت، حتماً از بخش <b>🔎 استعلام ادمین</b> معتبر بودن ادمین را بررسی کنید.`,
          getCourseMenuKeyboard()
        );


      /**
       * 🔎 استعلام ادمین
       */
      case COURSE_MENU_BUTTONS.VERIFY_ADMIN:

        if (!db) {
          return await sendMessage(
            botToken,
            chatId,
            '❌ سرویس استعلام در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.'
          );
        }

        const currentUser =
          await getUserByTelegramId(
            db,
            message.from.id
          );

        if (!currentUser) {
          return await sendMessage(
            botToken,
            chatId,
            '❌ اطلاعات حساب شما پیدا نشد. لطفاً ابتدا /start را بزنید.'
          );
        }

        await setUserState(
          db,
          currentUser.id,
          USER_STATES.WAITING_FOR_ADMIN_VERIFICATION
        );

        return await sendMessage(
          botToken,
          chatId,
          `🔎 <b>استعلام معتبر بودن ادمین</b>

جهت استعلام معتبر بودن ادمین، یکی از موارد زیر را ارسال کنید:

• آیدی ادمین
• یا یک پیام از طرف همان ادمین را برای ربات ارسال کنید.

سیستم پس از دریافت اطلاعات، معتبر بودن ادمین را بررسی می‌کند.`,
          getCourseMenuKeyboard()
        );


      /**
       * 🔙 بازگشت
       */
      case COURSE_MENU_BUTTONS.BACK:

        if (db && message.from?.id) {
          const currentUser =
            await getUserByTelegramId(
              db,
              message.from.id
            );

          if (currentUser) {
            await clearUserState(
              db,
              currentUser.id
            );
          }
        }

        return await sendMessage(
          botToken,
          chatId,
          `🏠 <b>منوی اصلی</b>

گزینه موردنظر خود را انتخاب کنید:`,
          getMainMenuKeyboard()
        );


      /**
       * 💰 کسب درآمد
       */
      case MAIN_MENU_BUTTONS.EARN_MONEY:

        return await sendMessage(
          botToken,
          chatId,
          `💰 <b>کسب درآمد با AdminX</b>

این بخش در حال آماده‌سازی است.`,
          getMainMenuKeyboard()
        );


      /**
       * ❓ پشتیبانی
       */
      case MAIN_MENU_BUTTONS.SUPPORT:

        return await sendMessage(
          botToken,
          chatId,
          `❓ <b>راهنما و پشتیبانی</b>

در صورت داشتن سؤال می‌توانید با پشتیبانی AdminX در ارتباط باشید.`,
          getMainMenuKeyboard()
        );


      /**
       * پیام ناشناخته
       */
      default:

        return await sendMessage(
          botToken,
          chatId,
          '🤔 متوجه نشدم! لطفاً از منوی زیر استفاده کنید.',
          getMainMenuKeyboard()
        );
    }

  } catch (error) {

    console.error(
      '❌ Error in handleMessage:',
      error.message,
      error.stack
    );

    try {

      const chatId =
        message?.chat?.id;

      const botToken =
        env?.TELEGRAM_BOT_TOKEN;

      if (chatId && botToken) {

        await sendMessage(
          botToken,
          chatId,
          '😞 متاسفانه خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.'
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
