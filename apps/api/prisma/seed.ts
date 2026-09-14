import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const platformEmail = process.env.SEED_ADMIN_EMAIL || 'admin@supplymind.ai';
  const platformPass = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const demoEmail = process.env.SEED_DEMO_EMAIL || 'demo@supplymind.ai';
  const demoPass = process.env.SEED_DEMO_PASSWORD || 'Demo1234!';

  // Platform admin (cross-org).
  const platformHash = await bcrypt.hash(platformPass, 10);
  const platform = await prisma.user.upsert({
    where: { email: platformEmail },
    update: { isPlatformAdmin: true, passwordHash: platformHash },
    create: {
      email: platformEmail,
      name: 'Platform Admin',
      passwordHash: platformHash,
      isPlatformAdmin: true,
      status: 'ACTIVE',
    },
  });

  // Demo organization (generic pharma dataset).
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: { isDemo: true, demoDatasetKey: 'demo' },
    create: {
      name: 'Demo Organization',
      slug: 'demo',
      industry: 'Pharmaceuticals',
      timezone: 'UTC',
      baseCurrency: 'USD',
      isDemo: true,
      demoDatasetKey: 'demo',
    },
  });

  // --- Bajaj Energy client tenant (power-sector demo dataset) ---
  const bajajOrg = await prisma.organization.upsert({
    where: { slug: 'bajaj-energy' },
    update: { demoDatasetKey: 'bajaj-energy' },
    create: {
      name: 'Bajaj Energy',
      slug: 'bajaj-energy',
      industry: 'Thermal Power Generation',
      timezone: 'Asia/Kolkata',
      baseCurrency: 'INR',
      isDemo: true,
      demoDatasetKey: 'bajaj-energy',
    },
  });

  const bajajEmail = process.env.SEED_BAJAJ_EMAIL || 'planner@bajajenergy.com';
  const bajajPass = process.env.SEED_BAJAJ_PASSWORD || 'Bajaj@1234';
  const bajajHash = await bcrypt.hash(bajajPass, 10);
  const bajajUser = await prisma.user.upsert({
    where: { email: bajajEmail },
    update: { passwordHash: bajajHash },
    create: { email: bajajEmail, name: 'Bajaj Energy Planner', passwordHash: bajajHash, status: 'ACTIVE' },
  });
  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: bajajOrg.id, userId: bajajUser.id } },
    update: { role: 'ORG_ADMIN' },
    create: { orgId: bajajOrg.id, userId: bajajUser.id, role: 'ORG_ADMIN' },
  });

  // --- Bharat Consumer Products (India FMCG tenant, INR) ---
  const bharatOrg = await prisma.organization.upsert({
    where: { slug: 'bharat-consumer' },
    update: { demoDatasetKey: 'bharat-consumer' },
    create: {
      name: 'Bharat Consumer Products',
      slug: 'bharat-consumer',
      industry: 'FMCG Manufacturing & Distribution',
      timezone: 'Asia/Kolkata',
      baseCurrency: 'INR',
      isDemo: true,
      demoDatasetKey: 'bharat-consumer',
    },
  });

  const bharatEmail = process.env.SEED_BHARAT_EMAIL || 'planner@bharatconsumer.in';
  const bharatPass = process.env.SEED_BHARAT_PASSWORD || 'Bharat@1234';
  const bharatHash = await bcrypt.hash(bharatPass, 10);
  const bharatUser = await prisma.user.upsert({
    where: { email: bharatEmail },
    update: { passwordHash: bharatHash },
    create: { email: bharatEmail, name: 'Bharat Consumer Planner', passwordHash: bharatHash, status: 'ACTIVE' },
  });
  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: bharatOrg.id, userId: bharatUser.id } },
    update: { role: 'ORG_ADMIN' },
    create: { orgId: bharatOrg.id, userId: bharatUser.id, role: 'ORG_ADMIN' },
  });

  // Demo org-admin user.
  const demoHash = await bcrypt.hash(demoPass, 10);
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash: demoHash },
    create: {
      email: demoEmail,
      name: 'Demo Planner',
      passwordHash: demoHash,
      status: 'ACTIVE',
    },
  });

  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: demoOrg.id, userId: demoUser.id } },
    update: { role: 'ORG_ADMIN' },
    create: { orgId: demoOrg.id, userId: demoUser.id, role: 'ORG_ADMIN' },
  });

  // Platform admin + demo user also get memberships so both orgs appear in
  // their org switcher (handy for demoing the multi-tenant experience).
  for (const [orgId, userId] of [
    [demoOrg.id, platform.id],
    [bajajOrg.id, platform.id],
    [bharatOrg.id, platform.id],
    [bajajOrg.id, demoUser.id],
    [bharatOrg.id, demoUser.id],
  ] as [string, string][]) {
    await prisma.membership.upsert({
      where: { orgId_userId: { orgId, userId } },
      update: {},
      create: { orgId, userId, role: 'ORG_ADMIN' },
    });
  }

  console.log('Seed complete:');
  console.log(`  Platform admin: ${platformEmail} / ${platformPass}`);
  console.log(`  Demo org-admin: ${demoEmail} / ${demoPass}  (Demo Organization + Bajaj Energy)`);
  console.log(`  Bajaj planner:  ${bajajEmail} / ${bajajPass}  (Bajaj Energy)`);
  console.log(`  Bharat planner: ${bharatEmail} / ${bharatPass}  (Bharat Consumer Products)`);
  console.log(`  Demo org id:    ${demoOrg.id}`);
  console.log(`  Bajaj org id:   ${bajajOrg.id}`);
  console.log(`  Bharat org id:  ${bharatOrg.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
