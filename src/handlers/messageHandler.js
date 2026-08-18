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

این ادمین توسط AdminX