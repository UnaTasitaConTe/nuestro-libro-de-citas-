CREATE TABLE IF NOT EXISTS entry_photos (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES cita_entries(id) ON DELETE CASCADE,
  foto_url TEXT NOT NULL,
  orden SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entry_photos_entry_id_idx ON entry_photos (entry_id);

INSERT INTO entry_photos (entry_id, foto_url, orden)
SELECT id, foto_url, 0 FROM cita_entries WHERE foto_url IS NOT NULL;

ALTER TABLE cita_entries DROP COLUMN IF EXISTS foto_url;
