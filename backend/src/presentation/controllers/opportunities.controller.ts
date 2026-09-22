import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../application/interfaces/auth.interfaces';
import { GetOpportunityUseCase } from '../../application/use-cases/opportunities/list-opportunities.use-case';
import { ListOpportunitiesUseCase } from '../../application/use-cases/opportunities/list-opportunities.use-case';
import { MoveOpportunityStageUseCase } from '../../application/use-cases/opportunities/move-opportunity-stage.use-case';
import type { OpportunityStage } from '../../domain/entities/opportunity.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { MoveStageDto } from '../dto/nexo.dto';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Oportunidades')
@ApiBearerAuth()
@Controller('opportunities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OpportunitiesController {
  constructor(
    private readonly listOpportunities: ListOpportunitiesUseCase,
    private readonly getOpportunity: GetOpportunityUseCase,
    private readonly moveStage: MoveOpportunityStageUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Pipeline de oportunidades',
    description:
      'Lista o funil. Estágios abertos: NEW, QUALIFIED, PROPOSAL, NEGOTIATION. Encerrados: WON (handoff VendaCore) e LOST.',
  })
  list(@Query('stage') stage?: OpportunityStage) {
    return this.listOpportunities.execute({ stage });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Oportunidade + jornada',
    description:
      'Detalhe com a linha do tempo de eventos (correlationId do lead).',
  })
  get(@Param('id') id: string) {
    return this.getOpportunity.execute(id);
  }

  @Patch(':id/stage')
  @ApiOperation({
    summary: 'Mover estágio',
    description:
      'Publica EstagioAlterado. PROPOSAL também emite PropostaEnviada. WON exige valor > 0 e emite OportunidadeGanha com handoff ao VendaCore. LOST exige motivo.',
  })
  move(
    @Param('id') id: string,
    @Body() dto: MoveStageDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.moveStage.execute({
      opportunityId: id,
      stage: dto.stage,
      lostReason: dto.lostReason,
      actorId: user.sub,
    });
  }
}
