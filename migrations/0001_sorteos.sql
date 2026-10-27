-- Base de datos de sorteos de Estratos 3D (Cloudflare D1).
-- Se ejecuta una sola vez desde la consola de D1. Se puede volver a ejecutar sin problemas.

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promo TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('whatsapp', 'email', 'instagram')),
  contact_value TEXT NOT NULL,
  source TEXT,
  ip_hash TEXT,
  contacted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (promo, contact_type, contact_value)
);
CREATE INDEX IF NOT EXISTS idx_participants_promo ON participants (promo, created_at);
CREATE INDEX IF NOT EXISTS idx_participants_ip ON participants (ip_hash, created_at);

CREATE TABLE IF NOT EXISTS promo_state (
  promo TEXT PRIMARY KEY,
  status TEXT CHECK (status IN ('abierto', 'cerrado')),
  winner_published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS draws (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promo TEXT NOT NULL,
  participant_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  pool_size INTEGER NOT NULL,
  drawn_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (promo, position)
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts (ip_hash, created_at);
