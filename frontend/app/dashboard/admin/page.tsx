"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface OverviewData {
  stats: { totalStudents: number; totalTeachers: number; totalSubjects: number; totalExams: number };
  avgCgpa: string | null;
  recentActivity: Array<{ action: string; entity: string; createdAt: string }>;
}

const statCards = [
  { key: "totalStudents", label: "Students", icon: "👩‍🎓", color: "from-emerald-500 to-teal-600" },
  { key: "totalTeachers", label: "Teachers", icon: "👨‍🏫", color: "from-blue-500 to-indigo-600" },
  { key: "totalSubjects", label: "Subjects", icon: "📚", color: "from-amber-500 to-orange-600" },
  { key: "totalExams", label: "Exams", icon: "📝", color: "from-purple-500 to-fuchsia-600" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/analytics/overview")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-brand-green" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-brand-dark">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
        <p className="text-brand-dark/50 text-sm font-sans mt-1">Here&apos;s an overview of your institution</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-brand-dark/5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} opacity-10`} />
            </div>
            <p className="text-3xl font-semibold text-brand-dark font-sans">
              {data?.stats?.[card.key as keyof typeof data.stats] ?? 0}
            </p>
            <p className="text-sm text-brand-dark/50 font-sans mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average CGPA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-brand-dark/5"
        >
          <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-4">Institution Average CGPA</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-semibold text-brand-dark font-sans">
              {data?.avgCgpa ?? "—"}
            </span>
            <span className="text-lg text-brand-dark/40 font-sans mb-1">/ 10.0</span>
          </div>
          <div className="mt-4 h-2 bg-brand-dark/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-green to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${((Number(data?.avgCgpa) || 0) / 10) * 100}%` }}
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border border-brand-dark/5"
        >
          <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {data?.recentActivity?.length ? (
              data.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === "CREATE" ? "bg-emerald-400" :
                    activity.action === "UPDATE" ? "bg-blue-400" :
                    activity.action === "DELETE" ? "bg-red-400" : "bg-gray-400"
                  }`} />
                  <span className="text-brand-dark/70 font-sans flex-1">
                    {activity.action} → {activity.entity}
                  </span>
                  <span className="text-brand-dark/30 text-xs font-sans">
                    {new Date(activity.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-brand-dark/30 text-sm font-sans italic">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 border border-brand-dark/5"
      >
        <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Teacher", href: "/dashboard/admin/users?action=add&role=TEACHER", emoji: "👨‍🏫" },
            { label: "Add Student", href: "/dashboard/admin/users?action=add&role=STUDENT", emoji: "👩‍🎓" },
            { label: "Create Exam", href: "/dashboard/admin/exams?action=create", emoji: "📝" },
            { label: "View Analytics", href: "/dashboard/admin/analytics", emoji: "📊" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-beige/50 hover:bg-brand-beige transition-colors group cursor-pointer"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{action.emoji}</span>
              <span className="text-xs text-brand-dark/60 font-sans">{action.label}</span>
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
