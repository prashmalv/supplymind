import { Body, Controller, Post } from '@nestjs/common';
import {
  IsArray, IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AiService } from './ai.service';
import { RequirePermissions, CurrentOrg } from '../common/decorators';

class ImageDto {
  @IsString() data!: string;
  @IsString() mimeType!: string;
}

class ChatHistoryItemDto {
  @IsIn(['user', 'model']) role!: 'user' | 'model';
  @IsString() text!: string;
}

class ChatDto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
  @IsString() message!: string;
  @IsOptional() @ValidateNested() @Type(() => ImageDto) image?: ImageDto;
}

class DraftDto {
  @IsString() prompt!: string;
}

class ScenarioDto {
  @IsNumber() demandSurge!: number;
  @IsNumber() supplierDelay!: number;
  @IsBoolean() portCongestion!: boolean;
  @IsOptional() @IsNumber() priceSpike?: number;
  @IsOptional() @IsBoolean() plantOutage?: boolean;
}

class InsightDto {
  @IsIn(['chart', 'kpi', 'forecast']) kind!: 'chart' | 'kpi' | 'forecast';
  @IsString() name!: string;
  @IsOptional() context?: unknown;
  @IsOptional() value?: unknown;
  @IsOptional() @IsString() trend?: string;
}

class SpeechDto {
  @IsString() text!: string;
}

@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('chat')
  @RequirePermissions('ai:chat')
  async chat(@CurrentOrg() orgId: string, @Body() dto: ChatDto) {
    const text = await this.ai.chat(orgId, dto.history ?? [], dto.message, dto.image);
    return { text };
  }

  @Post('draft')
  @RequirePermissions('ai:draft')
  async draft(@CurrentOrg() orgId: string, @Body() dto: DraftDto) {
    return { text: await this.ai.draft(orgId, dto.prompt) };
  }

  @Post('scenario')
  @RequirePermissions('ai:chat')
  async scenario(@CurrentOrg() orgId: string, @Body() dto: ScenarioDto) {
    return { text: await this.ai.scenario(orgId, dto) };
  }

  @Post('insight')
  @RequirePermissions('kpi:read')
  async insight(@CurrentOrg() orgId: string, @Body() dto: InsightDto) {
    return { text: await this.ai.insight(orgId, dto.kind, dto.name, dto.context, dto.value, dto.trend) };
  }

  @Post('tts')
  @RequirePermissions('ai:chat')
  async tts(@Body() dto: SpeechDto) {
    return { audio: await this.ai.speech(dto.text) };
  }

  @Post('live-token')
  @RequirePermissions('ai:chat')
  liveToken() {
    return this.ai.liveToken();
  }
}
