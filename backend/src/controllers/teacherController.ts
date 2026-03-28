import { Request, Response } from 'express';
import { getTenantDB } from '../config/db';
import { createAuditLog } from '../utils/auditLog';

export const assignTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const { userId, subjectId, batchId } = req.body;

    const teacher = await tenantDb.user.findFirst({
      where: { id: userId, role: 'TEACHER', isDeleted: false },
    });
    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found or user is not a teacher.' });
      return;
    }

    const subject = await tenantDb.subject.findFirst({ where: { id: subjectId } });
    if (!subject) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }

    const existing = await tenantDb.teacherSubjectAssignment.findFirst({
      where: { userId, subjectId, batchId: batchId || null },
    });
    if (existing) {
      res.status(409).json({ error: 'Teacher is already assigned to this subject.' });
      return;
    }

    const assignment = await tenantDb.teacherSubjectAssignment.create({
      data: { tenantId, userId, subjectId, batchId: batchId || null },
      include: { subject: true, batch: true },
    });

    await createAuditLog(req, 'CREATE', 'teacher_assignment', assignment.id, {
      teacherId: userId,
      subjectId,
      batchId,
    });

    res.status(201).json({ message: 'Teacher assigned successfully.', data: assignment });
  } catch (error) {
    console.error('Assign Teacher Error:', error);
    res.status(500).json({ error: 'Failed to assign teacher.' });
  }
};

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);

    const targetUserId = req.user?.role === 'TEACHER'
      ? req.user.userId
      : (req.query.userId as string) || req.user!.userId;

    const assignments = await tenantDb.teacherSubjectAssignment.findMany({
      where: { userId: targetUserId },
      include: {
        subject: {
          include: {
            semester: {
              include: {
                branch: {
                  include: {
                    program: true,
                  },
                },
              },
            },
          },
        },
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ data: assignments });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
};

export const removeAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const id = req.params.id as string;

    await tenantDb.teacherSubjectAssignment.delete({ where: { id } });
    await createAuditLog(req, 'DELETE', 'teacher_assignment', id);

    res.status(200).json({ message: 'Assignment removed.' });
  } catch (error) {
    console.error('Remove Assignment Error:', error);
    res.status(500).json({ error: 'Failed to remove assignment.' });
  }
};