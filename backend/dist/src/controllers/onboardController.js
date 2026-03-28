"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardInstitution = void 0;
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const onboardInstitution = async (req, res) => {
    try {
        const { idempotencyKey, preAuthToken, adminDetails, institutionDetails, academicStructure } = req.body;
        // 1. Check Idempotency (Prevent double-clicks)
        if (!idempotencyKey) {
            res.status(400).json({ error: 'Idempotency Key is required.' });
            return;
        }
        const existingRequest = await db_1.db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
        if (existingRequest) {
            // If already processed, just return the previous success response!
            res.status(200).json(existingRequest.responseSnapshot ?? { message: 'Already processed' });
            return;
        }
        // 2. Verify Email via Pre-Auth Token
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(preAuthToken, process.env.JWT_SECRET || 'fallback_secret');
        }
        catch (err) {
            res.status(401).json({ error: 'Invalid or expired verification token. Please verify email again.' });
            return;
        }
        const email = decodedToken.email;
        // 3. Hash the Admin Password
        const saltRounds = 12;
        const passwordHash = await bcrypt_1.default.hash(adminDetails.password, saltRounds);
        // 4. THE MASSIVE ACID TRANSACTION
        // Prisma handles all the nested creates perfectly in one go. If anything fails, it rolls back.
        const transactionResult = await db_1.db.$transaction(async (prisma) => {
            // A. Create the Tenant
            const tenant = await prisma.tenant.create({
                data: {
                    aisheCode: institutionDetails.aisheCode || null,
                    customInstitutionName: institutionDetails.customName || null,
                    isVerified: !!institutionDetails.aisheCode, // Auto-verify if they used a Gov AISHE code
                }
            });
            // 🚨 THE CRITICAL RLS FIX 🚨
            // Tell PostgreSQL that THIS specific transaction is acting on behalf of the newly created tenant.
            // Without this, the Postgres RLS policies will block the creation of branches/semesters!
            await prisma.$executeRaw `SELECT set_config('app.current_tenant', ${tenant.id}, TRUE)`;
            // B. Create the Admin User (Linked to Tenant)
            const admin = await prisma.user.create({
                data: {
                    fullName: adminDetails.fullName,
                    email: email, // Pulled securely from the JWT, not the request body
                    phone: adminDetails.phone,
                    passwordHash,
                    role: 'admin',
                    tenantId: tenant.id,
                }
            });
            // C. Make the User the primary Admin of the Tenant
            await prisma.tenant.update({
                where: { id: tenant.id },
                data: { adminUserId: admin.id }
            });
            // D. Create the Dynamic Academic Curriculum
            await prisma.academicVersion.create({
                data: {
                    tenantId: tenant.id,
                    name: "V1 - Initial Curriculum",
                    programs: {
                        create: academicStructure.map((prog) => ({
                            name: prog.name,
                            durationYears: prog.durationYears,
                            branches: {
                                create: prog.branches.map((branch) => ({
                                    name: branch.name,
                                    semesters: {
                                        create: branch.semesters.map((sem) => ({
                                            semesterNumber: sem.semesterNumber,
                                            subjects: {
                                                create: sem.subjects.map((sub) => ({
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
        // 5. Save Idempotency Key
        await db_1.db.idempotencyKey.create({
            data: {
                key: idempotencyKey,
                email: email,
                responseSnapshot: successResponse,
            }
        });
        res.status(201).json(successResponse);
    }
    catch (error) {
        console.error('Onboarding Error:', error);
        // Note: Advanced sanitized logging would be inserted into system_error_logs here
        res.status(500).json({ error: 'Failed to complete onboarding. Transaction rolled back.' });
    }
};
exports.onboardInstitution = onboardInstitution;
