import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../application/interfaces/auth.interfaces';
import { CaptureLeadUseCase } from '../../application/use-cases/leads/capture-lead.use-case';
import { GetLeadUseCase } from '../../application/use-cases/leads/get-lead.use-case';
import { ListLeadsUseCase } from '../../application/use-cases/leads/list-leads.use-case';
import { QualifyLeadUseCase } from '../../application/use-cases/leads/qualify-lead.use-case';
import type { LeadSource, LeadStatus } from '../../domain/entities/lead.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CaptureLeadDto, QualifyLeadDto } from '../dto/nexo.dto';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(
    private readonly captureLead: CaptureLeadUseCase,
    private readonly listLeads: ListLeadsUseCase,
    private readonly getLead: GetLeadUseCase,
    private readonly qualifyLead: QualifyLeadUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar leads',
    description:
      'Leads capturados no Nexo, Discador ou chat. Filtros opcionais de status e origem.',
  })
  list(
    @Query('status') status?: LeadStatus,
    @Query('source') source?: LeadSource,
  ) {
    return this.listLeads.execute({ status, source });
  }

  @Post()
  @ApiOperation({
    summary: 'Capturar lead',
    description:
      'Cria lead manual (origem MANUAL) e publica LeadCapturado no bus. Duplicata por e-mail/telefone devolve o existente.',
  })
  create(@Body() dto: CaptureLeadDto, @CurrentUser() user: AccessTokenPayload) {
    return this.captureLead.execute({
      ...dto,
      source: dto.source ?? 'MANUAL',
      ownerId: user.sub,
      sourceApp: 'nexo',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do lead' })
  get(@Param('id') id: string) {
    return this.getLead.execute(id);
  }

  @Post(':id/qualify')
  @ApiOperation({
    summary: 'Qualificar lead',
    description:
      'Cria conta + oportunidade em QUALIFIED, marca o lead como CONVERTED e publica LeadQualificado e OportunidadeCriada.',
  })
  qualify(
    @Param('id') id: string,
    @Body() dto: QualifyLeadDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.qualifyLead.execute({
      leadId: id,
      title: dto.title,
      amount: dto.amount,
      actorId: user.sub,
    });
  }
}
