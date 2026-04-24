CREATE TABLE t_p68114469_cross_platform_logis.column_config (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    visible BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL
);

INSERT INTO t_p68114469_cross_platform_logis.column_config (key, label, visible, sort_order) VALUES
    ('order_num',    '№',                      true,  1),
    ('created_date', 'Дата',                   true,  2),
    ('cargo',        'Груз / Подразделение',   true,  3),
    ('quantity',     'Кол.',                   true,  4),
    ('priority',     'Приор.',                 true,  5),
    ('places',       'Место погр. → выгр.',    true,  6),
    ('driver_name',  'Водитель',               true,  7),
    ('stage',        'Этап',                   true,  8);
