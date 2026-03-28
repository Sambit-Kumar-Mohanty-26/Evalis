import { Request, Response } from 'express';
import { getTenantDB } from '../config/db';

/**
 * Admin overview — quick stats for the dashboard.
 */
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);

    const [totalStudents, totalTeachers, totalSubjects, totalExams] = await Promise.all([
      tenantDb.user.count({ where: { role: 'STUDENT', isDeleted: false } }),
      tenantDb.user.count({ where: { role: 'TEACHER', isDeleted: false } }),
      tenantDb.subject.count(),
      tenantDb.exam.count(),
    ]);

    // Get average CGPA from latest snapshots
    const snapshots = await tenantDb.performanceSnapshot.findMany({
      distinct: ['studentId'],
      orderBy: { calculatedAt: 'desc' },
      select: { cgpa: true },
    });

    const avgCgpa = snapshots.length > 0
      ? (snapshots.reduce((sum: number, s: any) => sum + Number(s.cgpa), 0) / snapshots.length).toFixed(2)
      : null;

    // Get recent audit log entries
    const recentActivity = await tenantDb.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        action: true,
        entity: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      data: {
        stats: { totalStudents, totalTeachers, totalSubjects, totalExams },
        avgCgpa,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Overview Error:', error);
    res.status(500).json({ error: 'Failed to fetch overview.' });
  }
};

/**
 * Semester-level analytics — subject averages, pass rates, grade distribution.
 */
export const getSemesterAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const semesterId = req.params.id as string;

    // Get subjects with their marks
    const subjects = await tenantDb.subject.findMany({
      where: { semesterId },
      include: {
        marks: {
          include: {
            exam: { select: { maxMarks: true, name: true } },
          },
        },
      },
    });

    const subjectStats = subjects.map((subject: any) => {
      const nonAbsentMarks = subject.marks.filter((m: any) => !m.isAbsent);
      const totalStudents = nonAbsentMarks.length;

      if (totalStudents === 0) {
        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          totalStudents: 0,
          avgMarks: null,
          passRate: null,
        };
      }

      const avgMarks = (
        nonAbsentMarks.reduce((sum: number, m: any) => sum + Number(m.marksObtained), 0) / totalStudents
      ).toFixed(1);

      // Pass = 40% or above
      const passCount = nonAbsentMarks.filter(
        (m: any) => (Number(m.marksObtained) / m.exam.maxMarks) * 100 >= 40
      ).length;

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        totalStudents,
        avgMarks,
        passRate: ((passCount / totalStudents) * 100).toFixed(1),
      };
    });

    res.status(200).json({ data: subjectStats });
  } catch (error) {
    console.error('Semester Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch semester analytics.' });
  }
};

/**
 * Batch comparison analytics.
 */
export const getBatchComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const batchId = req.params.id as string;

    // Get all students in this batch
    const enrollments = await tenantDb.studentEnrollment.findMany({
      where: { batchId },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    const studentIds = enrollments.map((e: any) => e.userId);

    // Get latest performance snapshots for these students
    const snapshots = await tenantDb.performanceSnapshot.findMany({
      where: { studentId: { in: studentIds } },
      distinct: ['studentId'],
      orderBy: { calculatedAt: 'desc' },
    });

    const studentPerformance = enrollments.map((enrollment: any) => {
      const snapshot = snapshots.find((s: any) => s.studentId === enrollment.userId);
      return {
        studentId: enrollment.userId,
        fullName: enrollment.user.fullName,
        rollNumber: enrollment.rollNumber,
        cgpa: snapshot?.cgpa || null,
        rank: snapshot?.rank || null,
        percentage: snapshot?.percentage || null,
      };
    });

    // Sort by CGPA descending
    studentPerformance.sort((a: any, b: any) => Number(b.cgpa || 0) - Number(a.cgpa || 0));

    res.status(200).json({ data: studentPerformance });
  } catch (error) {
    console.error('Batch Comparison Error:', error);
    res.status(500).json({ error: 'Failed to fetch batch comparison.' });
  }
};

/**
 * Individual student analytics (admin/teacher view).
 */
export const getStudentAnalyticsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const studentId = req.params.id as string;

    const snapshots = await tenantDb.performanceSnapshot.findMany({
      where: { studentId },
      orderBy: { calculatedAt: 'asc' },
    });

    const enrollment = await tenantDb.studentEnrollment.findFirst({
      where: { userId: studentId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        batch: { include: { branch: { include: { program: true } } } },
      },
    });

    res.status(200).json({
      data: {
        student: enrollment,
        trend: snapshots,
        latestCgpa: snapshots.length > 0 ? snapshots[snapshots.length - 1].cgpa : null,
      },
    });
  } catch (error) {
    console.error('Student Analytics Admin Error:', error);
    res.status(500).json({ error: 'Failed to fetch student analytics.' });
  }
};
