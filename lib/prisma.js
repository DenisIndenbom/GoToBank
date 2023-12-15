const { PrismaClient } = require('@prisma/client')

const globalForPrisma = global

const prisma = globalForPrisma.prisma || new PrismaClient({})

globalForPrisma.prisma = prisma

module.exports = prisma