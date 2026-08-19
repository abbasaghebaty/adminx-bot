/**
 * Earn Money Keyboard
 *
 * مسیر:
 * keyboards/earnMoney.js
 */

export const EARN_MONEY_BUTTONS = Object.freeze({

  APPLY_ADMIN:
    '📝 درخواست ثبت حساب ادمینی',

  PURCHASED_COURSE:
    '✅ دوره را خریداری کرده‌ام',

  BACK:
    '🔙 بازگشت',

});


/**
 * منوی کسب درآمد
 */
export function getEarnMoneyKeyboard() {
  return {
    keyboard: [
      [
        {
          text:
            EARN_MONEY_BUTTONS.APPLY_ADMIN,
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
  };
}


/**
 * کیبورد تأیید خرید دوره
 */
export function getAdminApplicationStartKeyboard() {
  return {
    keyboard: [
      [
        {
          text:
            EARN_MONEY_BUTTONS.PURCHASED_COURSE,
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
  };
}


/**
 * کیبورد فقط بازگشت
 */
export function getAdminApplicationBackKeyboard() {
  return {
    keyboard: [
      [
        {
          text:
            EARN_MONEY_BUTTONS.BACK,
        },
      ],
    ],
    resize_keyboard: true,
  };
}
