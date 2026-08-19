/**
 * Earn Money Keyboard
 *
 * مسیر:
 * keyboards/earnMoney.js
 *
 * مسئول ساخت منوی کسب درآمد
 */

export const EARN_MONEY_BUTTONS = Object.freeze({
  APPLY_ADMIN: '📝 درخواست ثبت حساب ادمینی',
  BACK: '🔙 بازگشت',
});


/**
 * منوی کسب درآمد
 */
export function getEarnMoneyKeyboard() {
  return {
    keyboard: [
      [
        {
          text: EARN_MONEY_BUTTONS.APPLY_ADMIN,
          style: 'primary',
        },
      ],

      [
        {
          text: EARN_MONEY_BUTTONS.BACK,
          style: 'danger',
        },
      ],
    ],

    resize_keyboard: true,
    is_persistent: false,
  };
}
