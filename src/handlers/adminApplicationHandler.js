/**
 * Admin Application Handler
 *
 * مسیر:
 * src/handlers/adminApplicationHandler.js
 *
 * مسئول:
 * - ثبت درخواست حساب ادمینی
 * - دریافت نام
 * - دریافت نام خانوادگی
 * - دریافت شماره تلفن
 * - نگهداری State فرم
 */

import { sendMessage } from '../api/telegram.js';

import {
  EARN_MONEY_BUTTONS,
  getAdminApplicationStartKeyboard,
  getAdminApplicationBackKeyboard,
} from '../../keyboards/earnMoney.js';

import {
  USER_STATES,
  setUserState,
} from '../database/userStates.js';


/**
 * شروع فرآیند ثبت درخواست
 */
export async function startAdminApplication(
  message,
  env,
  db
) {

  await setUserState(
    db,
    message.from.id,
    USER_STATES.WAITING_FOR_ADMIN_APPLICATION_FIRST_NAME
  );

  return await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    message.chat.id,

    `📝 <b>ثبت درخواست حساب ادمینی</b>

برای شروع، لطفاً <b>نام واقعی</b> خود را وارد کنید.

⚠️ نام و اطلاعات واقعی خود را وارد کنید؛ اطلاعات نادرست ممکن است باعث رد شدن درخواست شما شود.`,

    getAdminApplicationBackKeyboard()
  );
}


/**
 * پردازش مراحل فرم
 */
export async function handleAdminApplication(
  message,
  env,
  db,
  currentState
) {

  const botToken =
    env.TELEGRAM_BOT_TOKEN;

  const chatId =
    message.chat.id;

  const text =
    message.text?.trim();


  /**
   * نام
   */

  if (
    currentState ===
    USER_STATES.WAITING_FOR_ADMIN_APPLICATION_FIRST_NAME
  ) {

    if (!text) {
      return await sendMessage(
        botToken,
        chatId,
        `❌ لطفاً نام واقعی خود را وارد کنید.`,
        getAdminApplicationBackKeyboard()
      );
    }

    await setUserState(
      db,
      message.from.id,
      USER_STATES.WAITING_FOR_ADMIN_APPLICATION_LAST_NAME
    );

    return await sendMessage(
      botToken,
      chatId,
      `👤 <b>نام ثبت شد.</b>

حالا لطفاً <b>نام خانوادگی واقعی</b> خود را وارد کنید.

⚠️ از وارد کردن نام مستعار یا اطلاعات غیرواقعی خودداری کنید.`,
      getAdminApplicationBackKeyboard()
    );
  }


  /**
   * نام خانوادگی
   */

  if (
    currentState ===
    USER_STATES.WAITING_FOR_ADMIN_APPLICATION_LAST_NAME
  ) {

    if (!text) {
      return await sendMessage(
        botToken,
        chatId,
        `❌ لطفاً نام خانوادگی واقعی خود را وارد کنید.`,
        getAdminApplicationBackKeyboard()
      );
    }

    await setUserState(
      db,
      message.from.id,
      USER_STATES.WAITING_FOR_ADMIN_APPLICATION_PHONE
    );

    return await sendMessage(
      botToken,
      chatId,
      `📱 <b>شماره تلفن</b>

لطفاً شماره تلفن خود را وارد کنید.

می‌توانید شماره را به صورت دستی ارسال کنید یا با استفاده از دکمه زیر، شماره تلفن همین حساب تلگرام را برای ما ارسال کنید.

⚠️ لطفاً شماره‌ای را ارسال کنید که متعلق به خودتان باشد.`,

      {
        keyboard: [
          [
            {
              text:
                '📱 ارسال شماره همین حساب',
              request_contact: true,
            },
          ],
          [
            {
              text:
                EARN_MONEY_BUTTONS.BACK,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      }
    );
  }


  /**
   * شماره تلفن
   */

  if (
    currentState ===
    USER_STATES.WAITING_FOR_ADMIN_APPLICATION_PHONE
  ) {

    let phoneNumber = null;


    /**
     * اگر کاربر با دکمه Contact
     * شماره خودش را ارسال کرده باشد
     */

    if (
      message.contact
    ) {

      /**
       * امنیت:
       * شماره باید متعلق به همین
       * حساب تلگرام باشد.
       */

      if (
        message.contact.user_id &&
        Number(message.contact.user_id) !==
          Number(message.from.id)
      ) {

        return await sendMessage(
          botToken,
          chatId,
          `❌ <b>شماره متعلق به این حساب نیست.</b>

لطفاً از دکمه «ارسال شماره همین حساب» استفاده کنید.`,
          getAdminApplicationBackKeyboard()
        );
      }

      phoneNumber =
        message.contact.phone_number;
    }


    /**
     * اگر شماره به صورت دستی وارد شده باشد
     */

    else if (text) {

      const normalizedPhone =
        text.replace(/[^\d+]/g, '');

      if (
        normalizedPhone.length < 8 ||
        normalizedPhone.length > 15
      ) {

        return await sendMessage(
          botToken,
          chatId,
          `❌ <b>شماره تلفن صحیح نیست.</b>

لطفاً شماره تلفن معتبر خود را وارد کنید.`,
          getAdminApplicationBackKeyboard()
        );
      }

      phoneNumber =
        normalizedPhone;
    }


    if (!phoneNumber) {

      return await sendMessage(
        botToken,
        chatId,
        `❌ لطفاً شماره تلفن خود را ارسال کنید.`,
        getAdminApplicationBackKeyboard()
      );
    }


    /**
     * فعلاً State بعدی را آماده می‌کنیم.
     *
     * در مرحله بعد اطلاعات فرم را
     * در دیتابیس ذخیره می‌کنیم.
     */

    await setUserState(
      db,
      message.from.id,
      USER_STATES.WAITING_FOR_ADMIN_APPLICATION_CONFIRMATION
    );

    return await sendMessage(
      botToken,
      chatId,

      `✅ <b>شماره تلفن دریافت شد.</b>

اطلاعات اولیه شما دریافت شد.

در مرحله بعد اطلاعات کامل درخواست شما ثبت و برای بررسی تیم AdminX ارسال خواهد شد.

⚠️ توجه: نام و نام خانوادگی باید واقعی باشند؛ اطلاعات نادرست می‌تواند باعث رد درخواست شود.`,

      getAdminApplicationBackKeyboard()
    );
  }


  /**
   * مرحله تأیید نهایی
   *
   * فعلاً در مرحله بعد تکمیل می‌شود.
   */

  if (
    currentState ===
    USER_STATES.WAITING_FOR_ADMIN_APPLICATION_CONFIRMATION
  ) {

    return await sendMessage(
      botToken,
      chatId,

      `⏳ <b>درخواست شما در حال آماده‌سازی است.</b>

این مرحله در نسخه بعدی با ثبت اطلاعات در دیتابیس و ارسال درخواست برای مدیران تکمیل می‌شود.`,

      getAdminApplicationBackKeyboard()
    );
  }


  return;
}
