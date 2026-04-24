
-- Пользователи и роли
CREATE TABLE t_p68114469_cross_platform_logis.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('shop_chief','ppb','tc','tc_master','driver','sender','receiver','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Заявки на перевозку (20 полей из бизнес-процесса)
CREATE TABLE t_p68114469_cross_platform_logis.orders (
  id SERIAL PRIMARY KEY,
  order_num TEXT UNIQUE NOT NULL,         -- ЗПВ-XXXX

  -- Этап 1: начальник цеха
  department TEXT,
  applicant_name TEXT,

  -- Этап 2: ППБ
  cargo_name TEXT,
  quantity TEXT,
  request_time TEXT,
  load_place TEXT,
  unload_place TEXT,
  priority INTEGER DEFAULT 50,

  -- Этап 3: ТЦ
  vehicle_model TEXT,
  driver_name TEXT,
  driver_id INTEGER REFERENCES t_p68114469_cross_platform_logis.users(id),

  -- Этап 5: водитель (погрузка)
  arrival_load_time TEXT,
  load_start_time TEXT,
  departure_load_time TEXT,

  -- Этап 6: ответственный за сдачу
  sender_sign TEXT,

  -- Этап 7: водитель (разгрузка)
  arrival_unload_time TEXT,
  unload_start_time TEXT,
  departure_unload_time TEXT,

  -- Этап 8: ответственный за приём
  receiver_sign TEXT,

  -- Этап 9
  note TEXT DEFAULT '',
  done BOOLEAN DEFAULT FALSE,

  -- Мета
  created_by INTEGER REFERENCES t_p68114469_cross_platform_logis.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Лог действий
CREATE TABLE t_p68114469_cross_platform_logis.action_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p68114469_cross_platform_logis.users(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Сессии (простая авторизация по токену)
CREATE TABLE t_p68114469_cross_platform_logis.sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES t_p68114469_cross_platform_logis.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Начальные пользователи (пароль: 1234 → hash заглушка, заменим на bcrypt в бэке)
INSERT INTO t_p68114469_cross_platform_logis.users (name, login, password_hash, role) VALUES
  ('Морозов В.А.',        'morozov',   '1234', 'shop_chief'),
  ('Диспетчер Смирнова',  'smirnova',  '1234', 'ppb'),
  ('Мастер ТЦ Орлов',     'orlov',     '1234', 'tc_master'),
  ('Иванов К.П.',         'ivanov',    '1234', 'driver'),
  ('Петров М.С.',         'petrov',    '1234', 'driver'),
  ('Сидоров А.В.',        'sidorov',   '1234', 'driver'),
  ('Новиков Р.Е.',        'novikov',   '1234', 'driver'),
  ('Горелов П.И.',        'gorelov',   '1234', 'sender'),
  ('Кузнецова И.Р.',      'kuznetsova','1234', 'receiver'),
  ('Администратор',       'admin',     '1234', 'admin');
