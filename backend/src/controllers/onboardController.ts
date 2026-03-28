import { Request, Response } from 'express';
import { db } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const onboardInstitution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      idempotencyKey, 
      preAuthToken, 
      adminDetails, 
      institutionDetails, 
      academicStructure 
    } = req.body;

    if (!idempotencyKey) {
      res.status(400).json({ error: 'Idempotency Key is required.' });
      return;
    }
    
    const existingRequest = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
    if (existingRequest) {
      res.status(200).json(existingRequest.responseSnapshot ?? { message: 'Already processed' });
      return;
    }

    let decodedToken: any;
    try {
      decodedToken = jwt.verify(preAuthToken, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired verification token. Please verify email again.' });
      return;
    }

    const email = decodedToken.email;
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminDetails.password, saltRounds);
    const transactionResult = await db.$transaction(async (prisma) => {
      
      const tenant = await prisma.tenant.create({
        data: {
          aisheCode: institutionDetails.aisheCode || null,
          customInstitutionName: institutionDetails.customName || null,
          isVerified: !!institutionDetails.aisheCode,
        }
      });

      await prisma.$executeRaw`SELECT set_config('app.current_tenant', ${tenant.id}, TRUE)`;
      const admin = await prisma.user.create({
        data: {
          fullName: adminDetails.fullName,
          email: email,
          phone: adminDetails.phone,
          passwordHash,
          role: 'ADMIN',
          tenantId: tenant.id,
        }
      });

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { adminUserId: admin.id }
      });

      await prisma.academicVersion.create({
        data: {
          tenantId: tenant.id,
          name: "V1 - Initial Curriculum",
          programs: {
            create: academicStructure.map((prog: any) => ({
              name: prog.name,
              durationYears: prog.durationYears,
              branches: {
                create: prog.branches.map((branch: any) => ({
                  name: branch.name,
                  semesters: {
                    create: branch.semesters.map((sem: any) => ({
                      semesterNumber: sem.semesterNumber,
                      subjects: {
                        create: sem.subjects.map((sub: any) => ({
                          name: sub.name,
                          code: sub.code,
                          creditHours: sub.creditHours,
                          maxMarks: sub.maxMarks || 100
                        }))
                      }
                    }))
                  }
                }))
              }
            }))
          }
        }
      });

      return { tenantId: tenant.id, adminId: admin.id };
    });

    const successResponse = { 
      message: 'Onboarding completed successfully!', 
      data: transactionResult 
    };

    await db.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        email: email,
        responseSnapshot: successResponse,
      }
    });

    res.status(201).json(successResponse);

  } catch (error) {
    console.error('Onboarding Error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding. Transaction rolled back.' });
  }
};