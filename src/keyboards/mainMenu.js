export const MAIN_MENU_BUTTONS = Object.freeze({
  TOP_ADMINS: '👑 ادمین‌های برتر',
  CHANNEL: '📢 کانال اصلی',
  ABOUT: '🏢 مجموعه AdminX',
  TRUST: '🛡 اعتماد به AdminX',
  SUPPORT: '💬 پشتیبانی',
  SUGGESTIONS: '📮 انتقادات و پیشنهادات',
});

export function getMainMenuKeyboard() {
  return {
    keyboard: [
      [
        {
          text: MAIN_MENU_BUTTONS.TOP_ADMINS,
          style: 'success',
        },
      ],

      [
        {
          text: MAIN_MENU_BUTTONS.CHANNEL,
          style: 'primary',
        },
        {
          text: MAIN_MENU_BUTTONS.TRUST,
          style: 'success',
        },
        {
          text: MAIN_MENU_BUTTONS.ABOUT,
          style: 'primary',
        },
      ],

      [
        {
          text: MAIN_MENU_BUTTONS.SUPPORT,
          style: 'danger',
        },
        {
          text: MAIN_MENU_BUTTONS.SUGGESTIONS,
          style: 'danger',
        },
      ],
    ],

    resize_keyboard: true,
    is_persistent: false,
  };
}
