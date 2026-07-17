import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma_v2: PrismaClient | undefined
}

function modifyDatabaseUrl(url: string | undefined): string {
  if (!url) throw new Error('DATABASE_URL is not defined');
  
  const urlObj = new URL(url);
  
  // Always set/override connection_limit and pool_timeout to conservative values
  urlObj.searchParams.set('connection_limit', '3');
  urlObj.searchParams.set('pool_timeout', '15');
  
  return urlObj.toString();
}

// Configure Prisma connection pool with very conservative limits to avoid hitting EMAXCONNSESSION
export const prisma = globalForPrisma.prisma_v2 ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  datasources: {
    db: {
      url: modifyDatabaseUrl(process.env.DATABASE_URL),
    },
  },
  transactionOptions: {
    maxWait: 15000,
    timeout: 30000,
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma
