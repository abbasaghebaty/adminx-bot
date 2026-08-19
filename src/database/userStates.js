/**
 * User States Database
 *
 * مسیر:
 * src/database/userStates.js
 *
 * مسئول نگهداری وضعیت موقت کاربران
 */

export const USER_STATES = Object.freeze({

  /**
   * استعلام ادمین
   */
  WAITING_FOR_ADMIN_VERIFICATION:
    'waiting_for_admin_verification',


  /**
   * درخواست ثبت حساب ادمینی
   *
   * منتظر تأیید خرید دوره
   */
  WAITING_FOR_ADMIN_APPLICATION_CONFIRMATION:
    'waiting_for_admin_application_confirmation',


  /**
   * درخواست ثبت حساب ادمینی
   *
   * منتظر نام و نام خانوادگی
   */
  WAITING_FOR_ADMIN_APPLICATION_NAME:
    'waiting_for_admin_application_name',


  /**
   * درخواست ثبت حساب ادمینی
   *
   * منتظر شماره تلفن
   */
  WAITING_FOR_ADMIN_APPLICATION_PHONE:
    'waiting_for_admin_application_phone',

});


/**
 * =====================================================
 * ذخیره یا تغییر State کاربر
 * =====================================================
 */

export async function setUserState(
  db,
  userId,
  state
) {

  if (!db) {
    throw new Error(
      'Database is not available'
    );
  }

  if (!userId) {
    throw new Error(
      'User ID is required'
    );
  }

  if (!state) {
    throw new Error(
      'State is required'
    );
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
 * =====================================================
 * دریافت State کاربر
 * =====================================================
 */

export async function getUserState(
  db,
  userId
) {

  if (
    !db ||
    !userId
  ) {
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
    .bind(
      userId
    )
    .first();
}


/**
 * =====================================================
 * حذف State کاربر
 * =====================================================
 */

export async function clearUserState(
  db,
  userId
) {

  if (
    !db ||
    !userId
  ) {
    return;
  }


  await db
    .prepare(`
      DELETE FROM user_states

      WHERE user_id = ?
    `)
    .bind(
      userId
    )
    .run();
}
