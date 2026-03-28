"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface DashboardData {
  enrollment: {
    rollNumber: string;
    currentSemester: number;
    status: string;
    batch: { name: string; branch: { name: string; program: { name: string } } };
  };
  performance: {
    cgpa: string;
    semesterGpa: string;
    rank: number | null;
    percentage: string;
    totalCredits: number;
  } | null;
  trend: Array<{ semesterId: string; gpa: string; cgpa: string }>;
  currentMarks: Array<{
    subject: { name: string; code: string; maxMarks: number };
    exam: { name: string; maxMarks: number };
    marksObtained: string;
    isAbsent: boolean;
  }>;
  totalSubjects: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/students/me/dashboard")
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

  const cgpa = Number(data?.performance?.cgpa || 0);
  const gradeColor = cgpa >= 9 ? "text-emerald-600" : cgpa >= 7 ? "text-blue-600" : cgpa >= 5 ? "text-amber-600" : "text-red-500";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-brand-dark">Hello, {user?.fullName?.split(" ")[0]} 👋</h1>
        <p className="text-brand-dark/50 text-sm font-sans mt-1">
          {data?.enrollment ? `${data.enrollment.batch.branch.program.name} — ${data.enrollment.batch.branch.name}` : "Loading..."}
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CGPA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-brand-dark/5 col-span-1 sm:col-span-2"
        >
          <p className="text-sm text-brand-dark/50 font-sans mb-2">Current CGPA</p>
          <div className="flex items-end gap-3">
            <span className={`text-5xl font-bold font-sans ${gradeColor}`}>
              {data?.performance?.cgpa ?? "—"}
            </span>
            <span className="text-lg text-brand-dark/30 font-sans mb-1">/ 10.0</span>
          </div>
          <div className="mt-4 h-3 bg-brand-dark/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(cgpa / 10) * 100}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full rounded-full ${
                cgpa >= 9 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                cgpa >= 7 ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                cgpa >= 5 ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                "bg-gradient-to-r from-red-400 to-red-600"
              }`}
            />
          </div>
        </motion.div>

        {/* Semester */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-brand-dark/5"
        >
          <p className="text-sm text-brand-dark/50 font-sans mb-1">Current Semester</p>
          <p className="text-3xl font-semibold text-brand-dark font-sans">{data?.enrollment?.currentSemester ?? "—"}</p>
          <p className="text-xs text-brand-dark/30 font-sans mt-1">{data?.totalSubjects} subjects</p>
        </motion.div>

        {/* Rank */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-brand-dark/5"
        >
          <p className="text-sm text-brand-dark/50 font-sans mb-1">Class Rank</p>
          <p className="text-3xl font-semibold text-brand-dark font-sans">
            {data?.performance?.rank ? `#${data.performance.rank}` : "—"}
          </p>
          <p className="text-xs text-brand-dark/30 font-sans mt-1">
            {data?.performance?.percentage ? `${data.performance.percentage}%` : ""}
          </p>
        </motion.div>
      </div>

      {/* GPA Trend */}
      {data?.trend && data.trend.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-brand-dark/5"
        >
          <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-6">CGPA Trend</h3>
          <div className="flex items-end gap-3 h-40">
            {data.trend.map((point, i) => {
              const height = (Number(point.cgpa) / 10) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-brand-dark/50 font-sans">{Number(point.cgpa).toFixed(1)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-brand-green to-emerald-300 rounded-t-lg"
                  />
                  <span className="text-[10px] text-brand-dark/30 font-sans">Sem {i + 1}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Current Semester Marks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 border border-brand-dark/5"
      >
        <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-4">Current Semester Marks</h3>
        {data?.currentMarks?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="text-left text-brand-dark/40 border-b border-brand-dark/5">
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Exam</th>
                  <th className="pb-3 font-medium text-right">Marks</th>
                  <th className="pb-3 font-medium text-right">Max</th>
                  <th className="pb-3 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {data.currentMarks.map((mark, i) => {
                  const pct = mark.isAbsent ? 0 : (Number(mark.marksObtained) / mark.exam.maxMarks) * 100;
                  return (
                    <tr key={i} className="border-b border-brand-dark/5 last:border-0">
                      <td className="py-3 text-brand-dark">
                        <span className="font-medium">{mark.subject.name}</span>
                        <span className="text-brand-dark/30 text-xs ml-2">{mark.subject.code}</span>
                      </td>
                      <td className="py-3 text-brand-dark/60">{mark.exam.name}</td>
                      <td className="py-3 text-right text-brand-dark font-medium">
                        {mark.isAbsent ? <span className="text-red-400">AB</span> : mark.marksObtained}
                      </td>
                      <td className="py-3 text-right text-brand-dark/40">{mark.exam.maxMarks}</td>
                      <td className="py-3 text-right">
                        <span className={`font-medium ${pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-brand-dark/30 text-sm font-sans italic">No marks available yet</p>
        )}
      </motion.div>

      {/* Enrollment Info */}
      {data?.enrollment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-brand-dark/[0.02] rounded-2xl p-5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-sans">
            <div>
              <p className="text-brand-dark/40 text-xs">Roll Number</p>
              <p className="text-brand-dark font-medium mt-0.5">{data.enrollment.rollNumber}</p>
            </div>
            <div>
              <p className="text-brand-dark/40 text-xs">Batch</p>
              <p className="text-brand-dark font-medium mt-0.5">{data.enrollment.batch.name}</p>
            </div>
            <div>
              <p className="text-brand-dark/40 text-xs">Status</p>
              <p className="text-brand-dark font-medium mt-0.5 capitalize">{data.enrollment.status}</p>
            </div>
            <div>
              <p className="text-brand-dark/40 text-xs">Credits Earned</p>
              <p className="text-brand-dark font-medium mt-0.5">{data?.performance?.totalCredits ?? 0}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
