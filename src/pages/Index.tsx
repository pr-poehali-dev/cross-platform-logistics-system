import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "orders" | "reports" | "history";
type OrderStatus = "новый" | "в пути" | "доставлен" | "отменён";

interface Order {
  id: string;
  part: string;
  from: string;
  to: string;
  driver: string;
  status: OrderStatus;
  date: string;
  weight: string;
}

interface LogEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

const ORDERS: Order[] = [
  { id: "ПРВ-0041", part: "Коленвал МТЗ-82", from: "Склад А", to: "Цех №3", driver: "Иванов К.П.", status: "в пути", date: "24.04.2026", weight: "14 кг" },
  { id: "ПРВ-0040", part: "Тормозные колодки (к-т)", from: "ООО «Дета»", to: "Склад Б", driver: "Петров М.С.", status: "доставлен", date: "24.04.2026", weight: "3 кг" },
  { id: "ПРВ-0039", part: "Фильтр масляный (12 шт)", from: "Склад Б", to: "Цех №1", driver: "Сидоров А.В.", status: "доставлен", date: "23.04.2026", weight: "2 кг" },
  { id: "ПРВ-0038", part: "Поршневая группа", from: "Цех №2", to: "Ремонтный цех", driver: "Козлов Д.И.", status: "отменён", date: "23.04.2026", weight: "8 кг" },
  { id: "ПРВ-0037", part: "Форсунки топливные (4 шт)", from: "ЗАО «Авто»", to: "Склад А", driver: "Иванов К.П.", status: "доставлен", date: "22.04.2026", weight: "1 кг" },
  { id: "ПРВ-0036", part: "Редуктор заднего моста", from: "Склад А", to: "Цех №4", driver: "Новиков Р.Е.", status: "новый", date: "24.04.2026", weight: "22 кг" },
];

const LOGS: LogEntry[] = [
  { id: "1", user: "Иванов К.П.", action: "Создал заказ", target: "ПРВ-0041", time: "09:14" },
  { id: "2", user: "Диспетчер Смирнова", action: "Изменила статус", target: "ПРВ-0040 → доставлен", time: "08:52" },
  { id: "3", user: "Петров М.С.", action: "Принял заказ", target: "ПРВ-0040", time: "08:30" },
  { id: "4", user: "Администратор", action: "Отменил заказ", target: "ПРВ-0038", time: "07:55" },
  { id: "5", user: "Сидоров А.В.", action: "Завершил доставку", target: "ПРВ-0039", time: "07:40" },
  { id: "6", user: "Диспетчер Смирнова", action: "Создала заказ", target: "ПРВ-0036", time: "07:15" },
  { id: "7", user: "Новиков Р.Е.", action: "Просмотрел заказ", target: "ПРВ-0036", time: "07:10" },
  { id: "8", user: "Иванов К.П.", action: "Завершил доставку", target: "ПРВ-0037", time: "вчера 18:22" },
];

const STATUS_STYLE: Record<OrderStatus, string> = {
  "новый":     "bg-blue-50 text-blue-700 border border-blue-200",
  "в пути":    "bg-amber-50 text-amber-700 border border-amber-200",
  "доставлен": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "отменён":   "bg-red-50 text-red-600 border border-red-200",
};

const STATS = [
  { label: "Всего за месяц", value: "214", sub: "перевозок" },
  { label: "Выполнено", value: "198", sub: "92,5%" },
  { label: "Отменено", value: "16", sub: "7,5%" },
  { label: "Средний вес", value: "6,4 кг", sub: "на рейс" },
  { label: "Активных водителей", value: "8", sub: "сегодня" },
  { label: "Заказов сегодня", value: "12", sub: "из них 3 в пути" },
];

const MONTHLY = [
  { month: "Янв", count: 178 },
  { month: "Фев", count: 192 },
  { month: "Мар", count: 205 },
  { month: "Апр", count: 214 },
];

const maxCount = Math.max(...MONTHLY.map(m => m.count));

export default function Index() {
  const [tab, setTab] = useState<Tab>("orders");
  const [filterStatus, setFilterStatus] = useState<string>("все");
  const [showForm, setShowForm] = useState(false);
  const [newOrder, setNewOrder] = useState({ part: "", from: "", to: "", driver: "", weight: "" });

  const filtered = filterStatus === "все"
    ? ORDERS
    : ORDERS.filter(o => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm text-[#111]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-50">
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
            { key: "orders",  label: "Заказы",  icon: "Package" },
            { key: "reports", label: "Отчёты",  icon: "BarChart2" },
            { key: "history", label: "История", icon: "Clock" },
          ] as { key: Tab; label: string; icon: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors border-r border-[#E0E0E0] last:border-r-0 ${
                tab === t.key
                  ? "bg-[#111] text-white"
                  : "text-[#555] hover:bg-[#F0F0EE]"
              }`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* === ORDERS === */}
        {tab === "orders" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-0 border border-[#E0E0E0] bg-white">
                {["все", "новый", "в пути", "доставлен", "отменён"].map((s) => (
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
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333] transition-colors"
              >
                <Icon name="Plus" size={13} />
                Новый заказ
              </button>
            </div>

            {/* New order form */}
            {showForm && (
              <div className="bg-white border border-[#E0E0E0] p-5 mb-4 animate-fade-in">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#888] mb-4">Создание заказа</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {[
                    { key: "part",   label: "Наименование детали" },
                    { key: "from",   label: "Откуда" },
                    { key: "to",     label: "Куда" },
                    { key: "driver", label: "Водитель" },
                    { key: "weight", label: "Вес" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">{f.label}</label>
                      <input
                        className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111] transition-colors"
                        value={newOrder[f.key as keyof typeof newOrder]}
                        onChange={e => setNewOrder(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] transition-colors">
                    Создать
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="border border-[#E0E0E0] px-5 py-2 text-xs font-medium text-[#555] hover:bg-[#F0F0EE] transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Orders table */}
            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              <div className="grid grid-cols-[90px_1fr_130px_130px_150px_110px_90px] min-w-[800px] border-b border-[#E0E0E0] bg-[#F7F7F5]">
                {["№ заказа", "Деталь", "Откуда", "Куда", "Водитель", "Статус", "Дата"].map(h => (
                  <div key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>
              {filtered.map((o, i) => (
                <div
                  key={o.id}
                  className={`grid grid-cols-[90px_1fr_130px_130px_150px_110px_90px] min-w-[800px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                >
                  <div className="px-4 py-3 text-xs font-mono text-[#888]">{o.id}</div>
                  <div className="px-4 py-3 text-sm font-medium">{o.part}</div>
                  <div className="px-4 py-3 text-xs text-[#666] truncate">{o.from}</div>
                  <div className="px-4 py-3 text-xs text-[#666] truncate">{o.to}</div>
                  <div className="px-4 py-3 text-xs text-[#555]">{o.driver}</div>
                  <div className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="px-4 py-3 text-xs text-[#888]">{o.date}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#AAA] mt-2">Показано {filtered.length} из {ORDERS.length} заказов</p>
          </div>
        )}

        {/* === REPORTS === */}
        {tab === "reports" && (
          <div className="animate-fade-in">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-[#E0E0E0] border border-[#E0E0E0] mb-6">
              {STATS.map(s => (
                <div key={s.label} className="bg-white px-6 py-5">
                  <p className="text-[10px] uppercase tracking-wider text-[#999] mb-1">{s.label}</p>
                  <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
                  <p className="text-xs text-[#888] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white border border-[#E0E0E0] p-6 mb-6">
              <p className="text-[10px] uppercase tracking-wider text-[#999] mb-6">Динамика перевозок</p>
              <div className="flex items-end gap-6 h-36">
                {MONTHLY.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-[#111]">{m.count}</span>
                    <div
                      className="w-full bg-[#111] transition-all"
                      style={{ height: `${(m.count / maxCount) * 100}%` }}
                    />
                    <span className="text-[10px] text-[#888]">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top drivers */}
            <div className="bg-white border border-[#E0E0E0] p-6">
              <p className="text-[10px] uppercase tracking-wider text-[#999] mb-4">Топ водителей (апрель)</p>
              {[
                { name: "Иванов К.П.",    count: 58, pct: 100 },
                { name: "Петров М.С.",    count: 51, pct: 87 },
                { name: "Сидоров А.В.",   count: 44, pct: 75 },
                { name: "Новиков Р.Е.",   count: 38, pct: 65 },
                { name: "Козлов Д.И.",    count: 23, pct: 39 },
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

        {/* === HISTORY === */}
        {tab === "history" && (
          <div className="animate-fade-in">
            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              <div className="grid grid-cols-[180px_1fr_220px_90px] min-w-[700px] border-b border-[#E0E0E0] bg-[#F7F7F5]">
                {["Пользователь", "Действие", "Объект", "Время"].map(h => (
                  <div key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>
              {LOGS.map((l, i) => (
                <div
                  key={l.id}
                  className={`grid grid-cols-[180px_1fr_220px_90px] min-w-[700px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] transition-colors ${i === LOGS.length - 1 ? "border-b-0" : ""}`}
                >
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
    </div>
  );
}