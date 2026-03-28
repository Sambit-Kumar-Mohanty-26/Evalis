import { Request, Response } from 'express';
import { getTenantDB } from '../config/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createAuditLog } from '../utils/auditLog';

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || '';
    const role = req.query.role as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isDeleted: false };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (req.user?.role === 'TEACHER') {
      where.role = 'STUDENT';
    }

    const [users, total] = await Promise.all([
      tenantDb.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
      }),
      tenantDb.user.count({ where }),
    ]);

    res.status(200).json({
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('List Users Error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const { fullName, email, phone, password, role } = req.body;

    const existing = await tenantDb.user.findFirst({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await tenantDb.user.create({
      data: {
        fullName,
        email,
        phone: phone || null,
        passwordHash,
        role,
        tenantId,
        isVerified: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await createAuditLog(req, 'CREATE', 'user', user.id, { role, email });

    res.status(201).json({ message: 'User created successfully.', data: user });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const id = req.params.id as string;

    const user = await tenantDb.user.findFirst({
      where: { id, isDeleted: false },
      include: {
        enrollments: {
          include: {
            batch: { include: { branch: true } },
          },
        },
        teacherAssignments: {
          include: {
            subject: true,
            batch: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.status(200).json({ data: user });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const id = req.params.id as string;
    const { fullName, phone, role } = req.body;

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;

    const user = await tenantDb.user.update({
      where: { id },
      data: updateData,
      select: { id: true, fullName: true, email: true, role: true },
    });

    await createAuditLog(req, 'UPDATE', 'user', id, updateData);

    res.status(200).json({ message: 'User updated.', data: user });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const id = req.params.id as string;

    if (id === req.user?.userId) {
      res.status(400).json({ error: 'You cannot delete your own account.' });
      return;
    }

    await tenantDb.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await createAuditLog(req, 'DELETE', 'user', id);

    res.status(200).json({ message: 'User deactivated successfully.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};

export const bulkUploadStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ error: 'No tenant context.' }); return; }

    const tenantDb = getTenantDB(tenantId);
    const { batchId, students } = req.body;

    const batchIdStr = batchId as string;

    const batch = await tenantDb.batch.findFirst({ where: { id: batchIdStr } });
    if (!batch) {
      res.status(404).json({ error: 'Batch not found.' });
      return;
    }

    const defaultPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const student of students) {
      try {
        const existing = await tenantDb.user.findFirst({ where: { email: student.email } });
        if (existing) {
          results.skipped++;
          results.errors.push(`${student.email} already exists — skipped`);
          continue;
        }

        const newUser = await tenantDb.user.create({
          data: {
            fullName: student.fullName,
            email: student.email,
            phone: student.phone || null,
            passwordHash,
            role: 'STUDENT',
            tenantId,
            isVerified: true,
          },
        });

        await tenantDb.studentEnrollment.create({
          data: {
            tenantId,
            userId: newUser.id,
            batchId,
            rollNumber: student.rollNumber,
          },
        });

        results.created++;
      } catch (err: any) {
        results.errors.push(`${student.email}: ${err.message}`);
      }
    }

    await createAuditLog(req, 'CREATE', 'bulk_students', batchId, {
      created: results.created,
      skipped: results.skipped,
    });

    res.status(201).json({
      message: `Uploaded ${results.created} students. ${results.skipped} skipped.`,
      data: results,
      defaultPassword,
    });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload students.' });
  }
};
