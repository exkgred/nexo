import { randomUUID } from 'crypto';
import type { Account } from '../../../domain/entities/account.entity';
import type {
  DomainEvent,
  NewDomainEvent,
} from '../../../domain/entities/domain-event.entity';
import type { Lead } from '../../../domain/entities/lead.entity';
import type { Opportunity } from '../../../domain/entities/opportunity.entity';
import { OutboxEventBus } from '../../../infrastructure/events/outbox-event-bus';
import type { AccountRepository } from '../../../domain/repositories/account.repository';
import type { EventRepository } from '../../../domain/repositories/event.repository';
import type { LeadRepository } from '../../../domain/repositories/lead.repository';
import type { OpportunityRepository } from '../../../domain/repositories/opportunity.repository';

const now = () => new Date();

export class InMemoryLeadRepository implements LeadRepository {
  constructor(public items: Lead[] = []) {}

  async findById(id: string): Promise<Lead | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findByEmailOrPhone(
    email?: string | null,
    phone?: string | null,
  ): Promise<Lead | null> {
    return (
      this.items.find(
        (item) =>
          (email && item.email === email) || (phone && item.phone === phone),
      ) ?? null
    );
  }

  async list(filters?: {
    status?: Lead['status'];
    source?: Lead['source'];
  }): Promise<Lead[]> {
    return this.items.filter((item) => {
      if (filters?.status && item.status !== filters.status) return false;
      if (filters?.source && item.source !== filters.source) return false;
      return true;
    });
  }

  async create(
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Lead> {
    const lead: Lead = {
      ...data,
      id: data.id ?? randomUUID(),
      createdAt: now(),
      updatedAt: now(),
    };
    this.items.unshift(lead);
    return lead;
  }

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    const index = this.items.findIndex((item) => item.id === id);
    const current = this.items[index];
    const updated = { ...current, ...data, id: current.id, updatedAt: now() };
    this.items[index] = updated;
    return updated;
  }
}

export class InMemoryAccountRepository implements AccountRepository {
  constructor(public items: Account[] = []) {}

  async findById(id: string): Promise<Account | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.items.find((item) => item.email === email) ?? null;
  }

  async create(
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Account> {
    const account: Account = {
      ...data,
      id: data.id ?? randomUUID(),
      createdAt: now(),
      updatedAt: now(),
    };
    this.items.push(account);
    return account;
  }
}

export class InMemoryOpportunityRepository implements OpportunityRepository {
  constructor(public items: Opportunity[] = []) {}

  async findById(id: string): Promise<Opportunity | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async list(filters?: {
    stage?: Opportunity['stage'];
    ownerId?: string;
  }): Promise<Opportunity[]> {
    return this.items.filter((item) => {
      if (filters?.stage && item.stage !== filters.stage) return false;
      if (filters?.ownerId && item.ownerId !== filters.ownerId) return false;
      return true;
    });
  }

  async create(
    data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Opportunity> {
    const opportunity: Opportunity = {
      ...data,
      id: data.id ?? randomUUID(),
      createdAt: now(),
      updatedAt: now(),
    };
    this.items.unshift(opportunity);
    return opportunity;
  }

  async update(id: string, data: Partial<Opportunity>): Promise<Opportunity> {
    const index = this.items.findIndex((item) => item.id === id);
    const current = this.items[index];
    const updated = { ...current, ...data, id: current.id, updatedAt: now() };
    this.items[index] = updated;
    return updated;
  }
}

export class InMemoryEventRepository implements EventRepository {
  constructor(public items: DomainEvent[] = []) {}

  async append(event: NewDomainEvent): Promise<DomainEvent> {
    const stored: DomainEvent = {
      ...event,
      id: randomUUID(),
      status: 'RECEIVED',
      occurredAt: event.occurredAt ?? now(),
      publishedAt: null,
    };
    this.items.unshift(stored);
    return stored;
  }

  async findByIdempotencyKey(key: string): Promise<DomainEvent | null> {
    return this.items.find((item) => item.idempotencyKey === key) ?? null;
  }

  async list(filters?: {
    type?: DomainEvent['type'];
    sourceApp?: string;
    aggregateId?: string;
    correlationId?: string;
  }): Promise<DomainEvent[]> {
    return this.items.filter((item) => {
      if (filters?.type && item.type !== filters.type) return false;
      if (filters?.sourceApp && item.sourceApp !== filters.sourceApp)
        return false;
      if (filters?.aggregateId && item.aggregateId !== filters.aggregateId)
        return false;
      if (
        filters?.correlationId &&
        item.correlationId !== filters.correlationId
      )
        return false;
      return true;
    });
  }

  async markStatus(
    id: string,
    status: DomainEvent['status'],
    publishedAt?: Date | null,
  ): Promise<DomainEvent> {
    const item = this.items.find((row) => row.id === id);
    if (!item) throw new Error('event missing');
    item.status = status;
    if (publishedAt !== undefined) item.publishedAt = publishedAt;
    return item;
  }
}

export function memoryBus(events: InMemoryEventRepository): OutboxEventBus {
  return new OutboxEventBus(events);
}
