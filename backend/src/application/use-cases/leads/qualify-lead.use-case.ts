import { Inject, Injectable } from '@nestjs/common';
import type { Lead } from '../../../domain/entities/lead.entity';
import type { Opportunity } from '../../../domain/entities/opportunity.entity';
import {
  BusinessRuleError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import { EVENT_BUS, type EventBus } from '../../../domain/ports/event-bus';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepository,
} from '../../../domain/repositories/account.repository';
import {
  LEAD_REPOSITORY,
  type LeadRepository,
} from '../../../domain/repositories/lead.repository';
import {
  OPPORTUNITY_REPOSITORY,
  type OpportunityRepository,
} from '../../../domain/repositories/opportunity.repository';
import { sourceToApp } from './capture-lead.use-case';

export interface QualifyLeadInput {
  leadId: string;
  title?: string;
  amount?: number;
  actorId: string;
}

export interface QualifyLeadOutput {
  lead: Lead;
  opportunity: Opportunity;
}

@Injectable()
export class QualifyLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: LeadRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunities: OpportunityRepository,
    @Inject(EVENT_BUS)
    private readonly bus: EventBus,
  ) {}

  async execute(input: QualifyLeadInput): Promise<QualifyLeadOutput> {
    const lead = await this.leads.findById(input.leadId);
    if (!lead) {
      throw new NotFoundError('Lead');
    }
    if (lead.status === 'CONVERTED' && lead.opportunityId) {
      const existing = await this.opportunities.findById(lead.opportunityId);
      if (!existing) {
        throw new NotFoundError('Opportunity');
      }
      return { lead, opportunity: existing };
    }
    if (lead.status === 'DISQUALIFIED') {
      throw new BusinessRuleError('Lead desqualificado não vira oportunidade');
    }

    const accountName = lead.company?.trim() || lead.name;
    const account =
      (lead.email ? await this.accounts.findByEmail(lead.email) : null) ??
      (await this.accounts.create({
        name: accountName,
        email: lead.email,
        phone: lead.phone,
        document: null,
      }));

    const opportunity = await this.opportunities.create({
      title: input.title?.trim() || `Oportunidade ${account.name}`,
      accountId: account.id,
      leadId: lead.id,
      ownerId: lead.ownerId,
      stage: 'QUALIFIED',
      amount: input.amount ?? 0,
      sourceApp: sourceToApp(lead.source),
      lostReason: null,
      wonAt: null,
      lostAt: null,
    });

    const converted = await this.leads.update(lead.id, {
      status: 'CONVERTED',
      accountId: account.id,
      opportunityId: opportunity.id,
    });

    await this.bus.publish({
      type: 'LeadQualificado',
      sourceApp: 'nexo',
      aggregateType: 'lead',
      aggregateId: lead.id,
      correlationId: lead.id,
      idempotencyKey: `lead-qualificado-${lead.id}`,
      payload: { opportunityId: opportunity.id, accountId: account.id },
    });

    await this.bus.publish({
      type: 'OportunidadeCriada',
      sourceApp: 'nexo',
      aggregateType: 'opportunity',
      aggregateId: opportunity.id,
      correlationId: lead.id,
      idempotencyKey: `opp-criada-${opportunity.id}`,
      payload: {
        title: opportunity.title,
        amount: opportunity.amount,
        stage: opportunity.stage,
        actorId: input.actorId,
      },
    });

    return { lead: converted, opportunity };
  }
}
