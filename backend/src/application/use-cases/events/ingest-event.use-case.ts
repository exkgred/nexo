import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import type {
  DomainEvent,
  EventType,
} from '../../../domain/entities/domain-event.entity';
import type { LeadSource } from '../../../domain/entities/lead.entity';
import {
  EVENT_REPOSITORY,
  type EventRepository,
} from '../../../domain/repositories/event.repository';
import { CaptureLeadUseCase } from '../leads/capture-lead.use-case';

export interface IngestEventInput {
  type: EventType;
  sourceApp: string;
  aggregateType?: string;
  aggregateId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  payload: Record<string, unknown>;
  defaultOwnerId: string;
}

@Injectable()
export class IngestEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly events: EventRepository,
    private readonly captureLead: CaptureLeadUseCase,
  ) {}

  async execute(input: IngestEventInput): Promise<DomainEvent> {
    const idempotencyKey = input.idempotencyKey ?? randomUUID();
    const existing = await this.events.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }

    const stored = await this.events.append({
      type: input.type,
      sourceApp: input.sourceApp,
      aggregateType: input.aggregateType ?? inferAggregate(input.type),
      aggregateId: input.aggregateId ?? randomUUID(),
      correlationId: input.correlationId ?? randomUUID(),
      idempotencyKey,
      payload: input.payload,
    });

    try {
      await this.handle(stored, input.defaultOwnerId);
      return this.events.markStatus(stored.id, 'PROCESSED');
    } catch {
      return this.events.markStatus(stored.id, 'FAILED');
    }
  }

  private async handle(
    event: DomainEvent,
    defaultOwnerId: string,
  ): Promise<void> {
    if (event.type === 'ChamadaEncerrada' || event.type === 'LeadCapturado') {
      const payload = event.payload;
      const name = stringValue(payload.name) ?? 'Lead sem nome';
      await this.captureLead.execute({
        name,
        email: stringValue(payload.email),
        phone: stringValue(payload.phone),
        company: stringValue(payload.company),
        source: toSource(event.sourceApp, event.type),
        notes: stringValue(payload.notes) ?? stringValue(payload.outcome),
        ownerId: stringValue(payload.ownerId) ?? defaultOwnerId,
        correlationId: event.correlationId,
        sourceApp: event.sourceApp,
      });
    }
  }
}

function inferAggregate(type: EventType): string {
  if (type === 'ChamadaEncerrada') return 'call';
  if (type === 'PedidoFaturado') return 'order';
  if (type === 'TicketAberto') return 'ticket';
  if (type.startsWith('Lead')) return 'lead';
  return 'opportunity';
}

function toSource(sourceApp: string, type: EventType): LeadSource {
  if (sourceApp === 'discador' || type === 'ChamadaEncerrada')
    return 'DISCADOR';
  if (sourceApp === 'chat') return 'CHAT';
  if (sourceApp === 'smarty') return 'SMARTY';
  return 'MANUAL';
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
