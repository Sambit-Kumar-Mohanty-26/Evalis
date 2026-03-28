"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantDB = exports.db = void 0;
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.db = global.prisma || new client_1.PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production')
    global.prisma = exports.db;
const getTenantDB = (tenantId) => {
    return exports.db.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    // Wrap the actual query in a strict transaction
                    const [, result] = await exports.db.$transaction([
                        // 1. Set the PostgreSQL local variable for this specific transaction
                        exports.db.$executeRaw `SELECT set_config('app.current_tenant', ${tenantId}, TRUE)`,
                        // 2. Execute the requested query
                        query(args),
                    ]);
                    return result;
                },
            },
        },
    });
};
exports.getTenantDB = getTenantDB;
