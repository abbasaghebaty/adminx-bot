/**
 * User States Database
 *
 * مسیر:
 * src/database/userStates.js
 *
 * مسئول:
 * - نگهداری وضعیت موقت کاربران
 * - مدیریت مرحله استعلام ادمین
 * - مدیریت مراحل ثبت درخواست ادمین
 */

export const USER_STATES = Object.freeze({

  /**
   * =====================================================
   * استعلام ادمین
   * =====================================================
   */

  WAITING_FOR_ADMIN_VERIFICATION:
    'waiting_for_admin_verification',


  /**
   * =====================================================
   * ثبت درخواست ادمین
   * =====================================================
   *
   * روند:
   *
   * شروع درخواست
   * ↓
   * نام
   * ↓
   * نام خانوادگی
   * ↓
   * شماره تلفن
   * ↓
   * یوزرنیم ادمینی
   * ↓
   * ثبت نهایی
   */

  ADMIN_APPLICATION_FIRST_NAME:
    'admin_application_first_name',

  ADMIN_APPLICATION_LAST_NAME:
    'admin_application_last_name',

  ADMIN_APPLICATION_PHONE:
    'admin_application_phone',

  ADMIN_APPLICATION_USERNAME:
    'admin_application_username',

});


/**
 * ذخیره یا تغییر State کاربر
 */
export async function setUserState(
  db,
  userId,
  state
) {
  if (!db) {
    throw new Error('Database is not available');
  }

  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!state) {
    throw new Error('State is required');
  }

  await db
    .prepare(`
      INSERT INTO user_states (
        user_id,
        state
      )
      VALUES (?, ?)

      ON CONFLICT(user_id)
      DO UPDATE SET
        state = excluded.state,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(
      userId,
      state
    )
    .run();
}


/**
 * دریافت State کاربر
 */
export async function getUserState(
  db,
  userId
) {
  if (!db || !userId) {
    return null;
  }

  return await db
    .prepare(`
      SELECT
        id,
        user_id,
        state,
        created_at,
        updated_at
      FROM user_states
      WHERE user_id = ?
      LIMIT 1
    `)
    .bind(userId)
    .first();
}


/**
 * حذف State کاربر
 */
export async function clearUserState(
  db,
  userId
) {
  if (!db || !userId) {
    return;
  }

  await db
    .prepare(`
      DELETE FROM user_states
      WHERE user_id = ?
    `)
    .bind(userId)
    .run();
}


/**
 * بررسی اینکه کاربر در یکی از مراحل
 * ثبت درخواست ادمین قرار دارد یا خیر
 */
export function isAdminApplicationState(
  state
) {
  return (
    state ===
      USER_STATES.ADMIN_APPLICATION_FIRST_NAME ||

    state ===
      USER_STATES.ADMIN_APPLICATION_LAST_NAME ||

    state ===
      USER_STATES.ADMIN_APPLICATION_PHONE ||

    state ===
      USER_STATES.ADMIN_APPLICATION_USERNAME
  );
}


/**
 * بررسی اینکه کاربر در حالت
 * استعلام ادمین قرار دارد یا خیر
 */
export function isAdminVerificationState(
  state
) {
  return (
    state ===
    USER_STATES.WAITING_FOR_ADMIN_VERIFICATION
  );
}
