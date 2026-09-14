import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getDataset, SiteDataset } from './datasets';

@Injectable()
export class MisService {
  constructor(private prisma: PrismaService) {}

  /** Resolve the active org's demo dataset (by its demoDatasetKey). */
  async datasetForOrg(orgId: string): Promise<SiteDataset> {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    return getDataset(org?.demoDatasetKey ?? (org?.isDemo ? 'demo' : null));
  }

  async executive(orgId: string) {
    return (await this.datasetForOrg(orgId)).executive;
  }
  async procurement(orgId: string) {
    return (await this.datasetForOrg(orgId)).procurement;
  }
  async inventory(orgId: string) {
    return (await this.datasetForOrg(orgId)).inventory;
  }
  async alerts(orgId: string) {
    return (await this.datasetForOrg(orgId)).alerts;
  }
  async reports(orgId: string) {
    return (await this.datasetForOrg(orgId)).reports ?? [];
  }
  async forecast(orgId: string) {
    return (await this.datasetForOrg(orgId)).forecast ?? null;
  }
  async aiContext(orgId: string) {
    return (await this.datasetForOrg(orgId)).aiContext;
  }
}
