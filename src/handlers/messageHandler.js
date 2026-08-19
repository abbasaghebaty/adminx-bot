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
 * نمایش منوی اصلی
 */
async function showMainMenu(
  message,
  env
) {
  return await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    message.chat.id,
    `سلام <b>${message.from.first_name || 'دوست عزیز'}</b>

به <b>آکادمی AdminX</b> خوش آمدید.

از منوی زیر گزینه موردنظر خود را انتخاب کنید.`,
    getMainMenuKeyboard()
  );
}


/**
 * نمایش منوی خرید دوره
 */
async function showCourseMenu(
  message,
  env
) {
  return await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    message.chat.id,
    `🛍 <b>خرید دوره</b>

لطفاً یکی از گزینه‌های زیر را انتخاب کنید.`,
    getCourseMenuKeyboard()
  );
}


/**
 * شروع استعلام ادمین
 */
async function startAdminVerification(
  message,
  env,
  db
) {
  await setUserState(
    db,
    message.from.id,
    USER_STATES.WAITING_FOR_ADMIN_VERIFICATION
  );

  return await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    message.chat.id,
    `🔎 <b>استعلام ادمین</b>

آیدی عددی، یوزرنیم یا پیام فورواردشده ادمین را ارسال کنید.

مثال:

<code>123456789</code>

یا:

<code>@username</code>`,
    getAdminVerificationKeyboard()
  );
}


/**
 * پردازش ورودی استعلام ادمین
 */
async function handleAdminVerificationInput(
  message,
  env,
  db
) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = message.chat.id;


  /**
   * بازگشت باید قبل از هر جستجویی بررسی شود.
   */
  if (
    message.text === COURSE_MENU_BUTTONS.BACK
  ) {
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
   * بررسی پیام Forward شده
   * =====================================================
   */

  if (message.forward_origin) {

    const origin =
      message.forward_origin;

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


    /**
     * اگر اطلاعات فرستنده اصلی در دسترس نبود
     */
    return await sendMessage(
      botToken,
      chatId,
      `⚠️ <b>امکان شناسایی فرستنده اصلی این پیام وجود ندارد.</b>

لطفاً آیدی عددی یا یوزرنیم ادمین را به صورت مستقیم ارسال کنید.`,
      getAdminVerificationKeyboard()
    );
  }


  /**
   * =====================================================
   * بررسی Telegram ID
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

این آیدی در لیست ادمین‌های تأییدشده AdminX پیدا نشد.`,
      getCourseMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * بررسی Username
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

این یوزرنیم در لیست ادمین‌های تأییدشده AdminX پیدا نشد.`,
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

لطفاً یکی از موارد زیر را ارسال کنید:

• آیدی عددی ادمین
• یوزرنیم ادمین
• پیام فورواردشده از ادمین`,
    getAdminVerificationKeyboard()
  );
}


/**
 * Handler اصلی پیام
 */
async function handleMessage(
  message,
  env
) {
  if (
    !message ||
    !message.chat ||
    !message.from
  ) {
    return;
  }

  const db = env.DB;
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;


  /**
   * =====================================================
   * /start
   *
   * هر بار state قبلی پاک می‌شود.
   * بنابراین ربات بعد از Start هیچ پیام عادی را
   * به عنوان استعلام ادمین بررسی نمی‌کند.
   * =====================================================
   */

  if (
    text === '/start' ||
    text?.startsWith('/start ')
  ) {
    await clearUserState(
      db,
      userId
    );

    return await showMainMenu(
      message,
      env
    );
  }


  /**
   * =====================================================
   * دریافت State فعلی کاربر
   * =====================================================
   */

  const userState =
    await getUserState(
      db,
      userId
    );

  const currentState =
    userState?.state || null;


  /**
   * =====================================================
   * بازگشت
   *
   * اول از همه بررسی می‌شود تا هیچ‌وقت
   * به عنوان username یا ID جستجو نشود.
   * =====================================================
   */

  if (
    text === COURSE_MENU_BUTTONS.BACK
  ) {

    /**
     * استعلام ادمین
     * → منوی خرید دوره
     */
    if (
      currentState ===
      USER_STATES.WAITING_FOR_ADMIN_VERIFICATION
    ) {
      await clearUserState(
        db,
        userId
      );

      return await showCourseMenu(
        message,
        env
      );
    }


    /**
     * منوی خرید دوره
     * → منوی اصلی
     */
    return await showMainMenu(
      message,
      env
    );
  }


  /**
   * =====================================================
   * اگر کاربر در حالت استعلام ادمین است
   *
   * فقط در این حالت پیام به عنوان
   * ID / Username / Forward بررسی می‌شود.
   * =====================================================
   */

  if (
    currentState ===
    USER_STATES.WAITING_FOR_ADMIN_VERIFICATION
  ) {
    return await handleAdminVerificationInput(
      message,
      env,
      db
    );
  }


  /**
   * =====================================================
   * دکمه خرید دوره
   * =====================================================
   */

  if (
    text ===
    MAIN_MENU_BUTTONS.BUY_COURSE
  ) {
    return await showCourseMenu(
      message,
      env
    );
  }


  /**
   * =====================================================
   * دریافت شماره کارت
   * =====================================================
   */

  if (
    text ===
    COURSE_MENU_BUTTONS.GET_CARD
  ) {
    return await sendMessage(
      botToken,
      chatId,
      `💳 <b>دریافت شماره کارت</b>

اطلاعات پرداخت دوره در این بخش نمایش داده می‌شود.`,
      getCourseMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * استعلام ادمین
   * =====================================================
   */

  if (
    text ===
    COURSE_MENU_BUTTONS.VERIFY_ADMIN
  ) {
    return await startAdminVerification(
      message,
      env,
      db
    );
  }


  /**
   * =====================================================
   * کسب درآمد
   * =====================================================
   */

  if (
    text ===
    MAIN_MENU_BUTTONS.EARN_MONEY
  ) {
    return await sendMessage(
      botToken,
      chatId,
      `💰 <b>کسب درآمد</b>

از این بخش می‌توانید اطلاعات مربوط به کسب درآمد را مشاهده کنید.`,
      getMainMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * راهنما و پشتیبانی
   * =====================================================
   */

  if (
    text ===
    MAIN_MENU_BUTTONS.SUPPORT
  ) {
    return await sendMessage(
      botToken,
      chatId,
      `❓ <b>راهنما و پشتیبانی</b>

در صورت نیاز به راهنمایی، از طریق پشتیبانی AdminX اقدام کنید.`,
      getMainMenuKeyboard()
    );
  }


  /**
   * =====================================================
   * پیام ناشناخته
   *
   * مهم:
   * دیگر هیچ پیام عادی به عنوان استعلام
   * ادمین پردازش نمی‌شود.
   * =====================================================
   */

  return await sendMessage(
    botToken,
    chatId,
    'لطفاً یکی از گزینه‌های موجود در منو را انتخاب کنید.',
    getMainMenuKeyboard()
  );
}
