import { Request, Response } from 'express';
import { getTenantDB } from '../config/db';

export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const studentId = req.user?.userId;
    if (!tenantId || !studentId) {
      res.status(401).json({ error: 'No tenant context.' });
      return;
    }

    const tenantDb = getTenantDB(tenantId);

    const enrollment = await tenantDb.studentEnrollment.findFirst({
      where: { userId: studentId },
      include: {
        batch: {
          include: {
            branch: {
              include: {
                program: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      res.status(404).json({ error: 'No enrollment found for this student.' });
      return;
    }

    const latestSnapshot = await tenantDb.performanceSnapshot.findFirst({
      where: { studentId },
      orderBy: { calculatedAt: 'desc' },
    });

    const allSnapshots = await tenantDb.performanceSnapshot.findMany({
      where: { studentId },
      orderBy: { calculatedAt: 'asc' },
    });

    const currentSemester = await tenantDb.semester.findFirst({
      where: {
        branchId: enrollment.batch.branchId,
        semesterNumber: enrollment.currentSemester,
      },
      include: {
        subjects: true,
      },
    });

    let currentMarks: any[] = [];
    if (currentSemester) {
      currentMarks = await tenantDb.mark.findMany({
        where: {
          studentId,
          subject: {
            semesterId: currentSemester.id,
          },
        },
        include: {
          subject: { select: { id: true, name: true, code: true, creditHours: true, maxMarks: true } },
          exam: { select: { id: true, name: true, examType: true, maxMarks: true, weightage: true } },
        },
      });
    }

    res.status(200).json({
      data: {
        enrollment: {
          rollNumber: enrollment.rollNumber,
          currentSemester: enrollment.currentSemester,
          status: enrollment.status,
          batch: enrollment.batch,
        },
        performance: latestSnapshot
          ? {
              cgpa: latestSnapshot.cgpa,
              semesterGpa: latestSnapshot.semesterGpa,
              rank: latestSnapshot.rank,
              percentage: latestSnapshot.percentage,
              totalCredits: latestSnapshot.totalCredits,
            }
          : null,
        trend: allSnapshots.map((s) => ({
          semesterId: s.semesterId,
          gpa: s.semesterGpa,
          cgpa: s.cgpa,
          calculatedAt: s.calculatedAt,
        })),
        currentMarks,
        totalSubjects: currentSemester?.subjects.length || 0,
      },
    });
  } catch (error) {
    console.error('Student Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
};

export const getStudentMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const studentId = req.user?.userId;
    if (!tenantId || !studentId) {
      res.status(401).json({ error: 'No tenant context.' });
      return;
    }

    const tenantDb = getTenantDB(tenantId);

    const marks = await tenantDb.mark.findMany({
      where: { studentId },
      include: {
        subject: {
          select: { id: true, name: true, code: true, creditHours: true, maxMarks: true },
          include: {
            semester: {
              select: { id: true, semesterNumber: true },
            },
          },
        },
        exam: {
          select: { id: true, name: true, examType: true, maxMarks: true, weightage: true },
        },
      },
      orderBy: [
        { subject: { semester: { semesterNumber: 'asc' } } },
        { createdAt: 'asc' },
      ],
    });

    const bySemester = marks.reduce((acc: any, mark: any) => {
      const semNum = mark.subject.semester.semesterNumber;
      if (!acc[semNum]) acc[semNum] = { semesterNumber: semNum, marks: [] };
      acc[semNum].marks.push(mark);
      return acc;
    }, {});

    res.status(200).json({ data: Object.values(bySemester) });
  } catch (error) {
    console.error('Student Marks Error:', error);
    res.status(500).json({ error: 'Failed to fetch marks.' });
  }
};

export const getStudentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const studentId = req.user?.userId;
    if (!tenantId || !studentId) {
      res.status(401).json({ error: 'No tenant context.' });
      return;
    }

    const tenantDb = getTenantDB(tenantId);

    const snapshots = await tenantDb.performanceSnapshot.findMany({
      where: { studentId },
      orderBy: { calculatedAt: 'asc' },
    });

    const allMarks = await tenantDb.mark.findMany({
      where: { studentId, isAbsent: false },
      include: {
        subject: { select: { name: true, code: true, maxMarks: true } },
        exam: { select: { maxMarks: true } },
      },
    });

    const subjectPerformance = allMarks.reduce((acc: any, mark: any) => {
      const key = mark.subject.code;
      if (!acc[key]) {
        acc[key] = {
          name: mark.subject.name,
          code: mark.subject.code,
          totalMarks: 0,
          totalMax: 0,
        };
      }
      acc[key].totalMarks += Number(mark.marksObtained);
      acc[key].totalMax += mark.exam.maxMarks;
      return acc;
    }, {});

    const subjectAnalysis = Object.values(subjectPerformance).map((subj: any) => ({
      ...subj,
      percentage: ((subj.totalMarks / subj.totalMax) * 100).toFixed(1),
      isWeak: (subj.totalMarks / subj.totalMax) * 100 < 50,
    }));

    res.status(200).json({
      data: {
        trend: snapshots.map((s) => ({
          semesterId: s.semesterId,
          gpa: s.semesterGpa,
          cgpa: s.cgpa,
          rank: s.rank,
          percentage: s.percentage,
        })),
        subjectAnalysis,
        weakSubjects: subjectAnalysis.filter((s: any) => s.isWeak),
        latestCgpa: snapshots.length > 0 ? snapshots[snapshots.length - 1].cgpa : null,
        latestRank: snapshots.length > 0 ? snapshots[snapshots.length - 1].rank : null,
      },
    });
  } catch (error) {
    console.error('Student Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};