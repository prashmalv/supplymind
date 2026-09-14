import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to Postgres');
    } catch (err) {
      this.logger.error(
        'Could not connect to Postgres. Is the database running? ' +
          '(docker compose up -d, then pnpm --filter @supplymind/api db:setup)',
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Runs a callback with the tenant context set for Postgres Row-Level Security.
   * All tenant-data tables enforce `org_id = current_setting('app.current_org')`.
   * Uses a transaction so the SET is scoped to these statements only.
   */
  async withTenant<T>(orgId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      // set_config(param, value, is_local=true) -> scoped to this transaction
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_org', $1, true)`, orgId);
      return fn(tx as unknown as PrismaClient);
    });
  }
}
