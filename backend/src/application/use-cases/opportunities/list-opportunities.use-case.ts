import { Inject, Injectable } from '@nestjs/common';
import type {
  Opportunity,
  OpportunityStage,
} from '../../../domain/entities/opportunity.entity';
import { NotFoundError } from '../../../domain/errors/domain-error';
import {
  EVENT_REPOSITORY,
  type EventRepository,
} from '../../../domain/repositories/event.repository';
import {
  OPPORTUNITY_REPOSITORY,
  type OpportunityRepository,
} from '../../../domain/repositories/opportunity.repository';
import type { DomainEvent } from '../../../domain/entities/domain-event.entity';

@Injectable()
export class ListOpportunitiesUseCase {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunities: OpportunityRepository,
  ) {}

  async execute(filters?: {
    stage?: OpportunityStage;
    ownerId?: string;
  }): Promise<Opportunity[]> {
    return this.opportunities.list(filters);
  }
}

export interface OpportunityDetail {
  opportunity: Opportunity;
  timeline: DomainEvent[];
}

@Injectable()
export class GetOpportunityUseCase {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunities: OpportunityRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly events: EventRepository,
  ) {}

  async execute(id: string): Promise<OpportunityDetail> {
    const opportunity = await this.opportunities.findById(id);
    if (!opportunity) {
      throw new NotFoundError('Opportunity');
    }
    const byOpp = await this.events.list({ aggregateId: opportunity.id });
    const byLead = opportunity.leadId
      ? await this.events.list({ correlationId: opportunity.leadId })
      : [];
    const merged = [...byLead, ...byOpp].filter(
      (event, index, all) =>
        all.findIndex((item) => item.id === event.id) === index,
    );
    merged.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    return { opportunity, timeline: merged };
  }
}
