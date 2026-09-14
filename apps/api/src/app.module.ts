import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrgsModule } from './orgs/orgs.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';
import { MisModule } from './mis/mis.module';
import { AutomationsModule } from './automations/automations.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { TenantGuard } from './common/tenant.guard';
import { PermissionsGuard } from './common/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuthModule,
    OrgsModule,
    UsersModule,
    MisModule,
    AiModule,
    AutomationsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global guard order: authenticate -> resolve tenant -> enforce permissions.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
