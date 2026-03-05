import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const email = 'dev@mlsmarketer.com'
  const password = 'DevPassword1!'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`User ${email} already exists.`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Dev User',
      password: hashed,
      subscriptionStatus: 'pro',
    },
  })

  console.log(`Created dev user: ${user.email}`)
  console.log(`Password: ${password}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
