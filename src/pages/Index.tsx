import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "orders" | "reports" | "history";

// 9 этапов заявки
// Этап 1 (день до): начальник цеха
// Этап 2: ППБ
// Этап 3: ТЦ
// Этап 4: мастер транспортного цеха
// Этап 5: водитель
// Этап 6: ответственный за сдачу (погрузка)
// Этап 7: водитель
// Этап 8: ответственный за приём (разгрузка)
// Этап 9: статус выполнения

interface Order {
  id: string;
  // Этап 1 — начальник цеха
  department: string;          // 1. Подразделение
  applicantName: string;       // 2. Ф.И.О. подающего заявку
  // Этап 2 — ППБ
  cargoName: string;           // 3. Наименование груза
  quantity: string;            // 4. Кол-во (шт)
  requestTime: string;         // 5. Время подачи
  loadPlace: string;           // 6. Место погрузки
  unloadPlace: string;         // 7. Место выгрузки
  priority: string;            // 8. Приоритет (1-99)
  // Этап 3 — ТЦ
  vehicleModel: string;        // 9. Наименование/модель транспорта
  driverName: string;          // 10. ФИО водителя
  // Этап 4 — мастер транспортного цеха (нет отдельных полей, утверждает)
  // Этап 5 — водитель (погрузка)
  arrivalLoadTime: string;     // 11. Время заезда в цех (погрузка)
  loadStartTime: string;       // 12. Время начала погрузки
  departureLoadTime: string;   // 13. Время выезда из цеха
  // Этап 6 — ответственный за сдачу
  senderSign: string;          // 14. Ответственный за сдачу (подпись)
  // Этап 7 — водитель (разгрузка)
  arrivalUnloadTime: string;   // 15. Время заезда в цех (разгрузка)
  unloadStartTime: string;     // 16. Время начала разгрузки
  departureUnloadTime: string; // 17. Время выезда из цеха
  // Этап 8 — ответственный за приём
  receiverSign: string;        // 18. Ответственный за приём (подпись)
  // Прочее
  note: string;                // 19. Примечание
  done: boolean;               // 20. Статус выполнения
  createdDate: string;
}

const EMPTY_ORDER: Omit<Order, "id" | "createdDate" | "done"> = {
  department: "", applicantName: "", cargoName: "", quantity: "",
  requestTime: "", loadPlace: "", unloadPlace: "", priority: "",
  vehicleModel: "", driverName: "",
  arrivalLoadTime: "", loadStartTime: "", departureLoadTime: "", senderSign: "",
  arrivalUnloadTime: "", unloadStartTime: "", departureUnloadTime: "", receiverSign: "",
  note: "",
};

const SAMPLE_ORDERS: Order[] = [
  {
    id: "ЗПВ-0041", createdDate: "24.04.2026", done: false,
    department: "Цех №3", applicantName: "Морозов В.А.", cargoName: "Коленвал МТЗ-82", quantity: "1",
    requestTime: "08:00", loadPlace: "Склад А, стеллаж 14", unloadPlace: "Цех №3, участок сборки", priority: "5",
    vehicleModel: "ГАЗель Next", driverName: "Иванов К.П.",
    arrivalLoadTime: "09:10", loadStartTime: "09:15", departureLoadTime: "09:35", senderSign: "Горелов П.И.",
    arrivalUnloadTime: "", unloadStartTime: "", departureUnloadTime: "", receiverSign: "",
    note: "Хрупкий груз, осторожно",
  },
  {
    id: "ЗПВ-0040", createdDate: "24.04.2026", done: true,
    department: "Склад Б", applicantName: "Кузнецова И.Р.", cargoName: "Тормозные колодки (к-т)", quantity: "4",
    requestTime: "07:30", loadPlace: "ООО «Дета», ворота №2", unloadPlace: "Склад Б, сектор В", priority: "12",
    vehicleModel: "Ford Transit", driverName: "Петров М.С.",
    arrivalLoadTime: "08:15", loadStartTime: "08:20", departureLoadTime: "08:40", senderSign: "Ефимов А.С.",
    arrivalUnloadTime: "09:05", unloadStartTime: "09:10", departureUnloadTime: "09:25", receiverSign: "Кузнецова И.Р.",
    note: "",
  },
  {
    id: "ЗПВ-0039", createdDate: "23.04.2026", done: true,
    department: "Цех №1", applicantName: "Белов С.Д.", cargoName: "Фильтр масляный (12 шт)", quantity: "12",
    requestTime: "07:00", loadPlace: "Склад Б, стеллаж 3", unloadPlace: "Цех №1, инструменталка", priority: "20",
    vehicleModel: "ГАЗель Next", driverName: "Сидоров А.В.",
    arrivalLoadTime: "07:25", loadStartTime: "07:30", departureLoadTime: "07:45", senderSign: "Орлов В.К.",
    arrivalUnloadTime: "08:00", unloadStartTime: "08:05", departureUnloadTime: "08:15", receiverSign: "Белов С.Д.",
    note: "",
  },
  {
    id: "ЗПВ-0038", createdDate: "23.04.2026", done: false,
    department: "Ремонтный цех", applicantName: "Зайцев Н.М.", cargoName: "Поршневая группа", quantity: "2",
    requestTime: "06:45", loadPlace: "Цех №2, зона хранения", unloadPlace: "Ремонтный цех", priority: "3",
    vehicleModel: "", driverName: "",
    arrivalLoadTime: "", loadStartTime: "", departureLoadTime: "", senderSign: "",
    arrivalUnloadTime: "", unloadStartTime: "", departureUnloadTime: "", receiverSign: "",
    note: "Отменена по распоряжению начальника",
  },
  {
    id: "ЗПВ-0036", createdDate: "24.04.2026", done: false,
    department: "Цех №4", applicantName: "Соколов Р.Е.", cargoName: "Редуктор заднего моста", quantity: "1",
    requestTime: "09:00", loadPlace: "Склад А, тяжёлый сектор", unloadPlace: "Цех №4, монтажный участок", priority: "1",
    vehicleModel: "КамАЗ-4308", driverName: "Новиков Р.Е.",
    arrivalLoadTime: "", loadStartTime: "", departureLoadTime: "", senderSign: "",
    arrivalUnloadTime: "", unloadStartTime: "", departureUnloadTime: "", receiverSign: "",
    note: "",
  },
];

const LOGS = [
  { id: "1", user: "Иванов К.П.", action: "Обновил время заезда", target: "ЗПВ-0041", time: "09:14" },
  { id: "2", user: "Диспетчер Смирнова", action: "Закрыла заявку", target: "ЗПВ-0040 → выполнено", time: "08:52" },
  { id: "3", user: "Петров М.С.", action: "Заполнил этап разгрузки", target: "ЗПВ-0040", time: "08:30" },
  { id: "4", user: "Администратор", action: "Отменил заявку", target: "ЗПВ-0038", time: "07:55" },
  { id: "5", user: "Сидоров А.В.", action: "Завершил доставку", target: "ЗПВ-0039", time: "07:40" },
  { id: "6", user: "Диспетчер Смирнова", action: "Назначила транспорт", target: "ЗПВ-0036 → КамАЗ-4308", time: "07:15" },
  { id: "7", user: "Новиков Р.Е.", action: "Просмотрел заявку", target: "ЗПВ-0036", time: "07:10" },
  { id: "8", user: "Иванов К.П.", action: "Завершил доставку", target: "ЗПВ-0037", time: "вчера 18:22" },
];

const STATS = [
  { label: "Всего за месяц", value: "214", sub: "перевозок" },
  { label: "Выполнено", value: "198", sub: "92,5%" },
  { label: "Отменено", value: "16", sub: "7,5%" },
  { label: "Средний приоритет", value: "8,3", sub: "из 99" },
  { label: "Активных водителей", value: "8", sub: "сегодня" },
  { label: "Заявок сегодня", value: "12", sub: "из них 3 в пути" },
];

const MONTHLY = [
  { month: "Янв", count: 178 },
  { month: "Фев", count: 192 },
  { month: "Мар", count: 205 },
  { month: "Апр", count: 214 },
];
const maxCount = Math.max(...MONTHLY.map(m => m.count));

// Определяем текущий этап заявки
function getStage(o: Order): number {
  if (o.done) return 9;
  if (o.receiverSign) return 9;
  if (o.arrivalUnloadTime) return 8;
  if (o.senderSign) return 7;
  if (o.arrivalLoadTime) return 6;
  if (o.driverName) return 5;
  if (o.vehicleModel) return 4;
  if (o.priority) return 3;
  if (o.applicantName) return 2;
  return 1;
}

const STAGE_LABELS: Record<number, string> = {
  1: "Заявка создана",
  2: "ППБ",
  3: "ТЦ назначен",
  4: "Утверждено мастером",
  5: "Водитель назначен",
  6: "Погрузка",
  7: "В пути",
  8: "Разгрузка",
  9: "Выполнено",
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

// ─── Компонент: детальный просмотр заявки ───────────────────────────────────
function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const stage = getStage(order);

  const STAGES = [
    {
      num: 1, label: "Заявка", role: "Начальник цеха", day: "День до",
      fields: [
        { label: "Подразделение",          value: order.department },
        { label: "Ф.И.О. подающего заявку", value: order.applicantName },
      ],
    },
    {
      num: 2, label: "ППБ", role: "ППБ", day: "День до",
      fields: [
        { label: "Наименование груза",  value: order.cargoName },
        { label: "Кол-во (шт)",         value: order.quantity },
        { label: "Время подачи",         value: order.requestTime },
        { label: "Место погрузки",       value: order.loadPlace },
        { label: "Место выгрузки",       value: order.unloadPlace },
        { label: "Приоритет (1–99)",     value: order.priority },
      ],
    },
    {
      num: 3, label: "ТЦ", role: "Транспортный цех", day: "День до",
      fields: [
        { label: "Наименование/модель транспорта", value: order.vehicleModel },
        { label: "ФИО водителя",                   value: order.driverName },
      ],
    },
    {
      num: 4, label: "Утверждение", role: "Мастер ТЦ", day: "День исполнения",
      fields: [],
    },
    {
      num: 5, label: "Водитель (погрузка)", role: "Водитель", day: "День исполнения",
      fields: [
        { label: "Время заезда в цех",      value: order.arrivalLoadTime },
        { label: "Время начала погрузки",   value: order.loadStartTime },
        { label: "Время выезда из цеха",    value: order.departureLoadTime },
      ],
    },
    {
      num: 6, label: "Сдача груза", role: "Ответственный за сдачу", day: "День исполнения",
      fields: [
        { label: "Ответственный (подпись)", value: order.senderSign },
      ],
    },
    {
      num: 7, label: "Водитель (разгрузка)", role: "Водитель", day: "День исполнения",
      fields: [
        { label: "Время заезда в цех",       value: order.arrivalUnloadTime },
        { label: "Время начала разгрузки",   value: order.unloadStartTime },
        { label: "Время выезда из цеха",     value: order.departureUnloadTime },
      ],
    },
    {
      num: 8, label: "Приём груза", role: "Ответственный за приём", day: "День исполнения",
      fields: [
        { label: "Ответственный (подпись)", value: order.receiverSign },
      ],
    },
    {
      num: 9, label: "Статус", role: "Итог", day: "",
      fields: [
        { label: "Выполнено",   value: order.done ? "Да" : "Нет" },
        { label: "Примечание",  value: order.note || "—" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-2xl overflow-y-auto animate-slide-in shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-[#999] font-mono mb-0.5">{order.id} · {order.createdDate}</p>
            <h2 className="text-base font-semibold">{order.cargoName || "Новая заявка"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-5 pb-4 border-b border-[#F0F0EE]">
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 transition-colors ${i < stage ? "bg-[#111]" : "bg-[#E8E8E8]"}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#888]">Этап {stage} из 9 — <span className="text-[#111] font-medium">{STAGE_LABELS[stage]}</span></p>
        </div>

        {/* Stages */}
        <div className="px-6 py-5 space-y-0">
          {STAGES.map((s, idx) => {
            const isCompleted = stage > s.num;
            const isCurrent = stage === s.num;
            const isPending = stage < s.num;

            return (
              <div key={s.num} className="flex gap-4">
                {/* Timeline */}
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

                {/* Content */}
                <div className={`flex-1 pb-6 ${isPending ? "opacity-40" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className="text-[10px] text-[#999] border border-[#E8E8E8] px-1.5 py-0.5">{s.role}</span>
                    {s.day && <span className="text-[10px] text-[#BBB]">{s.day}</span>}
                  </div>
                  {s.fields.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                      {s.fields.map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] uppercase tracking-wider text-[#AAA]">{f.label}</p>
                          <p className={`text-sm mt-0.5 ${f.value ? "text-[#111]" : "text-[#CCC]"}`}>
                            {f.value || "не заполнено"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#999] mt-1 italic">Визирование / утверждение</p>
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

// ─── Компонент: форма создания заявки ────────────────────────────────────────
function NewOrderForm({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState({ ...EMPTY_ORDER });
  const set = (k: keyof typeof EMPTY_ORDER, v: string) => setData(p => ({ ...p, [k]: v }));

  const Field = ({ label, k, placeholder }: { label: string; k: keyof typeof EMPTY_ORDER; placeholder?: string }) => (
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
        <p className="text-xs font-semibold uppercase tracking-wider text-[#555]">Новая заявка на перевозку — Этап 1</p>
        <span className="text-[10px] text-[#AAA]">Заполняет начальник цеха</span>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        <Field label="Подразделение" k="department" placeholder="Цех №…" />
        <Field label="Ф.И.О. подающего заявку" k="applicantName" placeholder="Фамилия И.О." />
        <Field label="Наименование груза" k="cargoName" />
        <Field label="Кол-во (шт)" k="quantity" placeholder="1" />
        <Field label="Время подачи" k="requestTime" placeholder="08:00" />
        <Field label="Приоритет (1–99)" k="priority" placeholder="50" />
        <Field label="Место погрузки" k="loadPlace" />
        <Field label="Место выгрузки" k="unloadPlace" />
      </div>
      <div className="px-5 pb-4 flex gap-2">
        <button className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] transition-colors">
          Создать заявку
        </button>
        <button onClick={onClose} className="border border-[#E0E0E0] px-5 py-2 text-xs font-medium text-[#555] hover:bg-[#F0F0EE] transition-colors">
          Отмена
        </button>
      </div>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function Index() {
  const [tab, setTab] = useState<Tab>("orders");
  const [filterStage, setFilterStage] = useState<string>("все");
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = filterStage === "все"
    ? SAMPLE_ORDERS
    : filterStage === "выполнено"
      ? SAMPLE_ORDERS.filter(o => o.done)
      : filterStage === "в работе"
        ? SAMPLE_ORDERS.filter(o => !o.done)
        : SAMPLE_ORDERS;

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
            <span className="text-xs text-[#888]">24 апреля 2026</span>
            <div className="w-8 h-8 rounded-full bg-[#E8E8E8] flex items-center justify-center">
              <Icon name="User" size={14} className="text-[#555]" />
            </div>
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
          ] as { key: Tab; label: string; icon: string }[]).map((t) => (
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

        {/* ── ЗАЯВКИ ─────────────────────────────────────────────────────── */}
        {tab === "orders" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-0 border border-[#E0E0E0] bg-white">
                {["все", "в работе", "выполнено"].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStage(s)}
                    className={`px-4 py-1.5 text-xs font-medium border-r border-[#E0E0E0] last:border-r-0 transition-colors ${
                      filterStage === s ? "bg-[#111] text-white" : "text-[#666] hover:bg-[#F0F0EE]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333] transition-colors"
              >
                <Icon name="Plus" size={13} />
                Новая заявка
              </button>
            </div>

            {showForm && <NewOrderForm onClose={() => setShowForm(false)} />}

            {/* Таблица заявок */}
            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              {/* Заголовок — 2 строки */}
              <div className="grid grid-cols-[90px_110px_1fr_80px_80px_140px_130px_100px] min-w-[900px] bg-[#F7F7F5] border-b border-[#E0E0E0]">
                {["№", "Дата", "Груз / Подразделение", "Кол-во", "Приор.", "Погрузка → Выгрузка", "Водитель", "Этап"].map(h => (
                  <div key={h} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>

              {filteredOrders.map((o, i) => {
                const stage = getStage(o);
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`grid grid-cols-[90px_110px_1fr_80px_80px_140px_130px_100px] min-w-[900px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i === filteredOrders.length - 1 ? "border-b-0" : ""}`}
                  >
                    <div className="px-3 py-3 text-xs font-mono text-[#888]">{o.id}</div>
                    <div className="px-3 py-3 text-xs text-[#666]">{o.createdDate}</div>
                    <div className="px-3 py-3">
                      <p className="text-sm font-medium leading-tight">{o.cargoName}</p>
                      <p className="text-[11px] text-[#AAA] mt-0.5">{o.department} · {o.applicantName}</p>
                    </div>
                    <div className="px-3 py-3 text-sm text-[#555]">{o.quantity}</div>
                    <div className="px-3 py-3">
                      <span className={`text-xs font-bold ${Number(o.priority) <= 5 ? "text-red-600" : Number(o.priority) <= 20 ? "text-amber-600" : "text-[#AAA]"}`}>
                        {o.priority || "—"}
                      </span>
                    </div>
                    <div className="px-3 py-3 text-xs text-[#666]">
                      <p className="truncate">{o.loadPlace || "—"}</p>
                      <p className="truncate text-[#AAA]">{o.unloadPlace || "—"}</p>
                    </div>
                    <div className="px-3 py-3 text-xs text-[#555]">{o.driverName || <span className="text-[#CCC]">не назначен</span>}</div>
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
              Показано {filteredOrders.length} из {SAMPLE_ORDERS.length} заявок · нажмите на строку, чтобы открыть
            </p>
          </div>
        )}

        {/* ── ОТЧЁТЫ ─────────────────────────────────────────────────────── */}
        {tab === "reports" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-3 gap-px bg-[#E0E0E0] border border-[#E0E0E0] mb-6">
              {STATS.map(s => (
                <div key={s.label} className="bg-white px-6 py-5">
                  <p className="text-[10px] uppercase tracking-wider text-[#999] mb-1">{s.label}</p>
                  <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
                  <p className="text-xs text-[#888] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#E0E0E0] p-6 mb-6">
              <p className="text-[10px] uppercase tracking-wider text-[#999] mb-6">Динамика перевозок</p>
              <div className="flex items-end gap-6 h-36">
                {MONTHLY.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-[#111]">{m.count}</span>
                    <div className="w-full bg-[#111]" style={{ height: `${(m.count / maxCount) * 100}%` }} />
                    <span className="text-[10px] text-[#888]">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E0E0E0] p-6">
              <p className="text-[10px] uppercase tracking-wider text-[#999] mb-4">Топ водителей (апрель)</p>
              {[
                { name: "Иванов К.П.",  count: 58, pct: 100 },
                { name: "Петров М.С.", count: 51, pct: 87 },
                { name: "Сидоров А.В.", count: 44, pct: 75 },
                { name: "Новиков Р.Е.", count: 38, pct: 65 },
                { name: "Козлов Д.И.", count: 23, pct: 39 },
              ].map(d => (
                <div key={d.name} className="flex items-center gap-4 mb-3 last:mb-0">
                  <span className="text-sm w-36 shrink-0">{d.name}</span>
                  <div className="flex-1 h-1.5 bg-[#F0F0EE]">
                    <div className="h-full bg-[#111]" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="text-xs text-[#888] w-14 text-right">{d.count} рейс.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ИСТОРИЯ ────────────────────────────────────────────────────── */}
        {tab === "history" && (
          <div className="animate-fade-in">
            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              <div className="grid grid-cols-[180px_1fr_220px_90px] min-w-[700px] border-b border-[#E0E0E0] bg-[#F7F7F5]">
                {["Пользователь", "Действие", "Объект", "Время"].map(h => (
                  <div key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>
              {LOGS.map((l, i) => (
                <div key={l.id} className={`grid grid-cols-[180px_1fr_220px_90px] min-w-[700px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] ${i === LOGS.length - 1 ? "border-b-0" : ""}`}>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                      <Icon name="User" size={10} className="text-[#666]" />
                    </div>
                    <span className="text-xs text-[#555] truncate">{l.user}</span>
                  </div>
                  <div className="px-4 py-3 text-sm">{l.action}</div>
                  <div className="px-4 py-3 text-xs font-mono text-[#888]">{l.target}</div>
                  <div className="px-4 py-3 text-xs text-[#AAA]">{l.time}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#AAA] mt-2">Последние {LOGS.length} событий · обновлено только что</p>
          </div>
        )}
      </div>

      {/* Детальный просмотр заявки */}
      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
