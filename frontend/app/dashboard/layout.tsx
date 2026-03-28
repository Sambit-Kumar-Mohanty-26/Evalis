"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const navItems = {
  ADMIN: [
    { label: "Overview", href: "/dashboard/admin", icon: "grid" },
    { label: "Users", href: "/dashboard/admin/users", icon: "users" },
    { label: "Academics", href: "/dashboard/admin/academics", icon: "book" },
    { label: "Exams", href: "/dashboard/admin/exams", icon: "clipboard" },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: "chart" },
  ],
  TEACHER: [
    { label: "Overview", href: "/dashboard/teacher", icon: "grid" },
    { label: "Subjects", href: "/dashboard/teacher/subjects", icon: "book" },
    { label: "Marks Entry", href: "/dashboard/teacher/marks", icon: "edit" },
  ],
  STUDENT: [
    { label: "Dashboard", href: "/dashboard/student", icon: "grid" },
    { label: "Grades", href: "/dashboard/student/grades", icon: "chart" },
    { label: "Analytics", href: "/dashboard/student/analytics", icon: "trend" },
  ],
} as const;

function NavIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || "w-5 h-5";
  switch (name) {
    case "grid": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case "users": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>;
    case "book": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    case "clipboard": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    case "chart": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case "edit": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
    case "trend": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
    default: return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-beige flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand-green" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-brand-dark/50 text-sm font-sans">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const items = navItems[user.role] || [];
  const roleName = user.role === "ADMIN" ? "Administrator" : user.role === "TEACHER" ? "Faculty" : "Student";

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-brand-dark/5 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-brand-dark/5">
          <h1 className="text-xl font-serif text-brand-dark tracking-tight">Evalis</h1>
          <span className="ml-2 text-[10px] font-sans text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{user.role}</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/dashboard/${user.role.toLowerCase()}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans transition-all duration-200 ${
                  isActive
                    ? "bg-brand-green/10 text-brand-green font-medium"
                    : "text-brand-dark/60 hover:bg-brand-dark/5 hover:text-brand-dark"
                }`}
              >
                <NavIcon name={item.icon} className={`w-5 h-5 ${isActive ? "text-brand-green" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-brand-dark/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-medium text-sm font-sans">
              {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-dark truncate font-sans">{user.fullName}</p>
              <p className="text-xs text-brand-dark/40 font-sans">{roleName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-sans"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-brand-dark/5 flex items-center px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 p-2 -ml-2 text-brand-dark/60 hover:text-brand-dark"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1" />
          <div className="text-xs text-brand-dark/30 font-sans">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
