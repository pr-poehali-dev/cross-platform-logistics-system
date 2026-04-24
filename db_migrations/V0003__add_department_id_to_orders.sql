ALTER TABLE t_p68114469_cross_platform_logis.orders
  ADD COLUMN department_id INTEGER REFERENCES t_p68114469_cross_platform_logis.departments(id);
