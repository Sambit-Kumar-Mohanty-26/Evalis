"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface Assignment {
  id: string;
  subject: {
    id: string;
    name: string;
    code: string;
    semester: {
      semesterNumber: number;
      branch: { name: string; program: { name: string } };
    };
  };
  batch: { id: string; name: string } | null;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/teachers/assignments")
      .then((res) => setAssignments(res.data))
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
        <h1 className="text-2xl font-serif text-brand-dark">Welcome, {user?.fullName?.split(" ")[0]}</h1>
        <p className="text-brand-dark/50 text-sm font-sans mt-1">Manage your subjects and grades</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-brand-dark/5"
        >
          <p className="text-sm text-brand-dark/50 font-sans mb-1">Subjects Assigned</p>
          <p className="text-3xl font-semibold text-brand-dark font-sans">{assignments.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-brand-dark/5"
        >
          <p className="text-sm text-brand-dark/50 font-sans mb-1">Programs</p>
          <p className="text-3xl font-semibold text-brand-dark font-sans">
            {new Set(assignments.map(a => a.subject.semester.branch.program.name)).size}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-brand-dark/5"
        >
          <p className="text-sm text-brand-dark/50 font-sans mb-1">Batches</p>
          <p className="text-3xl font-semibold text-brand-dark font-sans">
            {new Set(assignments.filter(a => a.batch).map(a => a.batch!.id)).size}
          </p>
        </motion.div>
      </div>

      {/* Assignments List */}
      <div>
        <h2 className="text-lg font-serif text-brand-dark mb-4">Your Subject Assignments</h2>
        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-brand-dark/5 text-center">
            <p className="text-5xl mb-3">📚</p>
            <p className="text-brand-dark/50 font-sans">No subjects assigned yet</p>
            <p className="text-brand-dark/30 text-sm font-sans mt-1">Contact your administrator to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment, i) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-brand-dark/5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-brand-dark font-sans text-sm">{assignment.subject.name}</h3>
                    <p className="text-xs text-brand-dark/40 font-sans mt-0.5">{assignment.subject.code}</p>
                  </div>
                  <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-1 rounded-lg font-sans">
                    Sem {assignment.subject.semester.semesterNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-dark/40 font-sans">
                  <span>{assignment.subject.semester.branch.program.name}</span>
                  <span>•</span>
                  <span>{assignment.subject.semester.branch.name}</span>
                </div>
                {assignment.batch && (
                  <div className="mt-3 pt-3 border-t border-brand-dark/5">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-sans">
                      {assignment.batch.name}
                    </span>
                  </div>
                )}
                <a
                  href={`/dashboard/teacher/marks?subjectId=${assignment.subject.id}`}
                  className="mt-4 flex items-center gap-1 text-xs text-brand-green hover:text-brand-green-hover font-sans font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Enter Marks →
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
