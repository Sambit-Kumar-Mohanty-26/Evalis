"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface AnalyticsData {
  trend: Array<{ gpa: string; cgpa: string; rank: number | null; percentage: string }>;
  subjectAnalysis: Array<{ name: string; code: string; percentage: string; isWeak: boolean }>;
  weakSubjects: Array<{ name: string; code: string; percentage: string }>;
  latestCgpa: string | null;
  latestRank: number | null;
}

export default function StudentAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/students/me/analytics")
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
      <div>
        <h1 className="text-2xl font-serif text-brand-dark">Performance Analytics</h1>
        <p className="text-brand-dark/50 text-sm font-sans mt-1">Deep insights into your academic performance</p>
      </div>

      {/* Weak Subjects Alert */}
      {data?.weakSubjects && data.weakSubjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-medium text-red-800 text-sm font-sans">Attention Needed</h3>
              <p className="text-red-600/70 text-xs font-sans mt-1">
                You are scoring below 50% in: {data.weakSubjects.map(s => `${s.name} (${s.percentage}%)`).join(", ")}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* GPA Trend Graph */}
      {data?.trend && data.trend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-brand-dark/5"
        >
          <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-6">Semester Performance Trend</h3>
          <div className="space-y-3">
            {data.trend.map((point, i) => {
              const pct = (Number(point.cgpa) / 10) * 100;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-brand-dark/40 font-sans w-12">Sem {i + 1}</span>
                  <div className="flex-1 h-6 bg-brand-dark/5 rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      className={`h-full rounded-lg ${
                        pct >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                        pct >= 60 ? "bg-gradient-to-r from-blue-400 to-blue-500" :
                        pct >= 40 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                        "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-brand-dark/40 font-sans">
                      CGPA: {Number(point.cgpa).toFixed(2)}
                    </span>
                  </div>
                  {point.rank && (
                    <span className="text-xs text-brand-dark/30 font-sans w-12">#{point.rank}</span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Subject-wise Performance */}
      {data?.subjectAnalysis && data.subjectAnalysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-brand-dark/5"
        >
          <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-4">Subject Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.subjectAnalysis.map((subject, i) => {
              const pct = Number(subject.percentage);
              return (
                <motion.div
                  key={subject.code}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`p-4 rounded-xl border ${
                    subject.isWeak ? "border-red-200 bg-red-50/50" : "border-brand-dark/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-brand-dark/40 font-sans">{subject.code}</span>
                    <span className={`text-sm font-semibold font-sans ${
                      pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500"
                    }`}>{subject.percentage}%</span>
                  </div>
                  <p className="text-sm text-brand-dark font-medium font-sans truncate">{subject.name}</p>
                  <div className="mt-2 h-1.5 bg-brand-dark/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {subject.isWeak && (
                    <p className="text-[10px] text-red-500 font-sans mt-1.5">⚠ Needs improvement</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-brand-dark/[0.02] rounded-2xl p-5"
      >
        <div className="grid grid-cols-2 gap-4 text-sm font-sans">
          <div>
            <p className="text-brand-dark/40 text-xs">Current CGPA</p>
            <p className="text-brand-dark font-semibold text-xl mt-0.5">{data?.latestCgpa ?? "—"}</p>
          </div>
          <div>
            <p className="text-brand-dark/40 text-xs">Current Rank</p>
            <p className="text-brand-dark font-semibold text-xl mt-0.5">
              {data?.latestRank ? `#${data.latestRank}` : "—"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
