import { db } from '../config/db';
import { Request } from 'express';

export const createAuditLog = async (
  req: Request,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    if (!req.user?.tenantId) return;

    await db.auditLog.create({
      data: {
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        action,
        entity,
        entityId: entityId ?? undefined,
        metadata: metadata ? (metadata as any) : undefined,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      },
    });
  } catch (error) {
    console.error('Audit Log Error (non-blocking):', error);
  }
};
