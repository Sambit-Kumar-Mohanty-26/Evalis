import { Request, Response } from 'express';
import { getTenantDB } from '../config/db';
import { createAuditLog } from '../utils/auditLog';

export const createExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const { semesterId, name, examType, maxMarks, weightage, examDate } = req.body;

    const semester = await tenantDb.semester.findFirst({ where: { id: semesterId } });
    if (!semester) {
      res.status(404).json({ error: 'Semester not found.' });
      return;
    }

    const exam = await tenantDb.exam.create({
      data: {
        tenantId,
        semesterId,
        name,
        examType,
        maxMarks,
        weightage,
        examDate: examDate ? new Date(examDate) : null,
      },
    });

    await createAuditLog(req, 'CREATE', 'exam', exam.id, { name, examType, maxMarks });

    res.status(201).json({ message: 'Exam created successfully.', data: exam });
  } catch (error) {
    console.error('Create Exam Error:', error);
    res.status(500).json({ error: 'Failed to create exam.' });
  }
};

export const listExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const { semesterId } = req.query;

    const where: any = {};
    if (semesterId) where.semesterId = semesterId;

    const exams = await tenantDb.exam.findMany({
      where,
      include: {
        semester: {
          include: {
            branch: true,
          },
        },
        _count: { select: { marks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ data: exams });
  } catch (error) {
    console.error('List Exams Error:', error);
    res.status(500).json({ error: 'Failed to fetch exams.' });
  }
};

export const enterMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const examId = req.params.id as string;
    const { subjectId, marks } = req.body;

    const exam = await tenantDb.exam.findFirst({ where: { id: examId } });
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    if (req.user?.role === 'TEACHER') {
      const assignment = await tenantDb.teacherSubjectAssignment.findFirst({
        where: {
          userId: req.user.userId,
          subjectId,
        },
      });
      if (!assignment) {
        res.status(403).json({
          error: 'Forbidden. You are not assigned to this subject.',
        });
        return;
      }
    }

    const invalidMarks = marks.filter(
      (m: any) => !m.isAbsent && Number(m.marksObtained) > exam.maxMarks
    );
    if (invalidMarks.length > 0) {
      res.status(400).json({
        error: `Marks cannot exceed ${exam.maxMarks} (max marks for this exam).`,
        invalidStudents: invalidMarks.map((m: any) => m.studentId),
      });
      return;
    }

    const results = { saved: 0, errors: [] as string[] };

    for (const entry of marks) {
      try {
        await tenantDb.mark.upsert({
          where: {
            examId_subjectId_studentId: {
              examId,
              subjectId,
              studentId: entry.studentId,
            },
          },
          create: {
            tenantId,
            examId,
            subjectId,
            studentId: entry.studentId,
            marksObtained: entry.isAbsent ? 0 : entry.marksObtained,
            isAbsent: entry.isAbsent || false,
            enteredBy: req.user!.userId,
          },
          update: {
            marksObtained: entry.isAbsent ? 0 : entry.marksObtained,
            isAbsent: entry.isAbsent || false,
            enteredBy: req.user!.userId,
          },
        });
        results.saved++;
      } catch (err: any) {
        results.errors.push(`Student ${entry.studentId}: ${err.message}`);
      }
    }

    await createAuditLog(req, 'CREATE', 'marks', examId, {
      subjectId,
      totalSaved: results.saved,
    });

    res.status(200).json({
      message: `${results.saved} marks saved successfully.`,
      data: results,
    });
  } catch (error) {
    console.error('Enter Marks Error:', error);
    res.status(500).json({ error: 'Failed to enter marks.' });
  }
};

export const getExamMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const examId = req.params.id as string;
    const { subjectId } = req.query;

    const where: any = { examId };
    if (subjectId) where.subjectId = subjectId;

    const marks = await tenantDb.mark.findMany({
      where,
      include: {
        student: {
          select: { id: true, fullName: true, email: true },
        },
        subject: {
          select: { id: true, name: true, code: true, maxMarks: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ data: marks });
  } catch (error) {
    console.error('Get Exam Marks Error:', error);
    res.status(500).json({ error: 'Failed to fetch marks.' });
  }
};