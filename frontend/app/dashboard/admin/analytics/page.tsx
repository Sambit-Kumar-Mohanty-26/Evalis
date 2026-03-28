"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

export default function AdminAnalyticsPage() {
  const [semesterId, setSemesterId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [semesterData, setSemesterData] = useState<any[]>([]);
  const [batchData, setBatchData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSemester = async () => {
    if (!semesterId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/analytics/semester/${semesterId}`);
      setSemesterData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatch = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/analytics/batch/${batchId}`);
      setBatchData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-brand-dark">Analytics</h1>
        <p className="text-brand-dark/50 text-sm font-sans mt-1">Analyze academic performance across semesters and batches</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-brand-dark/5">
        <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-4">Semester Analytics</h3>
        <div className="flex gap-3 mb-4">
          <input
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            placeholder="Semester ID (UUID)"
            className="flex-1 px-4 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <button onClick={fetchSemester} disabled={!semesterId || loading} className="px-5 py-2.5 bg-brand-green text-white text-sm font-sans rounded-xl hover:bg-brand-green-hover disabled:opacity-50">Analyze</button>
        </div>

        {semesterData.length > 0 && (
          <div className="space-y-3">
            {semesterData.map((subject: any) => (
              <div key={subject.id} className="flex items-center gap-4 p-3 bg-brand-dark/[0.02] rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark font-sans truncate">{subject.name}</p>
                  <p className="text-xs text-brand-dark/40 font-sans">{subject.code} • {subject.totalStudents} students</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-dark font-sans">{subject.avgMarks ?? "—"}</p>
                  <p className="text-xs text-brand-dark/40 font-sans">avg marks</p>
                </div>
                <div className="w-16 text-right">
                  <span className={`text-xs font-medium font-sans px-2 py-1 rounded-lg ${
                    Number(subject.passRate) >= 80 ? "bg-emerald-50 text-emerald-600" :
                    Number(subject.passRate) >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                  }`}>{subject.passRate ?? "—"}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-brand-dark/5">
        <h3 className="text-sm font-medium text-brand-dark/50 font-sans mb-4">Batch Comparison</h3>
        <div className="flex gap-3 mb-4">
          <input
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="Batch ID (UUID)"
            className="flex-1 px-4 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <button onClick={fetchBatch} disabled={!batchId || loading} className="px-5 py-2.5 bg-brand-green text-white text-sm font-sans rounded-xl hover:bg-brand-green-hover disabled:opacity-50">Compare</button>
        </div>

        {batchData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="text-left text-brand-dark/40 border-b border-brand-dark/5">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Roll No.</th>
                  <th className="pb-3 font-medium text-right">CGPA</th>
                  <th className="pb-3 font-medium text-right">Rank</th>
                </tr>
              </thead>
              <tbody>
                {batchData.map((student: any, i: number) => (
                  <tr key={student.studentId} className="border-b border-brand-dark/5 last:border-0">
                    <td className="py-2.5 text-brand-dark/40">{i + 1}</td>
                    <td className="py-2.5 text-brand-dark font-medium">{student.fullName}</td>
                    <td className="py-2.5 text-brand-dark/60">{student.rollNumber}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold ${
                        Number(student.cgpa) >= 8 ? "text-emerald-600" : Number(student.cgpa) >= 6 ? "text-amber-600" : "text-red-500"
                      }`}>{student.cgpa ?? "—"}</span>
                    </td>
                    <td className="py-2.5 text-right text-brand-dark/50">
                      {student.rank ? `#${student.rank}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
