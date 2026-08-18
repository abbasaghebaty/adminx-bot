/**
 * Admin Verification Database
 *
 * مسیر:
 * src/database/adminVerifications.js
 *
 * مسئول:
 * - ثبت درخواست ایجاد کد
 * - بررسی وضعیت درخواست
 * - تأیید درخواست
 * - رد درخواست
 * - استعلام معتبر بودن ادمین
 */

/**
 * نرمال‌سازی Username
 *
 * @Amozesh_adminx
 * Amozesh_adminx
 * @amozesh_adminx
 *
 * همگی به شکل:
 * amozesh_adminx
 * تبدیل می‌شوند.
 */
export function normalizeUsername(username) {
  if (!username) {
    return null;
  }

  return username
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();
}

/**
 * پیدا کردن کاربر داخلی از روی Telegram ID
 */
export async function getUserByTelegramId(db, telegramId) {
  if (!telegramId) {
    throw new Error('Telegram ID is required');
  }

  return await db
    .prepare(`
      SELECT id, telegram_id, username, first_name, last_name
      FROM users
      WHERE telegram_id = ?
      LIMIT 1
    `)
    .bind(telegramId)
    .first();
}

/**
 * ایجاد درخواست جدید برای ادمین شدن
 */
export async function createAdminVerification(
  db,
  userId,
  adminUsername
) {
  const normalizedUsername = normalizeUsername(adminUsername);

  if (!normalizedUsername) {
    throw new Error('Admin username is required');
  }

  const result = await db
    .prepare(`
      INSERT INTO admin_verifications (
        user_id,
        admin_username,
        status
      )
      VALUES (?, ?, 'pending')
    `)
    .bind(
      userId,
      normalizedUsername
    )
    .run();

  return result;
}

/**
 * بررسی درخواست‌های قبلی یک کاربر
 */
export async function getUserAdminVerification(db, userId) {
  return await db
    .prepare(`
      SELECT *
      FROM admin_verifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1
    `)
    .bind(userId)
    .first();
}

/**
 * پیدا کردن درخواست بر اساس ID
 */
export async function getAdminVerificationById(db, verificationId) {
  return await db
    .prepare(`
      SELECT
        av.*,
        u.telegram_id,
        u.username,
        u.first_name,
        u.last_name
      FROM admin_verifications av
      INNER JOIN users u
        ON u.id = av.user_id
      WHERE av.id = ?
      LIMIT 1
    `)
    .bind(verificationId)
    .first();
}

/**
 * تأیید درخواست توسط ادمین اصلی
 */
export async function approveAdminVerification(
  db,
  verificationId,
  reviewerUserId
) {
  const result = await db
    .prepare(`
      UPDATE admin_verifications
      SET
        status = 'approved',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND status = 'pending'
    `)
    .bind(
      reviewerUserId,
      verificationId
    )
    .run();

  return result;
}

/**
 * رد درخواست توسط ادمین اصلی
 */
export async function rejectAdminVerification(
  db,
  verificationId,
  reviewerUserId
) {
  const result = await db
    .prepare(`
      UPDATE admin_verifications
      SET
        status = 'rejected',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND status = 'pending'
    `)
    .bind(
      reviewerUserId,
      verificationId
    )
    .run();

  return result;
}

/**
 * استعلام معتبر بودن ادمین
 *
 * کاربر می‌تواند با یا بدون @ وارد کند.
 */
export async function checkAdminValidity(db, adminUsername) {
  const normalizedUsername = normalizeUsername(adminUsername);

  if (!normalizedUsername) {
    return null;
  }

  return await db
    .prepare(`
      SELECT
        av.id,
        av.admin_username,
        av.status,
        u.telegram_id,
        u.username,
        u.first_name,
        u.last_name
      FROM admin_verifications av
      INNER JOIN users u
        ON u.id = av.user_id
      WHERE av.admin_username = ?
      AND av.status = 'approved'
      ORDER BY av.id DESC
      LIMIT 1
    `)
    .bind(normalizedUsername)
    .first();
}
