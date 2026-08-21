export function getAdminsPaginationKeyboard(
  page,
  totalPages,
) {
  const buttons = [];

  /*
   * اگر بیشتر از یک صفحه داریم،
   * دکمه صفحه قبل/بعد ساخته می‌شود.
   */

  if (
    page > 1
  ) {
    buttons.push({
      text: '‹ صفحه قبل',
      callback_data:
        `top_admins:${page - 1}`,
    });
  }

  if (
    page < totalPages
  ) {
    buttons.push({
      text: 'صفحه بعد ›',
      callback_data:
        `top_admins:${page + 1}`,
    });
  }

  return {
    inline_keyboard:
      buttons.length
        ? [buttons]
        : [],
  };
}
