import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma_v2: PrismaClient | undefined
}

// Configure Prisma connection pool with conservative limits
export const prisma = globalForPrisma.prisma_v2 ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.includes('connection_limit') 
        ? process.env.DATABASE_URL 
        : `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=5`,
    },
  },
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma
