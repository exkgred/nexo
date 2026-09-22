import {
  BusinessRuleError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import type { Opportunity } from '../../../domain/entities/opportunity.entity';
import {
  GetOpportunityUseCase,
  ListOpportunitiesUseCase,
} from './list-opportunities.use-case';
import { MoveOpportunityStageUseCase } from './move-opportunity-stage.use-case';
import {
  InMemoryEventRepository,
  InMemoryOpportunityRepository,
  memoryBus,
} from '../__tests__/memory';

function opp(overrides: Partial<Opportunity> = {}): Opportunity {
  const now = new Date();
  return {
    id: 'opp-1',
    title: 'ERP ACME',
    accountId: 'acc-1',
    leadId: 'lead-1',
    ownerId: 'user-ana',
    stage: 'QUALIFIED',
    amount: 18500,
    sourceApp: 'discador',
    lostReason: null,
    wonAt: null,
    lostAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('opportunities use cases', () => {
  it('move para PROPOSAL e publica PropostaEnviada', async () => {
    const opps = new InMemoryOpportunityRepository([opp()]);
    const events = new InMemoryEventRepository();
    const useCase = new MoveOpportunityStageUseCase(opps, memoryBus(events));

    const updated = await useCase.execute({
      opportunityId: 'opp-1',
      stage: 'PROPOSAL',
      actorId: 'user-ana',
    });

    expect(updated.stage).toBe('PROPOSAL');
    expect(events.items.map((item) => item.type)).toEqual(
      expect.arrayContaining(['EstagioAlterado', 'PropostaEnviada']),
    );
  });

  it('ganho publica OportunidadeGanha com handoff VendaCore', async () => {
    const opps = new InMemoryOpportunityRepository([
      opp({ stage: 'NEGOTIATION' }),
    ]);
    const events = new InMemoryEventRepository();
    const useCase = new MoveOpportunityStageUseCase(opps, memoryBus(events));

    const updated = await useCase.execute({
      opportunityId: 'opp-1',
      stage: 'WON',
      actorId: 'user-ana',
    });

    expect(updated.stage).toBe('WON');
    expect(updated.wonAt).toBeTruthy();
    const gained = events.items.find(
      (item) => item.type === 'OportunidadeGanha',
    );
    expect(gained?.payload.handoff).toEqual({
      system: 'vendacore',
      action: 'criarClienteEOrcamento',
    });
  });

  it('ganho com valor zero → regra de negócio', async () => {
    const useCase = new MoveOpportunityStageUseCase(
      new InMemoryOpportunityRepository([opp({ amount: 0 })]),
      memoryBus(new InMemoryEventRepository()),
    );
    await expect(
      useCase.execute({ opportunityId: 'opp-1', stage: 'WON', actorId: 'x' }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('perda exige motivo', async () => {
    const useCase = new MoveOpportunityStageUseCase(
      new InMemoryOpportunityRepository([opp()]),
      memoryBus(new InMemoryEventRepository()),
    );
    await expect(
      useCase.execute({ opportunityId: 'opp-1', stage: 'LOST', actorId: 'x' }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('perda com motivo publica OportunidadePerdida', async () => {
    const events = new InMemoryEventRepository();
    const useCase = new MoveOpportunityStageUseCase(
      new InMemoryOpportunityRepository([opp()]),
      memoryBus(events),
    );
    const updated = await useCase.execute({
      opportunityId: 'opp-1',
      stage: 'LOST',
      lostReason: 'Preço',
      actorId: 'x',
    });
    expect(updated.stage).toBe('LOST');
    expect(
      events.items.some((item) => item.type === 'OportunidadePerdida'),
    ).toBe(true);
  });

  it('encerrada não muda de estágio', async () => {
    const useCase = new MoveOpportunityStageUseCase(
      new InMemoryOpportunityRepository([opp({ stage: 'WON' })]),
      memoryBus(new InMemoryEventRepository()),
    );
    await expect(
      useCase.execute({
        opportunityId: 'opp-1',
        stage: 'PROPOSAL',
        actorId: 'x',
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('mesmo estágio → regra de negócio', async () => {
    const useCase = new MoveOpportunityStageUseCase(
      new InMemoryOpportunityRepository([opp()]),
      memoryBus(new InMemoryEventRepository()),
    );
    await expect(
      useCase.execute({
        opportunityId: 'opp-1',
        stage: 'QUALIFIED',
        actorId: 'x',
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('oportunidade inexistente → NotFoundError', async () => {
    const empty = new InMemoryOpportunityRepository();
    await expect(
      new MoveOpportunityStageUseCase(
        empty,
        memoryBus(new InMemoryEventRepository()),
      ).execute({ opportunityId: 'x', stage: 'PROPOSAL', actorId: 'a' }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      new GetOpportunityUseCase(empty, new InMemoryEventRepository()).execute(
        'x',
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it('lista e detalhe com jornada', async () => {
    const opportunity = opp();
    const opps = new InMemoryOpportunityRepository([opportunity]);
    const events = new InMemoryEventRepository();
    await events.append({
      type: 'LeadCapturado',
      sourceApp: 'discador',
      aggregateType: 'lead',
      aggregateId: 'lead-1',
      correlationId: 'lead-1',
      idempotencyKey: 'k1',
      payload: {},
    });
    const listed = await new ListOpportunitiesUseCase(opps).execute({
      stage: 'QUALIFIED',
    });
    expect(listed).toHaveLength(1);
    expect(await new ListOpportunitiesUseCase(opps).execute()).toHaveLength(1);
    const detail = await new GetOpportunityUseCase(opps, events).execute(
      'opp-1',
    );
    expect(detail.timeline).toHaveLength(1);
  });

  it('move entre colunas abertas sem proposta', async () => {
    const events = new InMemoryEventRepository();
    const updated = await new MoveOpportunityStageUseCase(
      new InMemoryOpportunityRepository([opp({ stage: 'NEW' })]),
      memoryBus(events),
    ).execute({ opportunityId: 'opp-1', stage: 'NEGOTIATION', actorId: 'x' });
    expect(updated.stage).toBe('NEGOTIATION');
    expect(events.items.some((item) => item.type === 'PropostaEnviada')).toBe(
      false,
    );
  });
});
