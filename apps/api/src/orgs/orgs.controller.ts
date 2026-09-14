import { Body, Controller, ForbiddenException, Get, Param, Patch, Post } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { OrgsService } from './orgs.service';
import { CurrentUser, AuthUser, RequirePermissions, CurrentOrg } from '../common/decorators';

class CreateOrgDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() baseCurrency?: string;
}

class UpdateOrgDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() baseCurrency?: string;
}

@Controller('orgs')
export class OrgsController {
  constructor(private orgs: OrgsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orgs.listForUser(user.userId, user.isPlatformAdmin);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrgDto) {
    return this.orgs.create(user.userId, dto);
  }

  @Get('active')
  @RequirePermissions('org:read')
  getActive(@CurrentOrg() orgId: string) {
    return this.orgs.get(orgId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orgs.get(id);
  }

  @Patch(':id')
  @RequirePermissions('org:manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrgDto,
    @CurrentUser() user: AuthUser,
    @CurrentOrg() orgId: string,
  ) {
    // The org:manage permission was verified against the active org (X-Org-Id).
    // Prevent acting on a different org via the path param.
    if (!user.isPlatformAdmin && id !== orgId) {
      throw new ForbiddenException('Path org does not match the active organization');
    }
    return this.orgs.update(id, dto);
  }
}
