/**
 * Course Menu Reply Keyboard
 *
 * مسیر:
 * keyboards/courseMenu.js
 *
 * فقط مسئول ساخت منوی خرید دوره است.
 */

export const COURSE_MENU_BUTTONS = Object.freeze({
  GET_CARD: '💳 دریافت شماره کارت',
  VERIFY_ADMIN: '🔎 استعلام ادمین',
  BACK: '🔙 بازگشت',
});

export function getCourseMenuKeyboard() {
  return {
    keyboard: [
      [
        {
          text: COURSE_MENU_BUTTONS.GET_CARD,
          style: 'primary',
        },
      ],

      [
        {
          text: COURSE_MENU_BUTTONS.VERIFY_ADMIN,
          style: 'primary',
        },
      ],

      [
        {
          text: COURSE_MENU_BUTTONS.BACK,
          style: 'danger',
        },
      ],
    ],

    resize_keyboard: true,
    is_persistent: false,
  };
}
