import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '@supplymind/shared';
import { PrismaService } from '../prisma/prisma.service';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  private toDto(o: any): Organization {
    return {
      id: o.id,
      name: o.name,
      slug: o.slug,
      industry: o.industry ?? undefined,
      timezone: o.timezone,
      baseCurrency: o.baseCurrency,
      status: o.status.toLowerCase(),
      isDemo: o.isDemo,
      createdAt: o.createdAt.toISOString(),
    };
  }

  /** Orgs visible to the caller: all for platform admins, else their memberships. */
  async listForUser(userId: string, isPlatformAdmin: boolean): Promise<Organization[]> {
    const orgs = isPlatformAdmin
      ? await this.prisma.organization.findMany({ orderBy: { createdAt: 'asc' } })
      : (
          await this.prisma.membership.findMany({
            where: { userId },
            include: { org: true },
            orderBy: { createdAt: 'asc' },
          })
        ).map((m) => m.org);
    return orgs.map((o) => this.toDto(o));
  }

  /** Create an org; the creator becomes ORG_ADMIN. */
  async create(
    userId: string,
    input: { name: string; industry?: string; timezone?: string; baseCurrency?: string },
  ): Promise<Organization> {
    let base = slugify(input.name) || 'org';
    let slug = base;
    let i = 1;
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    const org = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: input.name,
          slug,
          industry: input.industry,
          timezone: input.timezone ?? 'UTC',
          baseCurrency: input.baseCurrency ?? 'USD',
        },
      });
      await tx.membership.create({
        data: { orgId: created.id, userId, role: 'ORG_ADMIN' },
      });
      return created;
    });
    return this.toDto(org);
  }

  async get(orgId: string): Promise<Organization> {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return this.toDto(org);
  }

  async update(
    orgId: string,
    input: Partial<{ name: string; industry: string; timezone: string; baseCurrency: string }>,
  ): Promise<Organization> {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: input,
    });
    return this.toDto(org);
  }
}
