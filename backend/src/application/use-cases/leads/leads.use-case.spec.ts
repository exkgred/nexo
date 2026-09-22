import {
  BusinessRuleError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import type { Lead } from '../../../domain/entities/lead.entity';
import { CaptureLeadUseCase } from './capture-lead.use-case';
import { GetLeadUseCase } from './get-lead.use-case';
import { ListLeadsUseCase } from './list-leads.use-case';
import { QualifyLeadUseCase } from './qualify-lead.use-case';
import {
  InMemoryAccountRepository,
  InMemoryEventRepository,
  InMemoryLeadRepository,
  InMemoryOpportunityRepository,
  memoryBus,
} from '../__tests__/memory';

function newLead(overrides: Partial<Lead> = {}): Lead {
  const now = new Date();
  return {
    id: 'lead-1',
    name: 'Carla Mendes',
    email: 'carla@acme.test',
    phone: '41999990001',
    company: 'ACME Ltda',
    source: 'DISCADOR',
    status: 'NEW',
    notes: null,
    ownerId: 'user-ana',
    accountId: null,
    opportunityId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('leads use cases', () => {
  it('captura lead e publica LeadCapturado', async () => {
    const leads = new InMemoryLeadRepository();
    const events = new InMemoryEventRepository();
    const useCase = new CaptureLeadUseCase(leads, memoryBus(events));

    const lead = await useCase.execute({
      name: 'Carla Mendes',
      email: 'carla@acme.test',
      phone: '41999990001',
      company: 'ACME Ltda',
      source: 'DISCADOR',
      ownerId: 'user-ana',
    });

    expect(lead.status).toBe('NEW');
    expect(events.items.some((item) => item.type === 'LeadCapturado')).toBe(
      true,
    );
  });

  it('captura duplicada por e-mail devolve o lead existente', async () => {
    const leads = new InMemoryLeadRepository([newLead()]);
    const events = new InMemoryEventRepository();
    const useCase = new CaptureLeadUseCase(leads, memoryBus(events));

    const lead = await useCase.execute({
      name: 'Outro',
      email: 'carla@acme.test',
      source: 'MANUAL',
      ownerId: 'user-ana',
    });

    expect(lead.id).toBe('lead-1');
    expect(events.items).toHaveLength(0);
  });

  it('qualifica lead → conta, oportunidade QUALIFIED e eventos', async () => {
    const leads = new InMemoryLeadRepository([newLead()]);
    const accounts = new InMemoryAccountRepository();
    const opps = new InMemoryOpportunityRepository();
    const events = new InMemoryEventRepository();
    const useCase = new QualifyLeadUseCase(
      leads,
      accounts,
      opps,
      memoryBus(events),
    );

    const result = await useCase.execute({
      leadId: 'lead-1',
      amount: 10000,
      actorId: 'user-ana',
    });

    expect(result.lead.status).toBe('CONVERTED');
    expect(result.opportunity.stage).toBe('QUALIFIED');
    expect(result.opportunity.amount).toBe(10000);
    expect(events.items.map((item) => item.type)).toEqual(
      expect.arrayContaining(['LeadQualificado', 'OportunidadeCriada']),
    );
  });

  it('qualifica de novo devolve a oportunidade existente', async () => {
    const lead = newLead({
      status: 'CONVERTED',
      opportunityId: 'opp-1',
      accountId: 'acc-1',
    });
    const leads = new InMemoryLeadRepository([lead]);
    const accounts = new InMemoryAccountRepository();
    const opps = new InMemoryOpportunityRepository([
      {
        id: 'opp-1',
        title: 'Já existe',
        accountId: 'acc-1',
        leadId: lead.id,
        ownerId: 'user-ana',
        stage: 'PROPOSAL',
        amount: 1,
        sourceApp: 'nexo',
        lostReason: null,
        wonAt: null,
        lostAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const useCase = new QualifyLeadUseCase(
      leads,
      accounts,
      opps,
      memoryBus(new InMemoryEventRepository()),
    );

    const result = await useCase.execute({ leadId: 'lead-1', actorId: 'x' });
    expect(result.opportunity.id).toBe('opp-1');
  });

  it('lead desqualificado não vira oportunidade', async () => {
    const leads = new InMemoryLeadRepository([
      newLead({ status: 'DISQUALIFIED' }),
    ]);
    const useCase = new QualifyLeadUseCase(
      leads,
      new InMemoryAccountRepository(),
      new InMemoryOpportunityRepository(),
      memoryBus(new InMemoryEventRepository()),
    );
    await expect(
      useCase.execute({ leadId: 'lead-1', actorId: 'x' }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('lead inexistente → NotFoundError', async () => {
    const get = new GetLeadUseCase(new InMemoryLeadRepository());
    await expect(get.execute('missing')).rejects.toThrow(NotFoundError);
    const qualify = new QualifyLeadUseCase(
      new InMemoryLeadRepository(),
      new InMemoryAccountRepository(),
      new InMemoryOpportunityRepository(),
      memoryBus(new InMemoryEventRepository()),
    );
    await expect(
      qualify.execute({ leadId: 'missing', actorId: 'x' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('lista leads por status e devolve detalhe', async () => {
    const leads = new InMemoryLeadRepository([
      newLead(),
      newLead({ id: 'lead-2', status: 'CONVERTED', email: 'b@test.com' }),
    ]);
    const listed = await new ListLeadsUseCase(leads).execute({ status: 'NEW' });
    expect(listed).toHaveLength(1);
    await expect(
      new GetLeadUseCase(leads).execute('lead-1'),
    ).resolves.toMatchObject({ id: 'lead-1' });
  });

  it('captura de chat, smarty e manual mapeiam sourceApp', async () => {
    const leads = new InMemoryLeadRepository();
    const events = new InMemoryEventRepository();
    const useCase = new CaptureLeadUseCase(leads, memoryBus(events));
    await useCase.execute({
      name: 'Chat',
      email: 'c@test.com',
      source: 'CHAT',
      ownerId: 'u',
    });
    await useCase.execute({
      name: 'Loja',
      email: 's@test.com',
      source: 'SMARTY',
      ownerId: 'u',
    });
    await useCase.execute({
      name: 'Manual',
      email: 'm@test.com',
      source: 'MANUAL',
      ownerId: 'u',
    });
    expect(events.items.map((item) => item.sourceApp).sort()).toEqual([
      'chat',
      'nexo',
      'smarty',
    ]);
  });

  it('lead desqualificado permite recaptura', async () => {
    const leads = new InMemoryLeadRepository([
      newLead({ status: 'DISQUALIFIED' }),
    ]);
    const events = new InMemoryEventRepository();
    const created = await new CaptureLeadUseCase(
      leads,
      memoryBus(events),
    ).execute({
      name: 'Carla Mendes',
      email: 'carla@acme.test',
      source: 'MANUAL',
      ownerId: 'user-ana',
    });
    expect(created.id).not.toBe('lead-1');
  });

  it('qualifica reusando conta pelo e-mail e nome da pessoa', async () => {
    const leads = new InMemoryLeadRepository([
      newLead({ company: null, email: 'carla@acme.test' }),
    ]);
    const accounts = new InMemoryAccountRepository([
      {
        id: 'acc-1',
        name: 'ACME Ltda',
        email: 'carla@acme.test',
        phone: null,
        document: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await new QualifyLeadUseCase(
      leads,
      accounts,
      new InMemoryOpportunityRepository(),
      memoryBus(new InMemoryEventRepository()),
    ).execute({ leadId: 'lead-1', actorId: 'x', title: 'Deal' });
    expect(result.opportunity.accountId).toBe('acc-1');
    expect(result.opportunity.title).toBe('Deal');
  });

  it('convertido sem oportunidade → NotFoundError', async () => {
    const leads = new InMemoryLeadRepository([
      newLead({ status: 'CONVERTED', opportunityId: 'ghost' }),
    ]);
    await expect(
      new QualifyLeadUseCase(
        leads,
        new InMemoryAccountRepository(),
        new InMemoryOpportunityRepository(),
        memoryBus(new InMemoryEventRepository()),
      ).execute({ leadId: 'lead-1', actorId: 'x' }),
    ).rejects.toThrow(NotFoundError);
  });
});
