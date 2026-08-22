export const MAIN_MENU_BUTTONS = Object.freeze({
  CHANNEL: '📢 کانال اصلی',
  TOP_ADMINS: '👑 ادمین‌های برتر',
  TRUST: '🛡 اعتماد به AdminX',
  SUPPORT: '💬 پشتیبانی',
  ABOUT: '🏢 مجموعه AdminX',
  SUGGESTIONS: '📮 انتقادات و پیشنهادات',
});

export function getMainMenuKeyboard() {
  return {
    keyboard: [
      [
        {
          text: MAIN_MENU_BUTTONS.TRUST,
          style: 'success',
        },
        {
          text: MAIN_MENU_BUTTONS.CHANNEL,
          style: 'primary',
        },
      ],

      [
        {
          text: MAIN_MENU_BUTTONS.TOP_ADMINS,
          style: 'success',
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

      [
        {
          text: MAIN_MENU_BUTTONS.ABOUT,
          style: 'primary',
        },
      ],
    ],

    resize_keyboard: true,
    is_persistent: false,
  };
}
