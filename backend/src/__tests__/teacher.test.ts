import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import teacherRoutes from '../routes/teacherRoutes';
import { getTenantDB } from '../config/db';

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  req.user = {
    userId: 'mock-teacher-id',
    role: 'TEACHER',
    tenantId: 'mock-tenant-id'
  };
  next();
});

app.use('/api/v1/teachers', teacherRoutes);

const mockTenantDB = {
  teacherSubjectAssignment: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  subject: { findUnique: jest.fn() },
  batch: { findUnique: jest.fn() },
  user: { findFirst: jest.fn() },
  auditLog: { create: jest.fn() }
};

jest.mock('../config/db', () => ({
  getTenantDB: jest.fn(() => mockTenantDB)
}));

describe('Teacher Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/teachers/assignments', () => {
    it('should return 401 if tenant context is missing', async () => {
      const tempApp = express();
      tempApp.use('/api/v1/teachers', teacherRoutes);
      
      const res = await request(tempApp).get('/api/v1/teachers/assignments');
      expect(res.status).toBe(403);
    });

    it('should fetch teacher assignments scoped by tenant ID', async () => {
      const mockAssignments = [
        {
          id: 'assign-1',
          subject: { id: 'sub-1', name: 'Physics' },
          batch: null
        }
      ];

      mockTenantDB.teacherSubjectAssignment.findMany.mockResolvedValue(mockAssignments);

      const res = await request(app).get('/api/v1/teachers/assignments');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockAssignments);
      
      expect(getTenantDB).toHaveBeenCalledWith('mock-tenant-id');
      expect(mockTenantDB.teacherSubjectAssignment.findMany).toHaveBeenCalledWith({
        where: { teacherId: 'mock-teacher-id' },
        include: {
          subject: {
            include: { semester: { include: { branch: { include: { program: true } } } } }
          },
          batch: true
        }
      });
    });
  });
});
