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
 * - کسب درآمد
 * - درخواست ثبت حساب ادمینی
*/

import {
  startAdminApplication,
  handleAdminApplication,
} from './adminApplicationHandler.js';

import {
  EARN_MONEY_BUTTONS,
  getEarnMoneyKeyboard,
} from '../../keyboards/earnMoney.js';

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
 * =====================================================
 * استخراج Username از متن
 * =====================================================
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
 * =====================================================
 * استخراج Telegram ID از متن
 * =====================================================
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
 * =====================================================
 * نمایش منوی اصلی
 * =====================================================
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
 * =====================================================
 * نمایش منوی خرید دوره
 * =====================================================
 */

async function showCourseMenu(
  message,
  env
) {
  return await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    message.chat.id,
    `🛍 <b>خرید دوره</b>

قبل از هرگونه خرید یا پرداخت، ابتدا از معتبر بودن ادمینی که قصد همکاری با او را دارید مطمئن شوید.

برای جلوگیری از همکاری با ادمین‌های جعلی و افراد کلاهبردار، می‌توانید اطلاعات ادمین را از طریق سیستم AdminX استعلام بگیرید.

🔎 از دکمه زیر برای استعلام ادمین استفاده کنید.`,
    getCourseMenuKeyboard()
  );
}


/**
 * =====================================================
 * شروع استعلام ادمین
 * =====================================================
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
    `🔎 <b>استعلام معتبر بودن ادمین</b>

جهت استعلام معتبر بودن ادمین، یکی از موارد زیر را ارسال کنید:

• آیدی ادمین
• یا یک پیام از طرف همان ادمین را برای ربات ارسال کنید.

سیستم پس از دریافت اطلاعات، معتبر بودن ادمین را بررسی می‌کند.`,
    getAdminVerificationKeyboard()
  );
}


/**
 * =====================================================
 * پردازش ورودی استعلام ادمین
 * =====================================================
 */

async function handleAdminVerificationInput(
  message,
  env,
  db
) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = message.chat.id;


  /**
   * بازگشت
   *
   * اگر کاربر داخل استعلام باشد،
   * از استعلام خارج می‌شود و به صفحه اصلی می‌رود.
   */

  if (
    message.text === COURSE_MENU_BUTTONS.BACK
  ) {
    await clearUserState(
      db,
      message.from.id
    );

    return await showMainMenu(
      message,
      env
    );
  }


  /**
   * بررسی وجود دیتابیس
   */

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


    /**
     * Telegram اطلاعات فرستنده اصلی را دارد
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


      /**
       * State عمداً پاک نمی‌شود.
       *
       * کاربر همچنان داخل استعلام می‌ماند
       * تا خودش دکمه بازگشت را بزند.
       */

      if (admin) {
        return await sendMessage(
          botToken,
          chatId,
          `✅ <b>ادمین معتبر است</b>

این ادمین توسط AdminX تأیید شده است.

👤 ادمین:
<b>@${admin.admin_username}</b>

با اطمینان کامل می‌توانید با این ادمین همکاری کنید.`,
          getAdminVerificationKeyboard()
        );
      }

      return await sendMessage(
        botToken,
        chatId,
        `❌ <b>این ادمین در سیستم AdminX تأیید نشده است.</b>

اطلاعات این ادمین در لیست ادمین‌های معتبر ما پیدا نشد.

⚠️ قبل از هرگونه پرداخت، حتماً از معتبر بودن ادمین اطمینان حاصل کنید.`,
        getAdminVerificationKeyboard()
      );
    }


    /**
     * اطلاعات فرستنده اصلی در دسترس نیست
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


    if (admin) {
      return await sendMessage(
        botToken,
        chatId,
        `✅ <b>ادمین معتبر است</b>

این ادمین توسط AdminX تأیید شده است.

👤 ادمین:
<b>@${admin.admin_username}</b>

با اطمینان کامل می‌توانید با این ادمین همکاری کنید.`,
        getAdminVerificationKeyboard()
      );
    }


    return await sendMessage(
      botToken,
      chatId,
      `❌ <b>این ادمین معتبر نیست</b>

این آیدی در لیست ادمین‌های تأییدشده AdminX پیدا نشد.`,
      getAdminVerificationKeyboard()
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


    if (admin) {
      return await sendMessage(
        botToken,
        chatId,
        `✅ <b>ادمین معتبر است</b>

این ادمین توسط AdminX تأیید شده است.

👤 ادمین:
<b>@${admin.admin_username}</b>

با اطمینان کامل می‌توانید با این ادمین همکاری کنید.`,
        getAdminVerificationKeyboard()
      );
    }


    return await sendMessage(
      botToken,
      chatId,
      `❌ <b>این ادمین معتبر نیست</b>

این یوزرنیم در لیست ادمین‌های تأییدشده AdminX پیدا نشد.`,
      getAdminVerificationKeyboard()
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
 * =====================================================
 * Handler اصلی پیام
 * =====================================================
 */

export default async function handleMessage(
  message,
  env
) {

  /**
   * پیام نامعتبر
   */

  if (
    !message ||
    !message.chat ||
    !message.from
  ) {
    return;
  }


  const db =
    env.DB;

  const botToken =
    env.TELEGRAM_BOT_TOKEN;

  const chatId =
    message.chat.id;

  const userId =
    message.from.id;

  const text =
    message.text;


  /**
   * =====================================================
   * /start
   *
   * State قبلی کاملاً پاک می‌شود.
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
   * هر جایی که دکمه بازگشت وجود دارد،
   * فعلاً کاربر را به صفحه اصلی می‌فرستیم.
   * =====================================================
   */

  if (
    text === COURSE_MENU_BUTTONS.BACK
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
   * حالت استعلام ادمین
   *
   * تا زمانی که بازگشت نزده،
   * پیام‌ها فقط برای استعلام بررسی می‌شوند.
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
   * خرید دوره
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
      `💰 <b>کسب درآمد با AdminX</b>

اگر قصد دارید به عنوان ادمین با AdminX همکاری کنید، می‌توانید درخواست ثبت حساب ادمینی خود را ارسال کنید.

قبل از ثبت درخواست توجه داشته باشید که برای ارسال درخواست، ابتدا باید دوره را خریداری کرده باشید.

پس از ارسال درخواست، اطلاعات شما توسط تیم AdminX بررسی می‌شود و در صورت تأیید، حساب ادمینی شما در سیستم AdminX ثبت خواهد شد.

برای شروع فرآیند ثبت درخواست، گزینه زیر را انتخاب کنید.`,
      getEarnMoneyKeyboard()
    );
  }


  /**
   * =====================================================
   * درخواست ثبت حساب ادمینی
   *
   * فعلاً فقط نقطه ورود است.
   * منطق اصلی بعداً در فایل جداگانه قرار می‌گیرد.
   * =====================================================
   */

  if (
    text ===
    EARN_MONEY_BUTTONS.APPLY_ADMIN
  ) {

    return await sendMessage(
      botToken,
      chatId,
      `📝 <b>ثبت درخواست حساب ادمینی</b>

برای ثبت درخواست همکاری با AdminX، ابتدا باید دوره را خریداری کرده باشید.

پس از اطمینان از خرید دوره، می‌توانید فرآیند ثبت درخواست را شروع کنید.

⚠️ اطلاعاتی که در مراحل بعدی وارد می‌کنید باید کاملاً واقعی و متعلق به خودتان باشد. اطلاعات نادرست می‌تواند باعث رد شدن درخواست شود.`,
      getEarnMoneyKeyboard()
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
   * =====================================================
   */

  return await sendMessage(
    botToken,
    chatId,
    'لطفاً یکی از گزینه‌های موجود در منو را انتخاب کنید.',
    getMainMenuKeyboard()
  );
}
