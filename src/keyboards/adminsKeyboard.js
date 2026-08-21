export function getAdminsPaginationKeyboard(page, totalPages) {
  const buttons = [];

  if (page > 1) {
    buttons.push({
      text: '‹ صفحه قبل',
      callback_data: `admins:${page - 1}`,
    });
  }

  if (page < totalPages) {
    buttons.push({
      text: 'صفحه بعد ›',
      callback_data: `admins:${page + 1}`,
    });
  }

  return {
    inline_keyboard: buttons.length
      ? [buttons]
      : [],
  };
}
