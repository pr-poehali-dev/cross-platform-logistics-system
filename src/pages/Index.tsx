import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiLogin, apiMe, apiGetOrders, apiCreateOrder, apiUpdateOrder, apiGetLogs, apiGetRefs } from "@/api";

type Tab = "orders" | "reports" | "history";

interface User {
  id: number;
  name: string;
  role: string;
  department_id: number | null;
  department_name: string;
}

interface RefItem { id: number; name: string; }
interface Refs {
  departments: RefItem[];
  cargo_types: RefItem[];
  locations: RefItem[];
  vehicles: RefItem[];
  drivers: RefItem[];
}

interface Order {
  id: number;
  order_num: string;
  department: string;
  applicant_name: string;
  cargo_name: string;
  cargo_type_id: number | null;
  quantity: string;
  execution_date: string | null;
  load_place: string;
  load_location_id: number | null;
  unload_place: string;
  unload_location_id: number | null;
  priority: number | null;
  vehicle_model: string;
  vehicle_id: number | null;
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
  stage: number;
  created_date: string;
}

interface LogEntry { user_name: string; action: string; target: string; time: string; }

const ROLE_LABELS: Record<string, string> = {
  shop_chief: "Начальник цеха", ppb: "ППБ", tc: "Транспортный цех",
  tc_master: "Мастер ТЦ", driver: "Водитель",
  sender: "Ответственный за сдачу", receiver: "Ответственный за приём",
  admin: "Администратор",
};

const STAGE_LABELS: Record<number, string> = {
  1: "Новая", 2: "У ППБ", 3: "ТЦ", 4: "Водитель назначен",
  5: "Погрузка", 6: "Погрузка", 7: "В пути", 8: "Разгрузка", 9: "Выполнено",
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

// Минимальный этап для начала редактирования роли
const ROLE_MIN_STAGE: Record<string, number> = {
  ppb: 1, tc: 2, tc_master: 3, driver: 4, sender: 5, receiver: 7,
  shop_chief: 1, admin: 0,
};

// ── Экран входа ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!login || !password) return;
    setLoading(true); setError("");
    const res = await apiLogin(login, password);
    setLoading(false);
    if (res.token) {
      localStorage.setItem("token", res.token);
      onLogin(res.user, res.token);
    } else {
      setError(res.error || "Ошибка входа");
    }
  };

  const DEMO_USERS = [
    ["morozov", "Нач. цеха"], ["smirnova", "ППБ"], ["orlov", "Мастер ТЦ"],
    ["ivanov", "Водитель"], ["gorelov", "Сдача"], ["kuznetsova", "Приём"], ["admin", "Админ"],
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm flex items-center justify-center px-4">
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
            <input autoFocus className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2.5 text-sm outline-none focus:border-[#111]"
              value={login} onChange={e => setLogin(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="ivanov" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Пароль</label>
            <input type="password" className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2.5 text-sm outline-none focus:border-[#111]"
              value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <button onClick={submit} disabled={loading}
          className="w-full bg-[#111] text-white py-2.5 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
          {loading ? "Вход..." : "Войти"}
        </button>
        <div className="mt-5 border-t border-[#F0F0EE] pt-4">
          <p className="text-[10px] text-[#BBB] mb-2">Демо (пароль: 1234)</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {DEMO_USERS.map(([l, label]) => (
              <button key={l} onClick={() => { setLogin(l); setPassword("1234"); }}
                className="text-[10px] text-[#888] hover:text-[#111] transition-colors">{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Форма создания заявки (только начальник цеха) ──────────────────────────
function NewOrderForm({ user, refs, onClose, onCreated }: {
  user: User; refs: Refs; onClose: () => void; onCreated: () => void;
}) {
  const [cargo_type_id, setCargoTypeId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [execution_date, setExecutionDate] = useState("");
  const [load_location_id, setLoadLocId] = useState<string>("");
  const [unload_location_id, setUnloadLocId] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!cargo_type_id) { setError("Выберите груз"); return; }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 999) {
      setError("Кол-во: число от 1 до 999"); return;
    }
    if (!execution_date) { setError("Укажите дату и время исполнения"); return; }
    if (!load_location_id) { setError("Выберите место погрузки"); return; }
    if (!unload_location_id) { setError("Выберите место выгрузки"); return; }
    setLoading(true); setError("");
    const res = await apiCreateOrder({
      cargo_type_id, quantity, execution_date,
      load_location_id, unload_location_id, note,
    });
    setLoading(false);
    if (res.id) { onCreated(); onClose(); }
    else setError(res.error || "Ошибка создания");
  };

  const Select = ({ label, value, onChange, items, placeholder }: {
    label: string; value: string; onChange: (v: string) => void;
    items: RefItem[]; placeholder?: string;
  }) => (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">{label}</label>
      <select className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
        value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder || "— выберите —"}</option>
        {items.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-white border border-[#E0E0E0] mb-5 animate-fade-in">
      <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between bg-[#FAFAFA]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#333]">Новая заявка на перевозку</p>
          <p className="text-[10px] text-[#AAA] mt-0.5">Этап 1 · Заполняет начальник цеха</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-[#F0F0EE]">
          <Icon name="X" size={14} className="text-[#888]" />
        </button>
      </div>
      <div className="p-5">
        {/* Автозаполняемые поля */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Подразделение (кол. 1)</label>
            <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-3 py-2 text-sm text-[#888]">{user.department_name || "—"}</div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Автор заявки (кол. 2)</label>
            <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-3 py-2 text-sm text-[#888]">{user.name}</div>
          </div>
        </div>
        {/* Поля для заполнения */}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Наименование груза (кол. 3)" value={cargo_type_id} onChange={setCargoTypeId} items={refs.cargo_types} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Кол-во, шт (кол. 4) · 1–999</label>
            <input type="number" min={1} max={999}
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
              value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Дата и время подачи (кол. 5)</label>
            <input type="datetime-local"
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
              value={execution_date} onChange={e => setExecutionDate(e.target.value)} />
          </div>
          <div />
          <Select label="Место погрузки (кол. 6)" value={load_location_id} onChange={setLoadLocId} items={refs.locations} />
          <Select label="Место выгрузки (кол. 7)" value={unload_location_id} onChange={setUnloadLocId} items={refs.locations} />
          <div className="col-span-2">
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Примечание</label>
            <textarea rows={2}
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111] resize-none"
              value={note} onChange={e => setNote(e.target.value)} placeholder="Необязательно" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={submit} disabled={loading}
            className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
            {loading ? "Создание..." : "Сохранить"}
          </button>
          <button onClick={onClose}
            className="border border-[#E0E0E0] px-5 py-2 text-xs font-medium text-[#555] hover:bg-[#F0F0EE] transition-colors">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Панель редактирования заявки ───────────────────────────────────────────
function OrderPanel({ order, user, refs, onClose, onSaved }: {
  order: Order; user: User; refs: Refs; onClose: () => void; onSaved: () => void;
}) {
  const [fields, setFields] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: string, v: string | number | boolean) => setFields(p => ({ ...p, [k]: v }));

  const stage = order.stage || 1;
  const minStage = ROLE_MIN_STAGE[user.role] ?? 99;
  const canEdit = stage >= minStage;

  // Водитель — только свои заявки
  const isMyOrder = user.role !== "driver" || order.driver_id === user.id;
  const editable = canEdit && isMyOrder;

  const save = async () => {
    if (!Object.keys(fields).length) { onClose(); return; }
    setSaving(true); setSaveError("");
    const res = await apiUpdateOrder(order.id, fields);
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else setSaveError(res.error || "Ошибка сохранения");
  };

  const val = (k: string) => fields[k] !== undefined
    ? String(fields[k])
    : String((order as unknown as Record<string, unknown>)[k] || "");

  const canEditField = (roleFields: string[], k: string) =>
    editable && roleFields.includes(k);

  const Input = ({ label, k, type = "text", roleFields }: {
    label: string; k: string; type?: string; roleFields: string[];
  }) => {
    const editable_ = canEditField(roleFields, k);
    return (
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#AAA] mb-1">{label}</label>
        {editable_ ? (
          <input type={type}
            className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1.5 text-sm outline-none focus:border-[#111]"
            value={val(k)} onChange={e => set(k, e.target.value)} placeholder="—" />
        ) : (
          <p className={`text-sm py-0.5 ${val(k) ? "text-[#111]" : "text-[#CCC]"}`}>
            {val(k) || "не заполнено"}
          </p>
        )}
      </div>
    );
  };

  const Select_ = ({ label, k, items, roleFields }: {
    label: string; k: string; items: RefItem[]; roleFields: string[];
  }) => {
    const editable_ = canEditField(roleFields, k);
    const currentVal = val(k);
    const found = items.find(i => String(i.id) === currentVal);
    return (
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#AAA] mb-1">{label}</label>
        {editable_ ? (
          <select className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1.5 text-sm outline-none focus:border-[#111]"
            value={currentVal} onChange={e => set(k, e.target.value)}>
            <option value="">— выберите —</option>
            {items.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
          </select>
        ) : (
          <p className={`text-sm py-0.5 ${found || currentVal ? "text-[#111]" : "text-[#CCC]"}`}>
            {found?.name || currentVal || "не заполнено"}
          </p>
        )}
      </div>
    );
  };

  // Поля по ролям
  const ppbFields = ["priority"];
  const tcFields = ["vehicle_id"];
  const masterFields = ["driver_id"];
  const driverFields = ["arrival_load_time", "load_start_time", "arrival_unload_time", "unload_start_time"];
  const senderFields = ["departure_load_time", "sender_sign"];
  const receiverFields = ["departure_unload_time", "receiver_sign", "done"];
  const noteFields = ["note"];

  const hasEdits = Object.keys(fields).length > 0;

  const stageBlocked = !canEdit && user.role !== "shop_chief";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="bg-white h-full w-full max-w-2xl overflow-y-auto animate-slide-in shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] text-[#999] font-mono mb-0.5">{order.order_num} · {order.created_date}</p>
            <h2 className="text-base font-semibold leading-tight">{order.cargo_name || "Заявка без груза"}</h2>
          </div>
          <div className="flex items-center gap-2">
            {hasEdits && !stageBlocked && (
              <button onClick={save} disabled={saving}
                className="bg-[#111] text-white px-4 py-1.5 text-xs font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE]">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4 pb-4 border-b border-[#F0F0EE]">
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`h-1.5 flex-1 ${i < stage ? "bg-[#111]" : "bg-[#E8E8E8]"}`} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#888]">
              Этап {stage} из 9 — <span className="text-[#111] font-medium">{STAGE_LABELS[stage]}</span>
            </p>
            {stageBlocked && (
              <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5">
                Ваш этап ещё не наступил
              </span>
            )}
          </div>
          {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
        </div>

        <div className="px-6 py-5 space-y-6 flex-1">

          {/* Блок 1: Заявка (кол. 1-7) — только просмотр для всех кроме admina */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#111] text-white flex items-center justify-center text-[9px]">1</span>
              Заявка · Начальник цеха
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Подразделение</p>
                <p className="text-sm">{order.department || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Автор заявки</p>
                <p className="text-sm">{order.applicant_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Груз (кол. 3)</p>
                <p className="text-sm">{order.cargo_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Кол-во, шт (кол. 4)</p>
                <p className="text-sm">{order.quantity || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Дата/время подачи (кол. 5)</p>
                <p className="text-sm">{order.execution_date || "—"}</p>
              </div>
              <div />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Место погрузки (кол. 6)</p>
                <p className="text-sm">{order.load_place || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Место выгрузки (кол. 7)</p>
                <p className="text-sm">{order.unload_place || "—"}</p>
              </div>
            </div>
          </section>

          {/* Блок 2: ППБ — приоритет (кол. 8) */}
          <section className={stage < 1 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] ${stage >= 2 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>2</span>
              ППБ · Приоритет
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Приоритет 1–99 (кол. 8)" k="priority" type="number" roleFields={ppbFields} />
            </div>
          </section>

          {/* Блок 3: ТЦ — транспорт (кол. 9) */}
          <section className={stage < 2 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] ${stage >= 3 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>3</span>
              Транспортный цех · Выбор техники
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Select_ label="Транспорт (кол. 9)" k="vehicle_id" items={refs.vehicles} roleFields={tcFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Выбрано</p>
                <p className="text-sm">{order.vehicle_model || val("vehicle_id") && refs.vehicles.find(v => String(v.id) === val("vehicle_id"))?.name || "—"}</p>
              </div>
            </div>
          </section>

          {/* Блок 4: Мастер ТЦ — водитель (кол. 10) */}
          <section className={stage < 3 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] ${stage >= 4 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>4</span>
              Мастер ТЦ · Назначение водителя
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Select_ label="Водитель (кол. 10)" k="driver_id" items={refs.drivers} roleFields={masterFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Назначен</p>
                <p className="text-sm">{order.driver_name || "—"}</p>
              </div>
            </div>
          </section>

          {/* Блок 5+6: Погрузка */}
          <section className={stage < 4 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] ${stage >= 6 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>5–6</span>
              Погрузка · Водитель и ответственный за сдачу
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Время заезда в цех (кол. 11)" k="arrival_load_time" type="time" roleFields={driverFields} />
              <Input label="Время начала погрузки (кол. 12)" k="load_start_time" type="time" roleFields={driverFields} />
              <Input label="Время выезда из цеха (кол. 13)" k="departure_load_time" type="time" roleFields={senderFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Ответственный за сдачу (кол. 14)</p>
                {user.role === "sender" && editable ? (
                  <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-2.5 py-1.5 text-sm text-[#888]">
                    {user.name} <span className="text-[10px] text-[#AAA]">(автоматически)</span>
                  </div>
                ) : (
                  <p className={`text-sm py-0.5 ${order.sender_sign ? "text-[#111]" : "text-[#CCC]"}`}>
                    {order.sender_sign || "не заполнено"}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Блок 7+8: Разгрузка */}
          <section className={stage < 7 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] ${stage >= 8 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>7–8</span>
              Разгрузка · Водитель и ответственный за приём
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Время заезда в цех (кол. 15)" k="arrival_unload_time" type="time" roleFields={driverFields} />
              <Input label="Время начала разгрузки (кол. 16)" k="unload_start_time" type="time" roleFields={driverFields} />
              <Input label="Время выезда из цеха (кол. 17)" k="departure_unload_time" type="time" roleFields={receiverFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Ответственный за приём (кол. 18)</p>
                {user.role === "receiver" && editable ? (
                  <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-2.5 py-1.5 text-sm text-[#888]">
                    {user.name} <span className="text-[10px] text-[#AAA]">(автоматически)</span>
                  </div>
                ) : (
                  <p className={`text-sm py-0.5 ${order.receiver_sign ? "text-[#111]" : "text-[#CCC]"}`}>
                    {order.receiver_sign || "не заполнено"}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Блок 9: Завершение */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] ${stage === 9 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>9</span>
              Завершение · Начальник цеха + Примечание
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Статус выполнения (кол. 20)</p>
                {user.role === "receiver" && editable && stage >= 7 ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(fields["done"] !== undefined ? fields["done"] : order.done)}
                      onChange={e => set("done", e.target.checked)}
                      className="w-4 h-4 accent-black" />
                    <span className="text-sm">Выполнено</span>
                  </label>
                ) : (
                  <p className={`text-sm py-0.5 font-medium ${order.done ? "text-emerald-600" : "text-[#888]"}`}>
                    {order.done ? "Выполнено" : "В работе"}
                  </p>
                )}
              </div>
              {/* Примечание — все могут видеть, shop_chief может редактировать */}
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-1">Примечание (кол. 19)</p>
                {user.role === "shop_chief" || user.role === "admin" ? (
                  <textarea rows={2}
                    className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1.5 text-sm outline-none focus:border-[#111] resize-none"
                    value={String(fields["note"] !== undefined ? fields["note"] : order.note || "")}
                    onChange={e => set("note", e.target.value)} placeholder="Примечание" />
                ) : (
                  <p className={`text-sm py-0.5 ${order.note ? "text-[#111]" : "text-[#CCC]"}`}>
                    {order.note || "—"}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Главный компонент ──────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refs, setRefs] = useState<Refs>({ departments: [], cargo_types: [], locations: [], vehicles: [], drivers: [] });
  const [filterStatus, setFilterStatus] = useState("все");
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const loadRefs = useCallback(async () => {
    const data = await apiGetRefs();
    if (data.vehicles) setRefs(data);
  }, []);

  const loadLogs = useCallback(async () => {
    const data = await apiGetLogs();
    if (Array.isArray(data)) setLogs(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadRefs();
  }, [user, loadOrders, loadRefs]);

  useEffect(() => {
    if (!user || tab !== "history") return;
    loadLogs();
  }, [user, tab, loadLogs]);

  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  const isShopChief = user?.role === "shop_chief" || user?.role === "admin";

  const filtered = filterStatus === "все" ? orders
    : filterStatus === "выполнено" ? orders.filter(o => o.done)
    : orders.filter(o => !o.done);

  const total = orders.length;
  const done = orders.filter(o => o.done).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] font-ibm flex items-center justify-center">
        <p className="text-sm text-[#999]">Загрузка...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={u => setUser(u)} />;

  // Начальник цеха — сначала форма создания, потом список
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
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-[10px] text-[#AAA]">{ROLE_LABELS[user.role]} · {user.department_name}</p>
            </div>
            <button onClick={logout} title="Выйти"
              className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
              <Icon name="LogOut" size={14} className="text-[#888]" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex border border-[#E0E0E0] bg-white w-fit mb-6">
          {([
            { key: "orders", label: "Заявки", icon: "Package" },
            { key: "reports", label: "Отчёты", icon: "BarChart2" },
            { key: "history", label: "История", icon: "Clock" },
          ] as { key: Tab; label: string; icon: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors border-r border-[#E0E0E0] last:border-r-0 ${tab === t.key ? "bg-[#111] text-white" : "text-[#555] hover:bg-[#F0F0EE]"}`}>
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ЗАЯВКИ ── */}
        {tab === "orders" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex border border-[#E0E0E0] bg-white">
                {["все", "в работе", "выполнено"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-4 py-1.5 text-xs font-medium border-r border-[#E0E0E0] last:border-r-0 transition-colors ${filterStatus === s ? "bg-[#111] text-white" : "text-[#666] hover:bg-[#F0F0EE]"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={loadOrders} title="Обновить"
                  className="border border-[#E0E0E0] px-3 py-2 hover:bg-[#F0F0EE] transition-colors">
                  <Icon name="RefreshCw" size={13} className="text-[#888]" />
                </button>
                {isShopChief && (
                  <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333] transition-colors">
                    <Icon name="Plus" size={13} />
                    Новая заявка
                  </button>
                )}
              </div>
            </div>

            {showForm && isShopChief && (
              <NewOrderForm user={user} refs={refs} onClose={() => setShowForm(false)} onCreated={loadOrders} />
            )}

            {/* Таблица */}
            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              <div className="grid grid-cols-[90px_100px_1fr_60px_60px_200px_130px_110px] min-w-[900px] bg-[#F7F7F5] border-b border-[#E0E0E0]">
                {["№", "Дата", "Груз / Подразделение", "Кол.", "Приор.", "Место погрузки → выгрузки", "Водитель", "Этап"].map(h => (
                  <div key={h} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="py-16 text-center text-sm text-[#BBB]">
                  {orders.length === 0 ? "Нет заявок. Нажмите «Новая заявка»." : "Нет заявок по фильтру."}
                </div>
              )}
              {filtered.map((o, i) => {
                const s = o.stage || 1;
                return (
                  <div key={o.id} onClick={() => setSelectedOrder(o)}
                    className={`grid grid-cols-[90px_100px_1fr_60px_60px_200px_130px_110px] min-w-[900px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] cursor-pointer transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                    <div className="px-3 py-3 text-[11px] font-mono text-[#888]">{o.order_num}</div>
                    <div className="px-3 py-3 text-xs text-[#666]">{o.created_date}</div>
                    <div className="px-3 py-3">
                      <p className="text-sm font-medium leading-tight">{o.cargo_name || <span className="text-[#CCC]">не указан</span>}</p>
                      <p className="text-[11px] text-[#AAA] mt-0.5">{o.department}{o.applicant_name ? ` · ${o.applicant_name}` : ""}</p>
                    </div>
                    <div className="px-3 py-3 text-sm text-[#555]">{o.quantity || "—"}</div>
                    <div className="px-3 py-3">
                      <span className={`text-xs font-bold ${o.priority !== null && o.priority <= 5 ? "text-red-600" : o.priority !== null && o.priority <= 20 ? "text-amber-600" : "text-[#AAA]"}`}>
                        {o.priority ?? "—"}
                      </span>
                    </div>
                    <div className="px-3 py-3 text-xs text-[#666]">
                      <p className="truncate">{o.load_place || "—"}</p>
                      <p className="truncate text-[#AAA] mt-0.5">{o.unload_place || "—"}</p>
                    </div>
                    <div className="px-3 py-3 text-xs">
                      {o.driver_name || <span className="text-[#CCC]">не назначен</span>}
                    </div>
                    <div className="px-3 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 border ${STAGE_COLOR[s]}`}>
                        {STAGE_LABELS[s]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#AAA] mt-2">
              Показано {filtered.length} из {orders.length} · нажмите строку для заполнения
            </p>
          </div>
        )}

        {/* ── ОТЧЁТЫ ── */}
        {tab === "reports" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E0E0E0] border border-[#E0E0E0] mb-6">
              {[
                { label: "Всего заявок", value: String(total), sub: "в базе" },
                { label: "Выполнено", value: String(done), sub: total ? `${Math.round(done / total * 100)}%` : "0%" },
                { label: "В работе", value: String(total - done), sub: "активных" },
                { label: "Срочных", value: String(orders.filter(o => o.priority !== null && o.priority <= 5 && !o.done).length), sub: "приоритет ≤5" },
              ].map(s => (
                <div key={s.label} className="bg-white px-6 py-5">
                  <p className="text-[10px] uppercase tracking-wider text-[#999] mb-1">{s.label}</p>
                  <p className="text-3xl font-semibold">{s.value}</p>
                  <p className="text-xs text-[#888] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-[#E0E0E0] p-6">
              <p className="text-[10px] uppercase tracking-wider text-[#999] mb-4">По этапам</p>
              {Array.from({ length: 9 }, (_, i) => i + 1).map(s => {
                const count = orders.filter(o => (o.stage || 1) === s).length;
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="text-[10px] text-[#888] w-4">{s}</span>
                    <span className="text-xs w-36 shrink-0">{STAGE_LABELS[s]}</span>
                    <div className="flex-1 h-1.5 bg-[#F0F0EE]">
                      <div className="h-full bg-[#111] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[#AAA] w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
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
              {logs.length === 0 && <div className="py-12 text-center text-sm text-[#BBB]">История пуста</div>}
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
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderPanel order={selectedOrder} user={user} refs={refs}
          onClose={() => setSelectedOrder(null)} onSaved={loadOrders} />
      )}
    </div>
  );
}
