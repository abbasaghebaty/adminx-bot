const CONFIGURED_ADMIN_IDS = new Set([
  '8842657623',
  '8790535873',
]);

export async function isBotAdmin(
  db,
  telegramId,
  env,
) {
  const numericTelegramId =
    String(telegramId);

  /*
   * Primary admin check:
   * Hard-coded master admin IDs.
   */
  if (
    CONFIGURED_ADMIN_IDS.has(
      numericTelegramId,
    )
  ) {
    return true;
  }

  /*
   * Secondary admin check:
   * Existing admins stored in D1.
   */
  if (!db) {
    return false;
  }

  const row = await db
    .prepare(
      `
        SELECT 1
        FROM users
        WHERE telegram_id = ?
          AND is_bot_admin = 1
        LIMIT 1
      `,
    )
    .bind(telegramId)
    .first();

  return Boolean(row);
}

export async function listAdmins(
  db,
  page = 1,
  pageSize = 10,
) {
  const countRow = await db
    .prepare(
      `
        SELECT COUNT(*) AS total
        FROM admins
      `,
    )
    .first();

  const total =
    Number(countRow?.total ?? 0);

  const totalPages =
    Math.max(
      1,
      Math.ceil(total / pageSize),
    );

  const safePage = Math.min(
    Math.max(
      1,
      Number(page) || 1,
    ),
    totalPages,
  );

  const offset =
    (safePage - 1) * pageSize;

  const result = await db
    .prepare(
      `
        SELECT
          id,
          telegram_id,
          display_name
        FROM admins
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
      `,
    )
    .bind(
      pageSize,
      offset,
    )
    .all();

  return {
    admins:
      result.results ?? [],
    total,
    totalPages,
    page: safePage,
  };
}

export async function getAdminByTelegramId(
  db,
  telegramId,
) {
  return db
    .prepare(
      `
        SELECT
          id,
          telegram_id,
          display_name
        FROM admins
        WHERE telegram_id = ?
        LIMIT 1
      `,
    )
    .bind(telegramId)
    .first();
}

export async function createAdmin(
  db,
  telegramId,
  displayName,
) {
  const existing =
    await getAdminByTelegramId(
      db,
      telegramId,
    );

  await db
    .prepare(
      `
        INSERT INTO admins (
          telegram_id,
          display_name
        )
        VALUES (?, ?)
        ON CONFLICT(telegram_id)
        DO UPDATE SET
          display_name =
            excluded.display_name
      `,
    )
    .bind(
      telegramId,
      displayName,
    )
    .run();

  return {
    admin:
      await getAdminByTelegramId(
        db,
        telegramId,
      ),
    existed:
      Boolean(existing),
  };
}
