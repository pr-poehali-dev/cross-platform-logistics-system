import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiAdminList, apiAdminAdd, apiAdminEdit, apiAdminDelete } from "@/api";

interface RefItem { id: number; name: string; }
interface UserItem {
  id: number; name: string; login: string;
  role: string; department_id: number | null; dept_name: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  shop_chief: "Начальник цеха", ppb: "ППБ", tc: "Транспортный цех",
  tc_master: "Мастер ТЦ", driver: "Водитель",
  sender: "Отв. за сдачу", receiver: "Отв. за приём", admin: "Администратор",
};
const ROLES = Object.keys(ROLE_LABELS);

type Section = "cargo_types" | "locations" | "vehicles" | "departments" | "users";
const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "departments",  label: "Подразделения",   icon: "Building2" },
  { key: "cargo_types",  label: "Грузы",            icon: "Package" },
  { key: "locations",    label: "Места погр./выгр.", icon: "MapPin" },
  { key: "vehicles",     label: "Техника",           icon: "Truck" },
  { key: "users",        label: "Пользователи",      icon: "Users" },
];

// ── Редактируемая строка справочника ───────────────────────────────────────
function RefRow({ item, onSave, onDelete }: {
  item: RefItem;
  onSave: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.name);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!val.trim() || val === item.name) { setEditing(false); return; }
    setLoading(true);
    await onSave(item.id, val.trim());
    setLoading(false);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b border-[#F0F0EE] last:border-b-0 group">
      {editing ? (
        <>
          <input autoFocus
            className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1 text-sm outline-none focus:border-[#111]"
            value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setVal(item.name); } }}
          />
          <button onClick={save} disabled={loading}
            className="bg-[#111] text-white px-3 py-1 text-xs hover:bg-[#333] disabled:opacity-50">
            {loading ? "..." : "OK"}
          </button>
          <button onClick={() => { setEditing(false); setVal(item.name); }}
            className="border border-[#E0E0E0] px-3 py-1 text-xs hover:bg-[#F0F0EE]">Отмена</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{item.name}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="w-7 h-7 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
              <Icon name="Pencil" size={12} className="text-[#888]" />
            </button>
            <button onClick={() => onDelete(item.id)}
              className="w-7 h-7 flex items-center justify-center hover:bg-red-50 transition-colors">
              <Icon name="Trash2" size={12} className="text-[#CCC] hover:text-red-500" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Панель справочника (грузы / места / техника / подразделения) ───────────
function RefPanel({ resource, label }: { resource: Section; label: string }) {
  const [items, setItems] = useState<RefItem[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await apiAdminList(resource);
    if (Array.isArray(data)) setItems(data);
    setLoading(false);
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true); setError("");
    try {
      const res = await apiAdminAdd(resource, { name: newName.trim() });
      if (res.id) { setNewName(""); load(); }
      else setError((res.error as string) || "Ошибка добавления");
    } finally {
      setAdding(false);
    }
  };

  const save = async (id: number, name: string) => {
    await apiAdminEdit(resource, { id, name });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить запись?")) return;
    const res = await apiAdminDelete(resource, id);
    if (res.ok) load();
    else alert(res.error || "Нельзя удалить — запись используется");
  };

  return (
    <div>
      {/* Форма добавления */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
          placeholder={`Новая запись в «${label}»`}
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
        />
        <button onClick={add} disabled={adding || !newName.trim()}
          className="bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333] disabled:opacity-40 flex items-center gap-1.5">
          <Icon name="Plus" size={12} />
          Добавить
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {/* Список */}
      <div className="bg-white border border-[#E0E0E0] px-4">
        {loading && <p className="text-sm text-[#AAA] py-6 text-center">Загрузка...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-[#CCC] py-6 text-center">Список пуст</p>
        )}
        {items.map(item => (
          <RefRow key={item.id} item={item} onSave={save} onDelete={del} />
        ))}
      </div>
      <p className="text-[10px] text-[#AAA] mt-2">{items.length} записей · наведите на строку для редактирования</p>
    </div>
  );
}

// ── Панель пользователей ───────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: "", login: "", password: "", role: "driver", department_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [u, d] = await Promise.all([apiAdminList("users"), apiAdminList("departments")]);
    if (Array.isArray(u)) setUsers(u);
    if (Array.isArray(d)) setDepartments(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: "", login: "", password: "", role: "driver", department_id: "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setForm({ name: u.name, login: u.login, password: "", role: u.role, department_id: u.department_id ? String(u.department_id) : "" });
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    setError("");
    if (!form.name.trim() || !form.login.trim()) { setError("Имя и логин обязательны"); return; }
    if (!editUser && !form.password.trim()) { setError("Пароль обязателен для нового пользователя"); return; }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name: form.name.trim(), login: form.login.trim(), role: form.role,
        department_id: form.department_id ? Number(form.department_id) : null,
      };
      if (form.password.trim()) data.password = form.password.trim();
      let res;
      if (editUser) {
        res = await apiAdminEdit("users", { id: editUser.id, ...data });
      } else {
        res = await apiAdminAdd("users", data);
      }
      if (res.ok || res.id) { setShowForm(false); load(); }
      else setError((res.error as string) || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Удалить пользователя? Это действие необратимо.")) return;
    const res = await apiAdminDelete("users", id);
    if (res.ok) load();
    else alert(res.error || "Не удалось удалить");
  };

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const groupedUsers = ROLES.reduce((acc, role) => {
    acc[role] = users.filter(u => u.role === role);
    return acc;
  }, {} as Record<string, UserItem[]>);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333]">
          <Icon name="UserPlus" size={13} />
          Добавить пользователя
        </button>
      </div>

      {/* Форма добавления/редактирования */}
      {showForm && (
        <div className="bg-white border border-[#E0E0E0] mb-5 animate-fade-in">
          <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between bg-[#FAFAFA]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#333]">
              {editUser ? `Редактировать: ${editUser.name}` : "Новый пользователь"}
            </p>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 flex items-center justify-center hover:bg-[#F0F0EE]">
              <Icon name="X" size={14} className="text-[#888]" />
            </button>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {[
              { label: "Ф.И.О.", k: "name" as const, placeholder: "Иванов К.П." },
              { label: "Логин", k: "login" as const, placeholder: "ivanov" },
              { label: editUser ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль", k: "password" as const, placeholder: "••••" },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">{f.label}</label>
                <input type={f.k === "password" ? "password" : "text"}
                  className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
                  value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Роль</label>
              <select className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
                value={form.role} onChange={e => set("role", e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Подразделение</label>
              <select className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
                value={form.department_id} onChange={e => set("department_id", e.target.value)}>
                <option value="">— не указано —</option>
                {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 px-5 pb-2">{error}</p>}
          <div className="px-5 pb-4 flex gap-2">
            <button onClick={save} disabled={saving}
              className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] disabled:opacity-50">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-[#E0E0E0] px-5 py-2 text-xs font-medium text-[#555] hover:bg-[#F0F0EE]">
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-[#AAA] py-8 text-center">Загрузка...</p>}

      {/* Пользователи по группам */}
      {!loading && ROLES.filter(r => groupedUsers[r]?.length > 0).map(role => (
        <div key={role} className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-2 flex items-center gap-2">
            <Icon name="Users" size={11} />
            {ROLE_LABELS[role]}
            <span className="font-normal text-[#CCC]">({groupedUsers[role].length})</span>
          </p>
          <div className="bg-white border border-[#E0E0E0]">
            {groupedUsers[role].map((u, i) => (
              <div key={u.id}
                className={`flex items-center gap-3 px-4 py-2.5 group border-b border-[#F0F0EE] last:border-b-0 ${i === 0 ? "" : ""}`}>
                <div className="w-7 h-7 rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                  <Icon name="User" size={13} className="text-[#666]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-[10px] text-[#AAA]">@{u.login} · {u.dept_name || "—"}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(u)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-[#E0E0E0] hover:bg-[#F0F0EE] transition-colors">
                    <Icon name="Pencil" size={10} />
                    Изменить
                  </button>
                  <button onClick={() => del(u.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                    <Icon name="Trash2" size={10} />
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Главный компонент Admin ────────────────────────────────────────────────
export default function Admin({ onBack }: { onBack: () => void }) {
  const [section, setSection] = useState<Section>("departments");

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm text-[#111]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[#888] hover:text-[#111] transition-colors text-xs">
            <Icon name="ArrowLeft" size={14} />
            Назад
          </button>
          <div className="w-px h-5 bg-[#E0E0E0]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#111] flex items-center justify-center">
              <Icon name="Settings" size={12} className="text-white" />
            </div>
            <span className="font-semibold text-sm uppercase tracking-wide">Администрирование</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 shrink-0">
          <div className="bg-white border border-[#E0E0E0]">
            {SECTIONS.map((s, i) => (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-[#F0F0EE] last:border-b-0 ${section === s.key ? "bg-[#111] text-white" : "text-[#555] hover:bg-[#F0F0EE]"} ${i === 0 ? "" : ""}`}>
                <Icon name={s.icon} size={14} />
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 animate-fade-in">
          <div className="mb-4">
            <h2 className="text-base font-semibold">
              {SECTIONS.find(s => s.key === section)?.label}
            </h2>
            <p className="text-[11px] text-[#AAA] mt-0.5">
              {section === "users"
                ? "Управление учётными записями пользователей"
                : "Значения появятся в выпадающих списках при создании заявки"}
            </p>
          </div>

          {section === "users" ? (
            <UsersPanel />
          ) : (
            <RefPanel
              resource={section}
              label={SECTIONS.find(s => s.key === section)?.label || ""}
            />
          )}
        </main>
      </div>
    </div>
  );
}