import { Request, Response } from 'express';
import { getTenantDB } from '../config/db';

export const getAcademicStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: No tenant context found.' });
      return;
    }

    //Get the isolated DB instance for this tenant
    const tenantDb = getTenantDB(tenantId);

    const activeVersion = await tenantDb.academicVersion.findFirst({
      where: { isCurrent: true },
      include: {
        programs: {
          include: {
            branches: {
              include: {
                semesters: {
                  include: { subjects: true },
                  orderBy: { semesterNumber: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!activeVersion) {
      res.status(404).json({ error: 'No active academic structure found.' });
      return;
    }

    res.status(200).json({ data: activeVersion });
  } catch (error) {
    console.error('Fetch Academic Structure Error:', error);
    res.status(500).json({ error: 'Failed to fetch academic structure.' });
  }
};