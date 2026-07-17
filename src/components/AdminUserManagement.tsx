import React, { useEffect, useState } from "react";
import { Users, ShieldCheck, Check, AlertCircle, Search } from "lucide-react";
import { UserProfileData, UserRole } from "../types";
import { api, ApiError } from "../api/client";

interface Props {
  /** The signed-in admin. Used to stop them demoting themselves. */
  currentUserId: string;
}

const ROLES: UserRole[] = ["customer", "vendor", "admin"];

const ROLE_STYLES: Record<UserRole, string> = {
  customer: "bg-[#F0EDE7] text-[#6B6B6B]",
  vendor: "bg-[#E8E2D4] text-[#8A6D1F]",
  admin: "bg-[#1C1C1C] text-[#D4AF37]",
};

export default function AdminUserManagement({ currentUserId }: Props) {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    try {
      setUsers(await api.listUsers());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleRoleChange = async (user: UserProfileData, role: UserRole) => {
    if (role === user.role) return;

    // Granting admin is the one action here that can't be undone by the person
    // doing it, so make them say yes on purpose.
    if (role === "admin") {
      const ok = window.confirm(
        `Grant full admin rights to ${user.name} (${user.email})?\n\n` +
          `They will be able to change any role, including yours.`
      );
      if (!ok) return;
    }

    setSavingId(user.id);
    try {
      const updated = await api.setUserRole(user.id, role);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: updated.role } : u)));
      flash(`${user.name} is now a ${role}.`);
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Could not change that role.");
    } finally {
      setSavingId(null);
    }
  };

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle) ||
          u.role.includes(needle)
      )
    : users;

  return (
    <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-5 shadow-sm">
      <div className="flex justify-between items-baseline border-b border-[#DADADA] pb-3 gap-4 flex-wrap">
        <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#D4AF37]" /> Member Directory & Roles
        </h3>
        <span className="text-[10px] text-[#6B6B6B]">
          {users.length} member{users.length === 1 ? "" : "s"}
        </span>
      </div>

      {notice && (
        <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-2xl px-4 py-3 text-[11px] text-[#1C1C1C] flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
          {notice}
        </div>
      )}

      {error && (
        <div className="bg-white border border-red-200 rounded-2xl px-4 py-3 text-[11px] text-[#6B6B6B] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="admin-user-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, email, or role"
          className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#1C1C1C] transition"
        />
      </div>

      {loading ? (
        <div className="text-[11px] text-[#6B6B6B] py-6 text-center">Loading members…</div>
      ) : visible.length === 0 ? (
        <div className="text-[11px] text-[#6B6B6B] py-6 text-center">
          {users.length === 0 ? "No members yet." : `No members match "${filter}".`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-[#6B6B6B] border-b border-[#DADADA]">
                <th className="py-2 pr-3 font-bold">Member</th>
                <th className="py-2 pr-3 font-bold">Tier</th>
                <th className="py-2 pr-3 font-bold">Current</th>
                <th className="py-2 font-bold text-right">Change role</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="border-b border-[#F0EDE7] last:border-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.profilePic}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover bg-[#F0EDE7] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1C1C1C] truncate">
                            {user.name}
                            {isSelf && <span className="text-[#6B6B6B] font-normal"> (you)</span>}
                          </div>
                          <div className="text-[#6B6B6B] truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-[#6B6B6B]">{user.tier}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold ${ROLE_STYLES[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {isSelf ? (
                        // Self-demotion would lock the last admin out of the
                        // portal with no way back in through the UI.
                        <span
                          className="text-[#6B6B6B] text-[10px] inline-flex items-center gap-1"
                          title="You cannot change your own role."
                        >
                          <ShieldCheck className="w-3 h-3" /> locked
                        </span>
                      ) : (
                        <select
                          id={`role-select-${user.id}`}
                          value={user.role}
                          disabled={savingId === user.id}
                          onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                          className="bg-[#FAF9F6] border border-[#DADADA] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[#1C1C1C] disabled:opacity-50 transition"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-[#6B6B6B] leading-relaxed pt-1 border-t border-[#F0EDE7]">
        Roles take effect on the member's next sign-in — their current token
        carries the old role until it expires.
      </p>
    </div>
  );
}
