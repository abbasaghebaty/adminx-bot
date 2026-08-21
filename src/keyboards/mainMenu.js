export const MAIN_MENU_BUTTONS = Object.freeze({
  CHANNEL: '📢 کانال اصلی',
  TRUST: '🛡 اعتماد به AdminX',
  SUPPORT: '💬 پشتیبانی',
  ABOUT: '🏢 مجموعه AdminX',
  SUGGESTIONS: '📮 انتقادات و پیشنهادات',

  ACTIVE_ADMINS: '👥 ادمین‌های فعال',
  MANAGE_ADMINS: '👑 ادمین‌های برتر',
});

export function getMainMenuKeyboard() {
  return {
    keyboard: [
      [
        {
          text: MAIN_MENU_BUTTONS.CHANNEL,
          style: 'primary',
        },
      ],

      [
        {
          text: MAIN_MENU_BUTTONS.ACTIVE_ADMINS,
          style: 'success',
        },
        {
          text: MAIN_MENU_BUTTONS.MANAGE_ADMINS,
          style: 'primary',
        },
      ],

      [
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
          style: 'primary',
        },
      ],

      [
        {
          text: MAIN_MENU_BUTTONS.SUGGESTIONS,
          style: 'danger',
        },
      ],
    ],

    resize_keyboard: true,
  };
}
