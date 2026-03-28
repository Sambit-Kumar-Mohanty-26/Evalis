"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", email: "", password: "", role: "TEACHER", phone: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15", search });
      if (roleFilter) params.set("role", roleFilter);
      const res = await api.get(`/api/v1/users?${params}`);
      setUsers(res.data);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.post("/api/v1/users", newUser);
      setShowCreateModal(false);
      setNewUser({ fullName: "", email: "", password: "", role: "TEACHER", phone: "" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate ${name}? This is a soft delete.`)) return;
    try {
      await api.delete(`/api/v1/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-brand-dark">User Management</h1>
          <p className="text-brand-dark/50 text-sm font-sans mt-1">Create and manage teachers & students</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-brand-green text-white text-sm font-sans font-medium rounded-xl hover:bg-brand-green-hover transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-dark/10 rounded-xl text-sm font-sans text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-brand-dark/10 rounded-xl text-sm font-sans text-brand-dark/70 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="TEACHER">Teachers</option>
          <option value="STUDENT">Students</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-brand-dark/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <svg className="animate-spin h-6 w-6 text-brand-green" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-brand-dark/30 font-sans">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="bg-brand-dark/[0.02] text-left text-brand-dark/50">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-brand-dark/5 hover:bg-brand-dark/[0.01]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-xs font-medium">
                          {u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-brand-dark font-medium">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-brand-dark/60">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        u.role === "ADMIN" ? "bg-purple-50 text-purple-600" :
                        u.role === "TEACHER" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3 text-brand-dark/40">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-3 text-right">
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleDelete(u.id, u.fullName)}
                          className="text-red-400 hover:text-red-600 transition-colors text-xs"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-brand-dark/5 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-brand-dark/50 hover:text-brand-dark disabled:opacity-30 font-sans"
            >← Previous</button>
            <span className="text-xs text-brand-dark/40 font-sans">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm text-brand-dark/50 hover:text-brand-dark disabled:opacity-30 font-sans"
            >Next →</button>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-lg font-serif text-brand-dark mb-4">Create New User</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Full Name</label>
                  <input value={newUser.fullName} onChange={(e) => setNewUser({...newUser, fullName: e.target.value})} required className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Email</label>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Password</label>
                  <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required minLength={8} className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20">
                    <option value="TEACHER">Teacher</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>
                {error && <p className="text-red-500 text-sm font-sans">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 text-sm font-sans text-brand-dark/60 bg-brand-dark/5 rounded-xl hover:bg-brand-dark/10">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 px-4 py-2.5 text-sm font-sans text-white bg-brand-green rounded-xl hover:bg-brand-green-hover disabled:opacity-60">
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
