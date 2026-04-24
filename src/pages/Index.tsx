import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiLogin, apiMe, apiGetOrders, apiCreateOrder, apiUpdateOrder, apiGetLogs } from "@/api";

type Tab = "orders" | "reports" | "history";

interface User {
  id: number;
  name: string;
  role: string;
}

interface Order {
  id: number;
  order_num: string;
  department: string;
  applicant_name: string;
  cargo_name: string;
  quantity: string;
  request_time: string;
  load_place: string;
  unload_place: string;
  priority: number | null;
  vehicle_model: string;
  driver_name: string;
  driver_id: number | null;
  arrival_load_time: string;
  load_start_time: string;
  departure_load_time: string;
  sender_sign: string;
  arrival_unload_time: string;
  unload_start_time: string;
  departure_unload_time: string;
  receiver_sign: string;
  note: string;
  done: boolean;
  created_date: string;
}

interface LogEntry {
  user_name: string;
  action: string;
  target: string;
  time: string;
}

// Поля, доступные каждой роли для редактирования
const ROLE_FIELDS: Record<string, string[]> = {
  shop_chief: ["department", "applicant_name"],
  ppb:        ["cargo_name", "quantity", "request_time", "load_place", "unload_place", "priority"],
  tc:         ["vehicle_model", "driver_name"],
  tc_master:  [],
  driver:     ["arrival_load_time", "load_start_time", "departure_load_time",
               "arrival_unload_time", "unload_start_time", "departure_unload_time"],
  sender:     ["sender_sign"],
  receiver:   ["receiver_sign", "done"],
  admin:      ["department", "applicant_name", "cargo_name", "quantity", "request_time",
               "load_place", "unload_place", "priority", "vehicle_model", "driver_name",
               "arrival_load_time", "load_start_time", "departure_load_time", "sender_sign",
               "arrival_unload_time", "unload_start_time", "departure_unload_time",
               "receiver_sign", "note", "done"],
};

const ROLE_LABELS: Record<string, string> = {
  shop_chief: "Начальник цеха",
  ppb:        "ППБ",
  tc:         "Транспортный цех",
  tc_master:  "Мастер ТЦ",
  driver:     "Водитель",
  sender:     "Ответственный за сдачу",
  receiver:   "Ответственный за приём",
  admin:      "Администратор",
};

function getStage(o: Order): number {
  if (o.done) return 9;
  if (o.receiver_sign) return 9;
  if (o.arrival_unload_time) return 8;
  if (o.sender_sign) return 7;
  if (o.arrival_load_time) return 6;
  if (o.driver_name) return 5;
  if (o.vehicle_model) return 4;
  if (o.priority !== null) return 3;
  if (o.applicant_name) return 2;
  return 1;
}

const STAGE_LABELS: Record<number, string> = {
  1: "Заявка создана", 2: "ППБ", 3: "ТЦ назначен", 4: "Утверждено",
  5: "Водитель назначен", 6: "Погрузка", 7: "В пути", 8: "Разгрузка", 9: "Выполнено",
};
const STAGE_COLOR: Record<number, string> = {
  1: "bg-slate-100 text-slate-600 border-slate-200",
  2: "bg-slate-100 text-slate-600 border-slate-200",
  3: "bg-blue-50 text-blue-700 border-blue-200",
  4: "bg-blue-50 text-blue-700 border-blue-200",
  5: "bg-amber-50 text-amber-700 border-amber-200",
  6: "bg-orange-50 text-orange-700 border-orange-200",
  7: "bg-violet-50 text-violet-700 border-violet-200",
  8: "bg-cyan-50 text-cyan-700 border-cyan-200",
  9: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ── Экран входа ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!login || !password) return;
    setLoading(true);
    setError("");
    const res = await apiLogin(login, password);
    setLoading(false);
    if (res.token) {
      localStorage.setItem("token", res.token);
      onLogin(res.user, res.token);
    } else {
      setError(res.error || "Ошибка входа");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm flex items-center justify-center">
      <div className="bg-white border border-[#E0E0E0] w-full max-w-sm p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-7 h-7 bg-[#111] flex items-center justify-center">
            <Icon name="Truck" size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm tracking-wide uppercase">ТрансДеталь</span>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-[#999] mb-6">Вход в систему</p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Логин</label>
            <input
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              value={login}
              onChange={e => setLogin(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="ivanov"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Пароль</label>
            <input
              type="password"
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="••••"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-[#111] text-white py-2.5 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
        >
          {loading ? "Вход..." : "Войти"}
        </button>

        <div className="mt-6 border-t border-[#F0F0EE] pt-4">
          <p className="text-[10px] text-[#BBB] mb-2">Тестовые логины (пароль: 1234)</p>
          {[
            ["morozov",   "Нач. цеха"],
            ["smirnova",  "ППБ"],
            ["orlov",     "Мастер ТЦ"],
            ["ivanov",    "Водитель"],
            ["gorelov",   "Сдача"],
            ["kuznetsova","Приём"],
            ["admin",     "Администратор"],
          ].map(([l, label]) => (
            <button
              key={l}
              onClick={() => { setLogin(l); setPassword("1234"); }}
              className="inline-block text-[10px] text-[#888] hover:text-[#111] mr-3 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Детальный просмотр заявки ──────────────────────────────────────────────
function OrderDetail({ order, user, onClose, onSaved }: {
  order: Order; user: User; onClose: () => void; onSaved: () => void;
}) {
  const stage = getStage(order);
  const allowed = ROLE_FIELDS[user.role] || [];
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string) => setEdits(p => ({ ...p, [k]: v }));
  const val = (k: string) => edits[k] !== undefined ? edits[k] : ((order as unknown as Record<string, string>)[k] || "");

  const canEdit = (k: string) => allowed.includes(k);

  const save = async () => {
    if (!Object.keys(edits).length) { onClose(); return; }
    setSaving(true);
    await apiUpdateOrder(order.id, edits);
    setSaving(false);
    onSaved();
    onClose();
  };

  const STAGES = [
    { num: 1, label: "Заявка", role: "Начальник цеха", day: "День до", fields: [
      { k: "department",    label: "Подразделение" },
      { k: "applicant_name", label: "Ф.И.О. подающего заявку" },
    ]},
    { num: 2, label: "ППБ", role: "ППБ", day: "День до", fields: [
      { k: "cargo_name",  label: "Наименование груза" },
      { k: "quantity",    label: "Кол-во (шт)" },
      { k: "request_time", label: "Время подачи" },
      { k: "load_place",   label: "Место погрузки" },
      { k: "unload_place", label: "Место выгрузки" },
      { k: "priority",     label: "Приоритет (1–99)" },
    ]},
    { num: 3, label: "ТЦ", role: "Транспортный цех", day: "День до", fields: [
      { k: "vehicle_model", label: "Транспорт" },
      { k: "driver_name",   label: "ФИО водителя" },
    ]},
    { num: 4, label: "Утверждение", role: "Мастер ТЦ", day: "День исполнения", fields: [] },
    { num: 5, label: "Водитель (погрузка)", role: "Водитель", day: "День исполнения", fields: [
      { k: "arrival_load_time",   label: "Время заезда в цех" },
      { k: "load_start_time",     label: "Время начала погрузки" },
      { k: "departure_load_time", label: "Время выезда из цеха" },
    ]},
    { num: 6, label: "Сдача груза", role: "Отв. за сдачу", day: "День исполнения", fields: [
      { k: "sender_sign", label: "Подпись ответственного" },
    ]},
    { num: 7, label: "Водитель (разгрузка)", role: "Водитель", day: "День исполнения", fields: [
      { k: "arrival_unload_time",   label: "Время заезда в цех" },
      { k: "unload_start_time",     label: "Время начала разгрузки" },
      { k: "departure_unload_time", label: "Время выезда из цеха" },
    ]},
    { num: 8, label: "Приём груза", role: "Отв. за приём", day: "День исполнения", fields: [
      { k: "receiver_sign", label: "Подпись ответственного" },
    ]},
    { num: 9, label: "Статус", role: "Итог", day: "", fields: [
      { k: "note", label: "Примечание" },
    ]},
  ];

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-2xl overflow-y-auto animate-slide-in shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-[#999] font-mono mb-0.5">{order.order_num} · {order.created_date}</p>
            <h2 className="text-base font-semibold">{order.cargo_name || "Новая заявка"}</h2>
          </div>
          <div className="flex items-center gap-2">
            {hasEdits && (
              <button
                onClick={save}
                disabled={saving}
                className="bg-[#111] text-white px-4 py-1.5 text-xs font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 pt-5 pb-4 border-b border-[#F0F0EE]">
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`h-1 flex-1 transition-colors ${i < stage ? "bg-[#111]" : "bg-[#E8E8E8]"}`} />
            ))}
          </div>
          <p className="text-[11px] text-[#888]">
            Этап {stage} из 9 — <span className="text-[#111] font-medium">{STAGE_LABELS[stage]}</span>
            <span className="ml-3 text-[#BBB]">Ваша роль: {ROLE_LABELS[user.role]}</span>
          </p>
        </div>

        {/* Stages */}
        <div className="px-6 py-5 flex-1">
          {STAGES.map((s, idx) => {
            const isCompleted = stage > s.num;
            const isCurrent   = stage === s.num;
            const isPending   = stage < s.num;

            return (
              <div key={s.num} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${
                    isCompleted ? "bg-[#111] text-white" :
                    isCurrent   ? "bg-[#111] text-white ring-4 ring-[#E8E8E8]" :
                                  "bg-[#F0F0EE] text-[#AAA]"
                  }`}>
                    {isCompleted ? <Icon name="Check" size={12} /> : s.num}
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`w-px flex-1 my-1 ${isCompleted ? "bg-[#111]" : "bg-[#E8E8E8]"}`} style={{ minHeight: "24px" }} />
                  )}
                </div>

                <div className={`flex-1 pb-6 ${isPending ? "opacity-40" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className="text-[10px] text-[#999] border border-[#E8E8E8] px-1.5 py-0.5">{s.role}</span>
                    {s.day && <span className="text-[10px] text-[#BBB]">{s.day}</span>}
                  </div>
                  {s.fields.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {s.fields.map(f => (
                        <div key={f.k}>
                          <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-1">{f.label}</p>
                          {canEdit(f.k) && !isPending ? (
                            <input
                              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2 py-1.5 text-sm outline-none focus:border-[#111] transition-colors"
                              value={val(f.k)}
                              onChange={e => setField(f.k, e.target.value)}
                              placeholder="—"
                            />
                          ) : (
                            <p className={`text-sm ${val(f.k) ? "text-[#111]" : "text-[#CCC]"}`}>
                              {val(f.k) || "не заполнено"}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#999] italic">Визирование / утверждение</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Форма новой заявки ────────────────────────────────────────────────────
function NewOrderForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [data, setData] = useState({ department: "", applicant_name: "", cargo_name: "", quantity: "", request_time: "", load_place: "", unload_place: "", priority: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof data, v: string) => setData(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setLoading(true);
    await apiCreateOrder(data);
    setLoading(false);
    onCreated();
    onClose();
  };

  const Field = ({ label, k, placeholder }: { label: string; k: keyof typeof data; placeholder?: string }) => (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">{label}</label>
      <input
        className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111] transition-colors"
        value={data[k]}
        onChange={e => set(k, e.target.value)}
        placeholder={placeholder || "—"}
      />
    </div>
  );

  return (
    <div className="bg-white border border-[#E0E0E0] mb-4 animate-fade-in">
      <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#555]">Новая заявка · Этап 1</p>
        <span className="text-[10px] text-[#AAA]">Заполняет начальник цеха</span>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        <Field label="Подразделение" k="department" placeholder="Цех №…" />
        <Field label="Ф.И.О. подающего заявку" k="applicant_name" placeholder="Фамилия И.О." />
        <Field label="Наименование груза" k="cargo_name" />
        <Field label="Кол-во (шт)" k="quantity" placeholder="1" />
        <Field label="Время подачи" k="request_time" placeholder="08:00" />
        <Field label="Приоритет (1–99)" k="priority" placeholder="50" />
        <Field label="Место погрузки" k="load_place" />
        <Field label="Место выгрузки" k="unload_place" />
      </div>
      <div className="px-5 pb-4 flex gap-2">
        <button onClick={submit} disabled={loading} className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
          {loading ? "Создание..." : "Создать заявку"}
        </button>
        <button onClick={onClose} className="border border-[#E0E0E0] px-5 py-2 text-xs font-medium text-[#555] hover:bg-[#F0F0EE] transition-colors">
          Отмена
        </button>
      </div>
    </div>
  );
}

// ── Главный экран ──────────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("все");
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Проверяем сохранённый токен
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setAuthLoading(false); return; }
    apiMe().then(res => {
      if (res.user) setUser(res.user);
      setAuthLoading(false);
    });
  }, []);

  const loadOrders = useCallback(async () => {
    const data = await apiGetOrders();
    if (Array.isArray(data)) setOrders(data);
  }, []);

  const loadLogs = useCallback(async () => {
    const data = await apiGetLogs();
    if (Array.isArray(data)) setLogs(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user, loadOrders]);

  useEffect(() => {
    if (!user || tab !== "history") return;
    loadLogs();
  }, [user, tab, loadLogs]);

  const handleLogin = (u: User) => setUser(u);
  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  const canCreate = user && ["shop_chief", "admin"].includes(user.role);

  const filtered = filterStatus === "все"
    ? orders
    : filterStatus === "выполнено" ? orders.filter(o => o.done)
    : orders.filter(o => !o.done);

  // Статистика
  const total = orders.length;
  const done = orders.filter(o => o.done).length;
  const inProgress = orders.filter(o => !o.done).length;
  const urgent = orders.filter(o => o.priority !== null && o.priority <= 5 && !o.done).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] font-ibm flex items-center justify-center">
        <div className="text-sm text-[#999]">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm text-[#111]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#111] flex items-center justify-center">
              <Icon name="Truck" size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide uppercase">ТрансДеталь</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-[10px] text-[#AAA]">{ROLE_LABELS[user.role]}</p>
            </div>
            <button onClick={logout} className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors" title="Выйти">
              <Icon name="LogOut" size={14} className="text-[#888]" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-0 border border-[#E0E0E0] bg-white w-fit mb-6">
          {([
            { key: "orders",  label: "Заявки",  icon: "Package" },
            { key: "reports", label: "Отчёты",  icon: "BarChart2" },
            { key: "history", label: "История", icon: "Clock" },
          ] as { key: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors border-r border-[#E0E0E0] last:border-r-0 ${
                tab === t.key ? "bg-[#111] text-white" : "text-[#555] hover:bg-[#F0F0EE]"
              }`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ЗАЯВКИ ── */}
        {tab === "orders" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-0 border border-[#E0E0E0] bg-white">
                {["все", "в работе", "выполнено"].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-4 py-1.5 text-xs font-medium border-r border-[#E0E0E0] last:border-r-0 transition-colors ${
                      filterStatus === s ? "bg-[#111] text-white" : "text-[#666] hover:bg-[#F0F0EE]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={loadOrders} className="border border-[#E0E0E0] px-3 py-2 hover:bg-[#F0F0EE] transition-colors" title="Обновить">
                  <Icon name="RefreshCw" size={13} className="text-[#888]" />
                </button>
                {canCreate && (
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333] transition-colors"
                  >
                    <Icon name="Plus" size={13} />
                    Новая заявка
                  </button>
                )}
              </div>
            </div>

            {showForm && canCreate && (
              <NewOrderForm onClose={() => setShowForm(false)} onCreated={loadOrders} />
            )}

            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              <div className="grid grid-cols-[90px_110px_1fr_70px_70px_160px_150px_110px] min-w-[900px] bg-[#F7F7F5] border-b border-[#E0E0E0]">
                {["№", "Дата", "Груз / Подразделение", "Кол-во", "Приор.", "Погрузка → Выгрузка", "Водитель", "Этап"].map(h => (
                  <div key={h} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="py-16 text-center text-sm text-[#BBB]">
                  {orders.length === 0 ? "Заявок пока нет. Создайте первую." : "Нет заявок по фильтру."}
                </div>
              )}

              {filtered.map((o, i) => {
                const stage = getStage(o);
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`grid grid-cols-[90px_110px_1fr_70px_70px_160px_150px_110px] min-w-[900px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                  >
                    <div className="px-3 py-3 text-xs font-mono text-[#888]">{o.order_num}</div>
                    <div className="px-3 py-3 text-xs text-[#666]">{o.created_date}</div>
                    <div className="px-3 py-3">
                      <p className="text-sm font-medium leading-tight">{o.cargo_name || <span className="text-[#CCC]">не указан</span>}</p>
                      <p className="text-[11px] text-[#AAA] mt-0.5">{o.department} {o.applicant_name && `· ${o.applicant_name}`}</p>
                    </div>
                    <div className="px-3 py-3 text-sm text-[#555]">{o.quantity || "—"}</div>
                    <div className="px-3 py-3">
                      <span className={`text-xs font-bold ${o.priority !== null && o.priority <= 5 ? "text-red-600" : o.priority !== null && o.priority <= 20 ? "text-amber-600" : "text-[#AAA]"}`}>
                        {o.priority ?? "—"}
                      </span>
                    </div>
                    <div className="px-3 py-3 text-xs text-[#666]">
                      <p className="truncate">{o.load_place || "—"}</p>
                      <p className="truncate text-[#AAA]">{o.unload_place || "—"}</p>
                    </div>
                    <div className="px-3 py-3 text-xs text-[#555]">
                      {o.driver_name || <span className="text-[#CCC]">не назначен</span>}
                    </div>
                    <div className="px-3 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 border ${STAGE_COLOR[stage]}`}>
                        {STAGE_LABELS[stage]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#AAA] mt-2">
              Показано {filtered.length} из {orders.length} · нажмите на строку для просмотра и заполнения
            </p>
          </div>
        )}

        {/* ── ОТЧЁТЫ ── */}
        {tab === "reports" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E0E0E0] border border-[#E0E0E0] mb-6">
              {[
                { label: "Всего заявок",      value: String(total),      sub: "в базе" },
                { label: "Выполнено",          value: String(done),       sub: total ? `${Math.round(done/total*100)}%` : "0%" },
                { label: "В работе",           value: String(inProgress), sub: "активных" },
                { label: "Срочных (приор. ≤5)", value: String(urgent),    sub: "требуют внимания" },
              ].map(s => (
                <div key={s.label} className="bg-white px-6 py-5">
                  <p className="text-[10px] uppercase tracking-wider text-[#999] mb-1">{s.label}</p>
                  <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
                  <p className="text-xs text-[#888] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Этапы */}
            <div className="bg-white border border-[#E0E0E0] p-6 mb-6">
              <p className="text-[10px] uppercase tracking-wider text-[#999] mb-4">Заявки по этапам</p>
              {Array.from({ length: 9 }, (_, i) => i + 1).map(s => {
                const count = orders.filter(o => getStage(o) === s).length;
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-4 mb-2 last:mb-0">
                    <span className="text-xs text-[#888] w-4 shrink-0">{s}</span>
                    <span className="text-xs w-36 shrink-0">{STAGE_LABELS[s]}</span>
                    <div className="flex-1 h-1.5 bg-[#F0F0EE]">
                      <div className="h-full bg-[#111]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[#AAA] w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Срочные */}
            {urgent > 0 && (
              <div className="bg-white border border-[#E0E0E0] p-6">
                <p className="text-[10px] uppercase tracking-wider text-[#999] mb-4">Срочные заявки (приоритет 1–5)</p>
                {orders.filter(o => o.priority !== null && o.priority <= 5 && !o.done).map(o => (
                  <div key={o.id} onClick={() => { setTab("orders"); setSelectedOrder(o); }} className="flex items-center gap-4 py-2.5 border-b border-[#F0F0EE] last:border-b-0 cursor-pointer hover:bg-[#FAFAFA] -mx-2 px-2">
                    <span className="text-red-600 font-bold text-sm w-6">{o.priority}</span>
                    <span className="text-sm flex-1">{o.cargo_name || o.order_num}</span>
                    <span className="text-xs text-[#888]">{o.department}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 border ${STAGE_COLOR[getStage(o)]}`}>{STAGE_LABELS[getStage(o)]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ИСТОРИЯ ── */}
        {tab === "history" && (
          <div className="animate-fade-in">
            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              <div className="grid grid-cols-[180px_1fr_220px_100px] min-w-[700px] border-b border-[#E0E0E0] bg-[#F7F7F5]">
                {["Пользователь", "Действие", "Объект", "Время"].map(h => (
                  <div key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>
              {logs.length === 0 && (
                <div className="py-12 text-center text-sm text-[#BBB]">История пуста</div>
              )}
              {logs.map((l, i) => (
                <div key={i} className={`grid grid-cols-[180px_1fr_220px_100px] min-w-[700px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] ${i === logs.length - 1 ? "border-b-0" : ""}`}>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                      <Icon name="User" size={10} className="text-[#666]" />
                    </div>
                    <span className="text-xs text-[#555] truncate">{l.user_name}</span>
                  </div>
                  <div className="px-4 py-3 text-sm">{l.action}</div>
                  <div className="px-4 py-3 text-xs font-mono text-[#888]">{l.target}</div>
                  <div className="px-4 py-3 text-xs text-[#AAA]">{l.time}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#AAA] mt-2">Последние {logs.length} событий</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          user={user}
          onClose={() => setSelectedOrder(null)}
          onSaved={loadOrders}
        />
      )}
    </div>
  );
}
