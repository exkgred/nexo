import { Inject, Injectable } from '@nestjs/common';
import type { Lead, LeadSource } from '../../../domain/entities/lead.entity';
import { EVENT_BUS, type EventBus } from '../../../domain/ports/event-bus';
import {
  LEAD_REPOSITORY,
  type LeadRepository,
} from '../../../domain/repositories/lead.repository';

export interface CaptureLeadInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source: LeadSource;
  notes?: string | null;
  ownerId: string;
  correlationId?: string;
  sourceApp?: string;
}

@Injectable()
export class CaptureLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: LeadRepository,
    @Inject(EVENT_BUS)
    private readonly bus: EventBus,
  ) {}

  async execute(input: CaptureLeadInput): Promise<Lead> {
    const existing = await this.leads.findByEmailOrPhone(
      input.email,
      input.phone,
    );
    if (existing && existing.status !== 'DISQUALIFIED') {
      return existing;
    }

    const lead = await this.leads.create({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      source: input.source,
      status: 'NEW',
      notes: input.notes ?? null,
      ownerId: input.ownerId,
      accountId: null,
      opportunityId: null,
    });

    await this.bus.publish({
      type: 'LeadCapturado',
      sourceApp: input.sourceApp ?? sourceToApp(input.source),
      aggregateType: 'lead',
      aggregateId: lead.id,
      correlationId: input.correlationId ?? lead.id,
      idempotencyKey: `lead-capturado-${lead.id}`,
      payload: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
      },
    });

    return lead;
  }
}

export function sourceToApp(source: LeadSource): string {
  if (source === 'DISCADOR') return 'discador';
  if (source === 'CHAT') return 'chat';
  if (source === 'SMARTY') return 'smarty';
  return 'nexo';
}
