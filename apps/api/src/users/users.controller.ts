import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IsEmail, IsIn, IsString } from 'class-validator';
import { ROLES, Role as SharedRole } from '@supplymind/shared';
import { UsersService } from './users.service';
import { CurrentOrg, CurrentUser, AuthUser, RequirePermissions } from '../common/decorators';

class InviteDto {
  @IsEmail() email!: string;
  @IsIn(ROLES) role!: SharedRole;
}

class ChangeRoleDto {
  @IsIn(ROLES) role!: SharedRole;
}

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @RequirePermissions('org:read')
  list(@CurrentOrg() orgId: string) {
    return this.users.listMembers(orgId);
  }

  @Post('invites')
  @RequirePermissions('user:manage')
  invite(@CurrentOrg() orgId: string, @CurrentUser() user: AuthUser, @Body() dto: InviteDto) {
    return this.users.invite(orgId, dto.email, dto.role, user.userId);
  }

  @Patch(':userId/role')
  @RequirePermissions('user:manage')
  changeRole(
    @CurrentOrg() orgId: string,
    @Param('userId') userId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.users.changeRole(orgId, userId, dto.role);
  }

  @Delete(':userId')
  @RequirePermissions('user:manage')
  remove(@CurrentOrg() orgId: string, @Param('userId') userId: string) {
    return this.users.removeMember(orgId, userId);
  }
}
