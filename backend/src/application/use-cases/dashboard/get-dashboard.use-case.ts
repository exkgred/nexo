import { Inject, Injectable } from '@nestjs/common';
import { OPEN_STAGES } from '../../../domain/entities/opportunity.entity';
import {
  EVENT_REPOSITORY,
  type EventRepository,
} from '../../../domain/repositories/event.repository';
import {
  LEAD_REPOSITORY,
  type LeadRepository,
} from '../../../domain/repositories/lead.repository';
import {
  OPPORTUNITY_REPOSITORY,
  type OpportunityRepository,
} from '../../../domain/repositories/opportunity.repository';
import type { DomainEvent } from '../../../domain/entities/domain-event.entity';

export interface DashboardKpis {
  openAmount: number;
  wonAmount: number;
  openCount: number;
  wonCount: number;
  newLeads: number;
  conversionRate: number;
  byStage: Record<string, { count: number; amount: number }>;
  recentEvents: DomainEvent[];
}

@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: LeadRepository,
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunities: OpportunityRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly events: EventRepository,
  ) {}

  async execute(): Promise<DashboardKpis> {
    const [leads, opps, events] = await Promise.all([
      this.leads.list(),
      this.opportunities.list(),
      this.events.list(),
    ]);

    const open = opps.filter((item) => OPEN_STAGES.includes(item.stage));
    const won = opps.filter((item) => item.stage === 'WON');
    const converted = leads.filter((item) => item.status === 'CONVERTED');
    const byStage: DashboardKpis['byStage'] = {};
    for (const opp of opps) {
      const bucket = byStage[opp.stage] ?? { count: 0, amount: 0 };
      bucket.count += 1;
      bucket.amount += opp.amount;
      byStage[opp.stage] = bucket;
    }

    return {
      openAmount: open.reduce((sum, item) => sum + item.amount, 0),
      wonAmount: won.reduce((sum, item) => sum + item.amount, 0),
      openCount: open.length,
      wonCount: won.length,
      newLeads: leads.filter((item) => item.status === 'NEW').length,
      conversionRate:
        leads.length === 0
          ? 0
          : Number((converted.length / leads.length).toFixed(2)),
      byStage,
      recentEvents: events.slice(0, 12),
    };
  }
}
