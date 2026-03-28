import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';
import { db, getTenantDB } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

jest.mock('../config/db', () => ({
  db: {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), deleteMany: jest.fn() },
  },
  getTenantDB: jest.fn(),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials.');
    });

    it('should return 401 if user is deleted', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        isDeleted: true
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'deleted@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Account disabled.');
    });

    it('should login successfully and return tokens', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@evalis.com',
        fullName: 'Admin User',
        passwordHash: 'hashed-password',
        role: 'ADMIN',
        tenantId: 'tenant-1',
        isDeleted: false
      };
      
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@evalis.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe('mock-access-token');
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.tenantId).toBe('tenant-1');
      expect(db.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            tenantId: 'tenant-1',
          })
        })
      );
      
      expect(res.headers['set-cookie'][0]).toMatch(/evalis_refresh_token=mock-refresh-token/);
    });
  });
});
