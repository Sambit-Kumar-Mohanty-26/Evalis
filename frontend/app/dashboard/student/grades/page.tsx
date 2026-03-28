"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface SemesterMarks {
  semesterNumber: number;
  marks: Array<{
    subject: { name: string; code: string; maxMarks: number };
    exam: { name: string; maxMarks: number; weightage: string };
    marksObtained: string;
    isAbsent: boolean;
  }>;
}

export default function StudentGradesPage() {
  const [data, setData] = useState<SemesterMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSem, setExpandedSem] = useState<number | null>(null);

  useEffect(() => {
    api.get("/api/v1/students/me/marks")
      .then((res) => {
        setData(res.data);
        if (res.data.length > 0) setExpandedSem(res.data[res.data.length - 1].semesterNumber);
      })
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-brand-dark">My Grades</h1>
        <p className="text-brand-dark/50 text-sm font-sans mt-1">Semester-wise grade history</p>
      </div>

      {data.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-brand-dark/5 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-brand-dark/50 font-sans">No grades available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((sem, i) => {
            const isExpanded = expandedSem === sem.semesterNumber;
            const avgPct = sem.marks.length > 0
              ? sem.marks.filter(m => !m.isAbsent).reduce((sum, m) => sum + (Number(m.marksObtained) / m.exam.maxMarks) * 100, 0) / sem.marks.filter(m => !m.isAbsent).length
              : 0;

            return (
              <motion.div
                key={sem.semesterNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-brand-dark/5 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedSem(isExpanded ? null : sem.semesterNumber)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-dark/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green font-medium text-sm font-sans">
                      {sem.semesterNumber}
                    </span>
                    <span className="font-medium text-brand-dark text-sm font-sans">Semester {sem.semesterNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium font-sans ${avgPct >= 80 ? "text-emerald-600" : avgPct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {avgPct.toFixed(1)}%
                    </span>
                    <svg className={`w-4 h-4 text-brand-dark/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-brand-dark/5 overflow-x-auto">
                    <table className="w-full text-sm font-sans">
                      <thead>
                        <tr className="bg-brand-dark/[0.02] text-left text-brand-dark/40">
                          <th className="px-5 py-2 font-medium">Subject</th>
                          <th className="px-5 py-2 font-medium">Exam</th>
                          <th className="px-5 py-2 font-medium text-right">Marks</th>
                          <th className="px-5 py-2 font-medium text-right">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.marks.map((mark, j) => {
                          const pct = mark.isAbsent ? 0 : (Number(mark.marksObtained) / mark.exam.maxMarks) * 100;
                          return (
                            <tr key={j} className="border-t border-brand-dark/5">
                              <td className="px-5 py-2.5">
                                <span className="text-brand-dark">{mark.subject.name}</span>
                                <span className="text-brand-dark/30 text-xs ml-1.5">{mark.subject.code}</span>
                              </td>
                              <td className="px-5 py-2.5 text-brand-dark/60">{mark.exam.name}</td>
                              <td className="px-5 py-2.5 text-right text-brand-dark font-medium">
                                {mark.isAbsent ? <span className="text-red-400">AB</span> : `${mark.marksObtained}/${mark.exam.maxMarks}`}
                              </td>
                              <td className="px-5 py-2.5 text-right">
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
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
