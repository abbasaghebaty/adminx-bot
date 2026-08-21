function parseMessageIds(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((id) => Number.isInteger(id))
      : [];
  } catch {
    return [];
  }
}

export async function getAdminSession(db, telegramId) {
  return db
    .prepare(`
      SELECT telegram_id, message_ids, started_at
      FROM admin_sessions
      WHERE telegram_id = ?
      LIMIT 1
    `)
    .bind(telegramId)
    .first();
}

export async function startAdminSession(db, telegramId) {
  await db
    .prepare(`
      INSERT INTO admin_sessions (
        telegram_id,
        message_ids
      )
      VALUES (?, '[]')
      ON CONFLICT(telegram_id)
      DO UPDATE SET
        message_ids = '[]',
        started_at = CURRENT_TIMESTAMP
    `)
    .bind(telegramId)
    .run();
}

export async function addSessionMessage(db, telegramId, messageId) {
  const session = await getAdminSession(db, telegramId);

  if (!session) {
    return;
  }

  const messageIds = parseMessageIds(session.message_ids);

  if (!messageIds.includes(messageId)) {
    messageIds.push(messageId);
  }

  await db
    .prepare(`
      UPDATE admin_sessions
      SET message_ids = ?
      WHERE telegram_id = ?
    `)
    .bind(
      JSON.stringify(messageIds),
      telegramId,
    )
    .run();
}

export async function finishAdminSession(db, telegramId) {
  const session = await getAdminSession(db, telegramId);

  await db
    .prepare(`
      DELETE FROM admin_sessions
      WHERE telegram_id = ?
    `)
    .bind(telegramId)
    .run();

  return parseMessageIds(session?.message_ids);
    }
