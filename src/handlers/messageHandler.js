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
  getAdminVerificationKeyboard,
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

  if (/^@?[a-zA-Z0-9_]{5,32}$/.test(value)) {
    return value;
  }

  return null;
}


/**
 * استخراج Telegram ID از متن
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
 * ارسال منوی خرید دوره
 */
async function showCourseMenu(
  message,
  env
) {
  return await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    message.chat.id,
    '🛍 <b>خرید دوره</b>\n\nلطفاً یکی از گزینه‌های زیر را انتخاب کنید.',
    getCourseMenuKeyboard()
  );
}


/**
 * ورود به حالت استعلام ادمین
 */
async function startAdminVerification(
  message,
  env,
  db
) {
  await setUserState(
    db,
    message.from.id,
    USER_STATES.ADMIN_VERIFICATION
  );

  return await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    message.chat.id,
    `🔎 <b>استعلام ادمین</b>

آیدی عددی یا username ادمین را ارسال کنید.

مثال:
<code>123456789</code>

یا:

<code>@username</code>`,
    getAdminVerificationKeyboard()
  );
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

  /**
   * خیلی مهم:
   * بازگشت نباید هیچ‌وقت وارد جستجوی ادمین شود.
   */
  if (message.text === '← بازگشت') {
    await clearUserState(
      db,
      message.from.id
    );

    return await showCourseMenu(
      message,
      env
    );
  }

  if (!db) {
    return await sendMessage(
      botToken,
      chatId,
      '❌ در حال حاضر امکان استعلام وجود ندارد. لطفاً بعداً دوباره تلاش کنید.',
      getAdminVerificationKeyboard()
    );
  }


  /**
   * =====================================================
   * Forward شده
   * =====================================================
   */

  if (message.forward_origin) {

    const origin = message.forward_origin;

    console.log(
      '📨 Forward origin:',
      JSON.stringify(origin)
    );

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

با اطمینان کامل می‌توانید با این ادمین همکاری کنید.`,
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
   * Telegram ID
   * =====================================================
   */

  const telegramId =
    extractTelegramId(message.text);

  if (telegramId) {

    console.log(
      `🔎 Checking admin Telegram ID: ${telegramId}`
    );

    const admin =
      await checkAdminValidityByTelegramId(
        db,
        telegramId
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

با اطمینان کامل می‌توانید با این ادمین همکاری کنید.`,
        getCourseMenuKeyboard()
      );
    }

    return await sendMessage(
      botToken,
      chatId,
      `❌ <b>این ادمین معتبر نیست</b>

این آیدی در لیست ادمین‌های تأییدشده AdminX پیدا نشد.

⚠️ قبل از هرگونه پرداخت یا همکاری، از معتبر بودن ادمین اطمینان حاصل کنید.`,
      getCourseMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * Username
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

با اطمینان کامل می‌توانید با این ادمین همکاری کنید.`,
        getCourseMenuKeyboard()
      );
    }

    return await sendMessage(
      botToken,
      chatId,
      `❌ <b>این ادمین معتبر نیست</b>

username ارسال‌شده در لیست ادمین‌های تأییدشده AdminX پیدا نشد.

⚠️ قبل از هرگونه پرداخت یا همکاری، از معتبر بودن ادمین اطمینان حاصل کنید.`,
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
    `❌ <b>فرمت واردشده صحیح نیست.</b>

لطفاً آیدی عددی یا username ادمین را ارسال کنید.

مثال:
<code>123456789</code>

یا:
<code>@username</code>`,
    getAdminVerificationKeyboard()
  );
}


/**
 * =========================================================
 * Handler اصلی
 * =========================================================
 */
export async function handleMessage(
  message,
  env
) {
  if (!message || !message.chat) {
    return;
  }

  const db = env.DB;
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = message.chat.id;
  const telegramId = message.from?.id;

  if (!telegramId) {
    return;
  }


  /**
   * =====================================================
   * /start
   * =====================================================
   *
   * /start باید همیشه state قبلی را پاک کند.
   * بنابراین اگر کاربر قبلاً داخل استعلام بوده،
   * دوباره /start بزند، دیگر متن‌های بعدی استعلام نمی‌شوند.
   */
  if (
    message.text === '/start' ||
    message.text?.startsWith('/start ')
  ) {
    await clearUserState(
      db,
      telegramId
    );

    return await sendMessage(
      botToken,
      chatId,
      `سلام <b>${message.from.first_name || 'دوست عزیز'}</b>

به <b>آکادمی AdminX</b> خوش آمدید.

از منوی زیر گزینه موردنظر خود را انتخاب کنید.`,
      getMainMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * دریافت state فعلی کاربر
   * =====================================================
   */
  const currentState =
    await getUserState(
      db,
      telegramId
    );


  /**
   * =====================================================
   * بازگشت
   * =====================================================
   *
   * این شرط باید قبل از استعلام قرار داشته باشد.
   *
   * اگر کاربر داخل استعلام باشد:
   * استعلام → منوی خرید دوره
   *
   * اگر داخل استعلام نباشد:
   * منوی خرید دوره → منوی اصلی
   */
  if (message.text === '← بازگشت') {

    if (
      currentState ===
      USER_STATES.ADMIN_VER