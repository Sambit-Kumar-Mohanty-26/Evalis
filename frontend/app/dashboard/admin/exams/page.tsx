"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface Exam {
  id: string;
  name: string;
  examType: string;
  maxMarks: number;
  weightage: string;
  examDate: string | null;
  semester: { semesterNumber: number; branch: { name: string } };
  _count: { marks: number };
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ semesterId: "", name: "", examType: "mid_sem", maxMarks: "100", weightage: "30", examDate: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchExams = () => {
    setLoading(true);
    api.get("/api/v1/exams")
      .then((res) => setExams(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExams(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.post("/api/v1/exams", {
        ...form,
        maxMarks: Number(form.maxMarks),
        weightage: Number(form.weightage),
        examDate: form.examDate || null,
      });
      setShowCreate(false);
      setForm({ semesterId: "", name: "", examType: "mid_sem", maxMarks: "100", weightage: "30", examDate: "" });
      fetchExams();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const examTypeLabel = (t: string) => {
    const map: Record<string, string> = { mid_sem: "Mid Semester", end_sem: "End Semester", internal: "Internal", practical: "Practical" };
    return map[t] || t;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-brand-dark">Exams</h1>
          <p className="text-brand-dark/50 text-sm font-sans mt-1">Create and manage examinations</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 bg-brand-green text-white text-sm font-sans font-medium rounded-xl hover:bg-brand-green-hover transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Exam
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><svg className="animate-spin h-6 w-6 text-brand-green" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-brand-dark/5 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-brand-dark/50 font-sans">No exams created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-brand-dark/5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-brand-dark font-sans text-sm">{exam.name}</h3>
                <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-1 rounded-lg font-sans">
                  {examTypeLabel(exam.examType)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-brand-dark/50 font-sans">
                <div className="flex justify-between"><span>Max Marks:</span><span className="text-brand-dark font-medium">{exam.maxMarks}</span></div>
                <div className="flex justify-between"><span>Weightage:</span><span className="text-brand-dark font-medium">{exam.weightage}%</span></div>
                <div className="flex justify-between"><span>Marks Entered:</span><span className="text-brand-dark font-medium">{exam._count.marks}</span></div>
                {exam.examDate && <div className="flex justify-between"><span>Date:</span><span className="text-brand-dark font-medium">{new Date(exam.examDate).toLocaleDateString("en-IN")}</span></div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-serif text-brand-dark mb-4">Create Exam</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Semester ID</label><input value={form.semesterId} onChange={(e) => setForm({...form, semesterId: e.target.value})} required placeholder="UUID of the semester" className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20" /></div>
                <div><label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Exam Name</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="Mid Semester 1" className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Type</label><select value={form.examType} onChange={(e) => setForm({...form, examType: e.target.value})} className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none"><option value="mid_sem">Mid Semester</option><option value="end_sem">End Semester</option><option value="internal">Internal</option><option value="practical">Practical</option></select></div>
                  <div><label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Max Marks</label><input type="number" value={form.maxMarks} onChange={(e) => setForm({...form, maxMarks: e.target.value})} className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Weightage %</label><input type="number" value={form.weightage} onChange={(e) => setForm({...form, weightage: e.target.value})} className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none" /></div>
                  <div><label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1">Date</label><input type="date" value={form.examDate} onChange={(e) => setForm({...form, examDate: e.target.value})} className="w-full px-3 py-2.5 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none" /></div>
                </div>
                {error && <p className="text-red-500 text-sm font-sans">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-sm font-sans text-brand-dark/60 bg-brand-dark/5 rounded-xl hover:bg-brand-dark/10">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 px-4 py-2.5 text-sm font-sans text-white bg-brand-green rounded-xl hover:bg-brand-green-hover disabled:opacity-60">{creating ? "Creating..." : "Create"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
