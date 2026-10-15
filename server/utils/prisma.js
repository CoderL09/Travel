import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '~/generated/prisma/client'

const globalForPrisma = globalThis

function buildAdapter(databaseUrl) {
  const url = new URL(databaseUrl)
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    connectionLimit: 5
  })
}

export function usePrisma(event) {
  if (!globalForPrisma.__prisma) {
    const { databaseUrl } = useRuntimeConfig(event)
    if (!databaseUrl) {
      throw createError({ statusCode: 500, message: '请先配置 NUXT_DATABASE_URL' })
    }
    globalForPrisma.__prisma = new PrismaClient({ adapter: buildAdapter(databaseUrl) })
  }
  return globalForPrisma.__prisma
}
