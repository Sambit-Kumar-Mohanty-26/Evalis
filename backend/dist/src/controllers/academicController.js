"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAcademicStructure = void 0;
const db_1 = require("../config/db");
const getAcademicStructure = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ error: 'Unauthorized: No tenant context found.' });
            return;
        }
        // 🔒 RLS in Action! Get the isolated DB instance for this tenant
        const tenantDb = (0, db_1.getTenantDB)(tenantId);
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
    }
    catch (error) {
        console.error('Fetch Academic Structure Error:', error);
        res.status(500).json({ error: 'Failed to fetch academic structure.' });
    }
};
exports.getAcademicStructure = getAcademicStructure;
