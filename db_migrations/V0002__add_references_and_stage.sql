
-- Справочник подразделений
CREATE TABLE t_p68114469_cross_platform_logis.departments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Справочник грузов
CREATE TABLE t_p68114469_cross_platform_logis.cargo_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Справочник мест погрузки/выгрузки
CREATE TABLE t_p68114469_cross_platform_logis.locations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Справочник транспорта (техники)
CREATE TABLE t_p68114469_cross_platform_logis.vehicles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Добавляем в users привязку к подразделению
ALTER TABLE t_p68114469_cross_platform_logis.users
  ADD COLUMN department_id INTEGER REFERENCES t_p68114469_cross_platform_logis.departments(id);

-- В orders храним id из справочников (для dropdown), но оставляем текстовые поля для отображения
ALTER TABLE t_p68114469_cross_platform_logis.orders
  ADD COLUMN cargo_type_id INTEGER REFERENCES t_p68114469_cross_platform_logis.cargo_types(id),
  ADD COLUMN load_location_id INTEGER REFERENCES t_p68114469_cross_platform_logis.locations(id),
  ADD COLUMN unload_location_id INTEGER REFERENCES t_p68114469_cross_platform_logis.locations(id),
  ADD COLUMN vehicle_id INTEGER REFERENCES t_p68114469_cross_platform_logis.vehicles(id),
  ADD COLUMN execution_date DATE,
  ADD COLUMN stage INTEGER DEFAULT 1;

-- Наполняем справочники начальными данными
INSERT INTO t_p68114469_cross_platform_logis.departments (name) VALUES
  ('Цех №1'),
  ('Цех №2'),
  ('Цех №3'),
  ('Цех №4'),
  ('Ремонтный цех'),
  ('Склад А'),
  ('Склад Б'),
  ('Транспортный цех');

INSERT INTO t_p68114469_cross_platform_logis.cargo_types (name) VALUES
  ('Коленвал МТЗ-82'),
  ('Тормозные колодки (к-т)'),
  ('Фильтр масляный'),
  ('Поршневая группа'),
  ('Редуктор заднего моста'),
  ('Запасные части'),
  ('Металлопрокат'),
  ('Инструмент'),
  ('Расходные материалы'),
  ('Оборудование');

INSERT INTO t_p68114469_cross_platform_logis.locations (name) VALUES
  ('Склад А, стеллаж 1'),
  ('Склад А, стеллаж 14'),
  ('Склад А, тяжёлый сектор'),
  ('Склад Б, стеллаж 3'),
  ('Склад Б, сектор В'),
  ('Цех №1, инструменталка'),
  ('Цех №1, монтажный участок'),
  ('Цех №2, зона хранения'),
  ('Цех №3, участок сборки'),
  ('Цех №4, монтажный участок'),
  ('Ремонтный цех'),
  ('ООО «Дета», ворота №2'),
  ('Проходная №1'),
  ('Проходная №2');

INSERT INTO t_p68114469_cross_platform_logis.vehicles (name) VALUES
  ('ГАЗель Next'),
  ('ГАЗель Бизнес'),
  ('Ford Transit'),
  ('КамАЗ-4308'),
  ('ЗИЛ-130'),
  ('Погрузчик Toyota');

-- Привязываем существующих пользователей к подразделениям
UPDATE t_p68114469_cross_platform_logis.users u
  SET department_id = d.id
  FROM t_p68114469_cross_platform_logis.departments d
  WHERE (u.login = 'morozov' AND d.name = 'Цех №3')
     OR (u.login = 'smirnova' AND d.name = 'Транспортный цех')
     OR (u.login = 'orlov' AND d.name = 'Транспортный цех')
     OR (u.login = 'ivanov' AND d.name = 'Транспортный цех')
     OR (u.login = 'petrov' AND d.name = 'Транспортный цех')
     OR (u.login = 'sidorov' AND d.name = 'Транспортный цех')
     OR (u.login = 'novikov' AND d.name = 'Транспортный цех')
     OR (u.login = 'gorelov' AND d.name = 'Цех №1')
     OR (u.login = 'kuznetsova' AND d.name = 'Склад Б')
     OR (u.login = 'admin' AND d.name = 'Транспортный цех');
