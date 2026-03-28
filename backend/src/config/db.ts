import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool as any);

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') global.prisma = db;
export const getTenantDB = (tenantId: string): PrismaClient => {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await db.$transaction([
            db.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, TRUE)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  }) as unknown as PrismaClient;
};