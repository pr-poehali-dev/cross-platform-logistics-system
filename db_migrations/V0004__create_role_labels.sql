CREATE TABLE t_p68114469_cross_platform_logis.role_labels (
    role TEXT PRIMARY KEY,
    label TEXT NOT NULL
);

INSERT INTO t_p68114469_cross_platform_logis.role_labels (role, label) VALUES
    ('shop_chief', 'Начальник цеха'),
    ('ppb',        'ППБ'),
    ('tc',         'Транспортный цех'),
    ('tc_master',  'Мастер ТЦ'),
    ('driver',     'Водитель'),
    ('sender',     'Ответственный за сдачу'),
    ('receiver',   'Ответственный за приём'),
    ('admin',      'Администратор');
