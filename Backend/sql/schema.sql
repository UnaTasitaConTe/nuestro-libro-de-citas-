CREATE TYPE repetiriamos AS ENUM ('SI', 'TALVEZ', 'NO');

CREATE TABLE parejas (
  id SERIAL PRIMARY KEY,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  pareja_id INTEGER NOT NULL REFERENCES parejas(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE citas (
  id SERIAL PRIMARY KEY,
  pareja_id INTEGER NOT NULL REFERENCES parejas(id),
  nombre TEXT NOT NULL,
  fecha DATE NOT NULL,
  lugar TEXT NOT NULL,
  repetiriamos repetiriamos NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cita_entries (
  id SERIAL PRIMARY KEY,
  cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  valoracion SMALLINT NOT NULL CHECK (valoracion BETWEEN 1 AND 5),
  que_hicimos TEXT,
  como_te_sentiste TEXT,
  lo_que_mas_gusto TEXT,
  lo_que_menos_gusto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cita_id, user_id)
);

CREATE TABLE entry_photos (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES cita_entries(id) ON DELETE CASCADE,
  foto_url TEXT NOT NULL,
  orden SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX users_pareja_id_idx ON users (pareja_id);
CREATE INDEX citas_pareja_id_idx ON citas (pareja_id);
CREATE INDEX citas_fecha_idx ON citas (fecha DESC);
CREATE INDEX cita_entries_cita_id_idx ON cita_entries (cita_id);
CREATE INDEX entry_photos_entry_id_idx ON entry_photos (entry_id);

CREATE TYPE idea_estado AS ENUM ('POR_HACER', 'HACIENDO', 'HECHA');

CREATE TABLE ideas_citas (
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

CREATE INDEX ideas_citas_pareja_id_idx ON ideas_citas (pareja_id);
