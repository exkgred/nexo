import { Inject, Injectable } from '@nestjs/common';
import type { Opportunity } from '../../../domain/entities/opportunity.entity';
import { NotFoundError } from '../../../domain/errors/domain-error';
import { EVENT_BUS, type EventBus } from '../../../domain/ports/event-bus';
import {
  assertCanLose,
  assertCanMove,
  assertCanWin,
} from '../../../domain/ports/pipeline';
import {
  OPPORTUNITY_REPOSITORY,
  type OpportunityRepository,
} from '../../../domain/repositories/opportunity.repository';

export interface MoveOpportunityStageInput {
  opportunityId: string;
  stage: Opportunity['stage'];
  lostReason?: string;
  actorId: string;
}

@Injectable()
export class MoveOpportunityStageUseCase {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunities: OpportunityRepository,
    @Inject(EVENT_BUS)
    private readonly bus: EventBus,
  ) {}

  async execute(input: MoveOpportunityStageInput): Promise<Opportunity> {
    const current = await this.opportunities.findById(input.opportunityId);
    if (!current) {
      throw new NotFoundError('Opportunity');
    }

    if (input.stage === 'WON') {
      assertCanMove(current.stage, 'WON');
      assertCanWin(current.amount);
    } else if (input.stage === 'LOST') {
      assertCanMove(current.stage, 'LOST');
      assertCanLose(input.lostReason);
    } else {
      assertCanMove(current.stage, input.stage);
    }

    const now = new Date();
    const updated = await this.opportunities.update(current.id, {
      stage: input.stage,
      lostReason:
        input.stage === 'LOST'
          ? (input.lostReason ?? null)
          : current.lostReason,
      wonAt: input.stage === 'WON' ? now : current.wonAt,
      lostAt: input.stage === 'LOST' ? now : current.lostAt,
    });

    const correlationId = current.leadId ?? current.id;

    await this.bus.publish({
      type: 'EstagioAlterado',
      sourceApp: 'nexo',
      aggregateType: 'opportunity',
      aggregateId: current.id,
      correlationId,
      idempotencyKey: `stage-${current.id}-${input.stage}-${now.getTime()}`,
      payload: {
        from: current.stage,
        to: input.stage,
        actorId: input.actorId,
      },
    });

    if (input.stage === 'PROPOSAL' && current.stage !== 'PROPOSAL') {
      await this.bus.publish({
        type: 'PropostaEnviada',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: current.id,
        correlationId,
        idempotencyKey: `proposta-${current.id}-${now.getTime()}`,
        payload: { amount: current.amount, actorId: input.actorId },
      });
    }

    if (input.stage === 'WON') {
      await this.bus.publish({
        type: 'OportunidadeGanha',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: current.id,
        correlationId,
        idempotencyKey: `ganha-${current.id}`,
        payload: {
          amount: current.amount,
          accountId: current.accountId,
          handoff: {
            system: 'vendacore',
            action: 'criarClienteEOrcamento',
          },
          actorId: input.actorId,
        },
      });
    }

    if (input.stage === 'LOST') {
      await this.bus.publish({
        type: 'OportunidadePerdida',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: current.id,
        correlationId,
        idempotencyKey: `perdida-${current.id}`,
        payload: { reason: input.lostReason, actorId: input.actorId },
      });
    }

    return updated;
  }
}
