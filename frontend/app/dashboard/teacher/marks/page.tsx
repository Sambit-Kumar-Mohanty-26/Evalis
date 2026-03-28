"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface Assignment {
  id: string;
  subject: { id: string; name: string; code: string; maxMarks: number };
}

interface Student {
  id: string;
  fullName: string;
  email: string;
}

interface Exam {
  id: string;
  name: string;
  examType: string;
  maxMarks: number;
}

export default function TeacherMarksPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<Record<string, { marks: string; isAbsent: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<string>("");

  useEffect(() => {
    api.get("/api/v1/teachers/assignments")
      .then((res) => {
        const uniqueSubjects: Assignment[] = [];
        const seen = new Set();
        for (const a of res.data) {
          if (!seen.has(a.subject.id)) {
            seen.add(a.subject.id);
            uniqueSubjects.push(a);
          }
        }
        setAssignments(uniqueSubjects);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAssignment) return;
    api.get(`/api/v1/exams?semesterId=all`)
      .then((res) => setExams(res.data))
      .catch(console.error);
  }, [selectedAssignment]);

  const loadExistingMarks = useCallback(async (examId: string, subjectId: string) => {
    try {
      const res = await api.get(`/api/v1/exams/${examId}/marks?subjectId=${subjectId}`);
      const existingMarks: Record<string, { marks: string; isAbsent: boolean }> = {};
      for (const mark of res.data) {
        existingMarks[mark.student.id] = {
          marks: String(mark.marksObtained),
          isAbsent: mark.isAbsent,
        };
      }
      setMarksData(existingMarks);
    } catch { /* no existing marks */ }
  }, []);

  useEffect(() => {
    if (selectedExam && selectedAssignment) {
      loadExistingMarks(selectedExam.id, selectedAssignment.subject.id);
    }
  }, [selectedExam, selectedAssignment, loadExistingMarks]);

  useEffect(() => {
    if (!selectedAssignment) return;
    api.get("/api/v1/users?role=STUDENT&limit=100")
      .then((res) => setStudents(res.data))
      .catch(console.error);
  }, [selectedAssignment]);

  const handleSave = async () => {
    if (!selectedExam || !selectedAssignment) return;
    setSaving(true);
    setSaveResult("");

    const marksArray = Object.entries(marksData)
      .filter(([, val]) => val.marks || val.isAbsent)
      .map(([studentId, val]) => ({
        studentId,
        marksObtained: Number(val.marks) || 0,
        isAbsent: val.isAbsent,
      }));

    try {
      const res = await api.post(`/api/v1/exams/${selectedExam.id}/marks`, {
        subjectId: selectedAssignment.subject.id,
        marks: marksArray,
      });
      setSaveResult(res.message);
    } catch (err: any) {
      setSaveResult(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-2xl font-serif text-brand-dark">Marks Entry</h1>
        <p className="text-brand-dark/50 text-sm font-sans mt-1">Select subject and exam, then enter marks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1.5">Subject</label>
          <select
            value={selectedAssignment?.subject.id || ""}
            onChange={(e) => {
              const a = assignments.find(a => a.subject.id === e.target.value);
              setSelectedAssignment(a || null);
              setSelectedExam(null);
              setMarksData({});
            }}
            className="w-full px-4 py-2.5 bg-white border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          >
            <option value="">Select subject...</option>
            {assignments.map((a) => (
              <option key={a.subject.id} value={a.subject.id}>{a.subject.name} ({a.subject.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-dark/60 font-sans mb-1.5">Exam</label>
          <select
            value={selectedExam?.id || ""}
            onChange={(e) => {
              const ex = exams.find(x => x.id === e.target.value);
              setSelectedExam(ex || null);
            }}
            disabled={!selectedAssignment}
            className="w-full px-4 py-2.5 bg-white border border-brand-dark/10 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-50"
          >
            <option value="">Select exam...</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name} (Max: {ex.maxMarks})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedAssignment && selectedExam && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-brand-dark/5 overflow-hidden"
        >
          <div className="px-5 py-3 bg-brand-dark/[0.02] border-b border-brand-dark/5 flex items-center justify-between">
            <span className="text-sm font-medium text-brand-dark font-sans">
              {selectedAssignment.subject.name} — {selectedExam.name}
            </span>
            <span className="text-xs text-brand-dark/40 font-sans">Max: {selectedExam.maxMarks}</span>
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center text-brand-dark/30 font-sans">No students found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="text-left text-brand-dark/50 border-b border-brand-dark/5">
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">Marks</th>
                    <th className="px-5 py-3 font-medium">Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, i) => {
                    const mark = marksData[student.id] || { marks: "", isAbsent: false };
                    return (
                      <tr key={student.id} className="border-b border-brand-dark/5 last:border-0">
                        <td className="px-5 py-2.5 text-brand-dark/40">{i + 1}</td>
                        <td className="px-5 py-2.5 text-brand-dark">{student.fullName}</td>
                        <td className="px-5 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={selectedExam.maxMarks}
                            step="0.5"
                            value={mark.marks}
                            disabled={mark.isAbsent}
                            onChange={(e) => {
                              setMarksData(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], marks: e.target.value, isAbsent: false },
                              }));
                            }}
                            placeholder="—"
                            className={`w-24 px-3 py-1.5 bg-brand-beige/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 ${
                              Number(mark.marks) > selectedExam.maxMarks 
                                ? "border-red-300 text-red-600" 
                                : "border-brand-dark/10 text-brand-dark"
                            } ${mark.isAbsent ? "opacity-40" : ""}`}
                          />
                        </td>
                        <td className="px-5 py-2.5">
                          <input
                            type="checkbox"
                            checked={mark.isAbsent}
                            onChange={(e) => {
                              setMarksData(prev => ({
                                ...prev,
                                [student.id]: { marks: "", isAbsent: e.target.checked },
                              }));
                            }}
                            className="w-4 h-4 rounded text-brand-green focus:ring-brand-green/20 border-brand-dark/20"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-3 bg-brand-dark/[0.02] border-t border-brand-dark/5 flex items-center justify-between">
            {saveResult && (
              <p className={`text-sm font-sans ${saveResult.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>
                {saveResult}
              </p>
            )}
            <div className="flex-1" />
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(marksData).length === 0}
              className="px-6 py-2.5 bg-brand-green text-white text-sm font-sans font-medium rounded-xl hover:bg-brand-green-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Marks"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}