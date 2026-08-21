export function getAdminsPaginationKeyboard(
  page,
  totalPages,
) {
  /*
   * فقط یک صفحه داریم:
   * هیچ دکمه‌ای نمایش نده.
   */
  if (
    totalPages <= 1
  ) {
    return {
      inline_keyboard: [],
    };
  }

  const buttons = [];

  /*
   * صفحه قبل
   */
  if (page > 1) {
    buttons.push({
      text: '‹ قبلی',
      callback_data:
        `top_admins:${page - 1}`,
    });
  }

  /*
   * صفحه بعد
   */
  if (
    page < totalPages
  ) {
    buttons.push({
      text: 'بعدی ›',
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
