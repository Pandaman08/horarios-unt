import pkg from '@prisma/client'

const { PrismaClient } = pkg as any

const globalForPrisma = globalThis as unknown as {
  prisma_v2: any | undefined
}

export const prisma = globalForPrisma.prisma_v2 ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma