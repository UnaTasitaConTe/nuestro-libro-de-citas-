DO $$ BEGIN
  CREATE TYPE idea_estado AS ENUM ('POR_HACER', 'HACIENDO', 'HECHA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS ideas_citas (
  id SERIAL PRIMARY KEY,
  pareja_id INTEGER NOT NULL REFERENCES parejas(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado idea_estado NOT NULL DEFAULT 'POR_HACER',
  orden SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ideas_citas_pareja_id_idx ON ideas_citas (pareja_id);
