import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type { LeadSource } from '../../domain/entities/lead.entity';
import type { OpportunityStage } from '../../domain/entities/opportunity.entity';
import type { EventType } from '../../domain/entities/domain-event.entity';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class CaptureLeadDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ enum: ['DISCADOR', 'CHAT', 'MANUAL', 'SMARTY'] })
  @IsOptional()
  @IsEnum(['DISCADOR', 'CHAT', 'MANUAL', 'SMARTY'])
  source?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QualifyLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class MoveStageDto {
  @ApiProperty({
    enum: ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
  })
  @IsEnum(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'])
  stage!: OpportunityStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostReason?: string;
}

export class IngestEventDto {
  @ApiProperty({
    enum: [
      'LeadCapturado',
      'LeadQualificado',
      'OportunidadeCriada',
      'EstagioAlterado',
      'PropostaEnviada',
      'OportunidadeGanha',
      'OportunidadePerdida',
      'PedidoFaturado',
      'ChamadaEncerrada',
      'TicketAberto',
    ],
  })
  @IsEnum([
    'LeadCapturado',
    'LeadQualificado',
    'OportunidadeCriada',
    'EstagioAlterado',
    'PropostaEnviada',
    'OportunidadeGanha',
    'OportunidadePerdida',
    'PedidoFaturado',
    'ChamadaEncerrada',
    'TicketAberto',
  ])
  type!: EventType;

  @ApiProperty()
  @IsString()
  sourceApp!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aggregateType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aggregateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiProperty()
  @IsObject()
  payload!: Record<string, unknown>;
}
