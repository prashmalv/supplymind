import { Controller, Get } from '@nestjs/common';
import { MisService } from './mis.service';
import { CurrentOrg, RequirePermissions } from '../common/decorators';

@Controller('mis')
export class MisController {
  constructor(private mis: MisService) {}

  @Get('executive')
  @RequirePermissions('kpi:read')
  executive(@CurrentOrg() orgId: string) {
    return this.mis.executive(orgId);
  }

  @Get('procurement')
  @RequirePermissions('kpi:read')
  procurement(@CurrentOrg() orgId: string) {
    return this.mis.procurement(orgId);
  }

  @Get('inventory')
  @RequirePermissions('kpi:read')
  inventory(@CurrentOrg() orgId: string) {
    return this.mis.inventory(orgId);
  }

  @Get('alerts')
  @RequirePermissions('alert:read')
  alerts(@CurrentOrg() orgId: string) {
    return this.mis.alerts(orgId);
  }

  @Get('reports')
  @RequirePermissions('kpi:read')
  reports(@CurrentOrg() orgId: string) {
    return this.mis.reports(orgId);
  }

  @Get('forecast')
  @RequirePermissions('kpi:read')
  forecast(@CurrentOrg() orgId: string) {
    return this.mis.forecast(orgId);
  }
}
