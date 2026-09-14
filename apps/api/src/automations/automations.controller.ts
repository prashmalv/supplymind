import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AutomationsService } from './automations.service';
import { CurrentOrg, CurrentUser, AuthUser, RequirePermissions } from '../common/decorators';

class CreateAutomationDto {
  @IsString() title!: string;
  @IsString() condition!: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() target?: string;
}

@Controller('automations')
export class AutomationsController {
  constructor(private svc: AutomationsService) {}

  @Get()
  @RequirePermissions('ai:chat')
  list(@CurrentOrg() orgId: string, @CurrentUser() user: AuthUser) {
    return this.svc.list(orgId, user.userId);
  }

  @Post()
  @RequirePermissions('ai:chat')
  create(@CurrentOrg() orgId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateAutomationDto) {
    return this.svc.create(orgId, user.userId, { ...dto, target: dto.target || user.email });
  }

  @Patch(':id/toggle')
  @RequirePermissions('ai:chat')
  toggle(@CurrentOrg() orgId: string, @CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.toggle(orgId, user.userId, id);
  }

  @Delete(':id')
  @RequirePermissions('ai:chat')
  remove(@CurrentOrg() orgId: string, @CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.remove(orgId, user.userId, id);
  }
}
