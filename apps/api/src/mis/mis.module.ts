import { Module } from '@nestjs/common';
import { MisService } from './mis.service';
import { MisController } from './mis.controller';

@Module({
  controllers: [MisController],
  providers: [MisService],
  exports: [MisService],
})
export class MisModule {}
