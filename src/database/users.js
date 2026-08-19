export async function saveUser(db, user) {
  await db
    .prepare(`
      INSERT INTO users (
        telegram_id,
        username,
        first_name,
        last_name,
        language_code,
        is_bot
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id)
      DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        language_code = excluded.language_code,
        is_bot = excluded.is_bot,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(
      user.id,
      user.username ?? null,
      user.first_name ?? null,
      user.last_name ?? null,
      user.language_code ?? null,
      user.is_bot ? 1 : 0,
    )
    .run();
}
