"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    switch (user.role) {
      case "ADMIN":
        router.replace("/dashboard/admin");
        break;
      case "TEACHER":
        router.replace("/dashboard/teacher");
        break;
      case "STUDENT":
        router.replace("/dashboard/student");
        break;
      default:
        router.replace("/login");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-8 w-8 text-brand-green" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
