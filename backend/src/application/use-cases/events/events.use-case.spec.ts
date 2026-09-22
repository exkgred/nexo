import { CaptureLeadUseCase } from '../leads/capture-lead.use-case';
import { GetDashboardUseCase } from '../dashboard/get-dashboard.use-case';
import { IngestEventUseCase } from './ingest-event.use-case';
import { ListEventsUseCase } from './list-events.use-case';
import {
  InMemoryEventRepository,
  InMemoryLeadRepository,
  InMemoryOpportunityRepository,
  memoryBus,
} from '../__tests__/memory';

describe('events + dashboard', () => {
  it('ChamadaEncerrada cria lead e marca PROCESSED', async () => {
    const leads = new InMemoryLeadRepository();
    const events = new InMemoryEventRepository();
    const ingest = new IngestEventUseCase(
      events,
      new CaptureLeadUseCase(leads, memoryBus(events)),
    );

    const stored = await ingest.execute({
      type: 'ChamadaEncerrada',
      sourceApp: 'discador',
      payload: {
        name: 'Carla Mendes',
        phone: '41999990001',
        company: 'ACME Ltda',
        outcome: 'INTERESSADO',
      },
      defaultOwnerId: 'user-ana',
      idempotencyKey: 'call-1',
    });

    expect(stored.status).toBe('PROCESSED');
    expect(leads.items).toHaveLength(1);
    expect(leads.items[0].source).toBe('DISCADOR');
  });

  it('mesma idempotencyKey não duplica', async () => {
    const leads = new InMemoryLeadRepository();
    const events = new InMemoryEventRepository();
    const ingest = new IngestEventUseCase(
      events,
      new CaptureLeadUseCase(leads, memoryBus(events)),
    );
    const first = await ingest.execute({
      type: 'LeadCapturado',
      sourceApp: 'chat',
      payload: { name: 'Diego', email: 'diego@costa.test' },
      defaultOwnerId: 'user-ana',
      idempotencyKey: 'chat-1',
    });
    const second = await ingest.execute({
      type: 'LeadCapturado',
      sourceApp: 'chat',
      payload: { name: 'Diego', email: 'diego@costa.test' },
      defaultOwnerId: 'user-ana',
      idempotencyKey: 'chat-1',
    });
    expect(second.id).toBe(first.id);
    expect(leads.items).toHaveLength(1);
  });

  it('PedidoFaturado só registra o evento', async () => {
    const events = new InMemoryEventRepository();
    const ingest = new IngestEventUseCase(
      events,
      new CaptureLeadUseCase(new InMemoryLeadRepository(), memoryBus(events)),
    );
    const stored = await ingest.execute({
      type: 'PedidoFaturado',
      sourceApp: 'vendacore',
      payload: { amount: 42000 },
      defaultOwnerId: 'user-ana',
    });
    expect(stored.status).toBe('PROCESSED');
    expect(stored.aggregateType).toBe('order');
  });

  it('handler com falha marca FAILED', async () => {
    const events = new InMemoryEventRepository();
    const capture = {
      execute: jest.fn().mockRejectedValue(new Error('boom')),
    } as unknown as CaptureLeadUseCase;
    const ingest = new IngestEventUseCase(events, capture);
    const stored = await ingest.execute({
      type: 'ChamadaEncerrada',
      sourceApp: 'discador',
      payload: { name: 'X' },
      defaultOwnerId: 'user-ana',
    });
    expect(stored.status).toBe('FAILED');
  });

  it('dashboard agrega funil e conversão', async () => {
    const now = new Date();
    const leads = new InMemoryLeadRepository([
      {
        id: 'l1',
        name: 'A',
        email: 'a@test.com',
        phone: null,
        company: null,
        source: 'CHAT',
        status: 'NEW',
        notes: null,
        ownerId: 'u',
        accountId: null,
        opportunityId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'l2',
        name: 'B',
        email: 'b@test.com',
        phone: null,
        company: null,
        source: 'MANUAL',
        status: 'CONVERTED',
        notes: null,
        ownerId: 'u',
        accountId: 'a1',
        opportunityId: 'o1',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const opps = new InMemoryOpportunityRepository([
      {
        id: 'o1',
        title: 'Ganha',
        accountId: 'a1',
        leadId: 'l2',
        ownerId: 'u',
        stage: 'WON',
        amount: 100,
        sourceApp: 'nexo',
        lostReason: null,
        wonAt: now,
        lostAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'o2',
        title: 'Aberta',
        accountId: 'a2',
        leadId: null,
        ownerId: 'u',
        stage: 'PROPOSAL',
        amount: 50,
        sourceApp: 'nexo',
        lostReason: null,
        wonAt: null,
        lostAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const events = new InMemoryEventRepository();
    const kpis = await new GetDashboardUseCase(leads, opps, events).execute();
    expect(kpis.openAmount).toBe(50);
    expect(kpis.wonAmount).toBe(100);
    expect(kpis.conversionRate).toBe(0.5);
    expect(kpis.newLeads).toBe(1);
    expect(kpis.byStage.WON.count).toBe(1);
  });

  it('lista eventos por tipo', async () => {
    const events = new InMemoryEventRepository();
    await events.append({
      type: 'TicketAberto',
      sourceApp: 'nexo',
      aggregateType: 'ticket',
      aggregateId: 't1',
      correlationId: 'c1',
      idempotencyKey: 't1',
      payload: {},
    });
    const listed = await new ListEventsUseCase(events).execute({
      type: 'TicketAberto',
    });
    expect(listed).toHaveLength(1);
    expect(await new ListEventsUseCase(events).execute()).toHaveLength(1);
  });

  it('LeadCapturado do chat/smarty e chamada sem nome', async () => {
    const leads = new InMemoryLeadRepository();
    const events = new InMemoryEventRepository();
    const ingest = new IngestEventUseCase(
      events,
      new CaptureLeadUseCase(leads, memoryBus(events)),
    );
    await ingest.execute({
      type: 'LeadCapturado',
      sourceApp: 'smarty',
      payload: { name: 'Balcão', phone: '41111' },
      defaultOwnerId: 'user-ana',
    });
    await ingest.execute({
      type: 'LeadCapturado',
      sourceApp: 'chat',
      payload: { name: 'Visitante', email: 'v@test.com' },
      defaultOwnerId: 'user-ana',
    });
    await ingest.execute({
      type: 'TicketAberto',
      sourceApp: 'nexo',
      payload: { title: 'Implantação' },
      defaultOwnerId: 'user-ana',
    });
    await ingest.execute({
      type: 'ChamadaEncerrada',
      sourceApp: 'discador',
      payload: { ownerId: 'user-ana' },
      defaultOwnerId: 'fallback',
    });
    expect(leads.items.some((item) => item.source === 'SMARTY')).toBe(true);
    expect(leads.items.some((item) => item.source === 'CHAT')).toBe(true);
    expect(leads.items.some((item) => item.name === 'Lead sem nome')).toBe(
      true,
    );
  });

  it('dashboard sem leads tem conversão zero', async () => {
    const kpis = await new GetDashboardUseCase(
      new InMemoryLeadRepository(),
      new InMemoryOpportunityRepository(),
      new InMemoryEventRepository(),
    ).execute();
    expect(kpis.conversionRate).toBe(0);
  });
});
