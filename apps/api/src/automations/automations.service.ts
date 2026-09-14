import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationInput } from '@supplymind/shared';

@Injectable()
export class AutomationsService {
  constructor(private prisma: PrismaService) {}

  list(orgId: string, userId: string) {
    return this.prisma.automation.findMany({
      where: { orgId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(orgId: string, userId: string, dto: CreateAutomationInput) {
    return this.prisma.automation.create({
      data: {
        orgId,
        userId,
        title: dto.title.slice(0, 200),
        condition: dto.condition.slice(0, 500),
        action: dto.action || 'email',
        target: dto.target || null,
      },
    });
  }

  async remove(orgId: string, userId: string, id: string) {
    await this.prisma.automation.deleteMany({ where: { id, orgId, userId } });
    return { ok: true };
  }

  async toggle(orgId: string, userId: string, id: string) {
    const a = await this.prisma.automation.findFirst({ where: { id, orgId, userId } });
    if (!a) return { ok: false };
    await this.prisma.automation.update({ where: { id }, data: { active: !a.active } });
    return { ok: true, active: !a.active };
  }
}
