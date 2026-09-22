import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HOURS = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.domainEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.account.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        id: 'user-admin',
        name: 'Admin Nexo',
        email: 'admin@nexo.dev',
        passwordHash,
        role: 'ADMIN',
      },
      {
        id: 'user-ana',
        name: 'Ana Comercial',
        email: 'ana@nexo.dev',
        passwordHash,
        role: 'SELLER',
      },
      {
        id: 'user-manager',
        name: 'Marcos Manager',
        email: 'manager@nexo.dev',
        passwordHash,
        role: 'MANAGER',
      },
    ],
  });

  await prisma.account.createMany({
    data: [
      {
        id: 'acc-acme',
        name: 'ACME Ltda',
        email: 'carla@acme.test',
        phone: '41999990001',
        document: '12.345.678/0001-90',
      },
      {
        id: 'acc-norte',
        name: 'Loja Norte',
        email: 'compras@lojanorte.test',
        phone: '41999990002',
        document: '98.765.432/0001-10',
      },
    ],
  });

  await prisma.opportunity.createMany({
    data: [
      {
        id: 'opp-acme',
        title: 'ERP + assistência ACME',
        accountId: 'acc-acme',
        leadId: 'lead-carla',
        ownerId: 'user-ana',
        stage: 'PROPOSAL',
        amount: 18500,
        sourceApp: 'discador',
        createdAt: HOURS(40),
        updatedAt: HOURS(6),
      },
      {
        id: 'opp-norte',
        title: 'VendaCore Loja Norte',
        accountId: 'acc-norte',
        leadId: 'lead-norte',
        ownerId: 'user-ana',
        stage: 'WON',
        amount: 42000,
        sourceApp: 'nexo',
        wonAt: HOURS(8),
        createdAt: HOURS(90),
        updatedAt: HOURS(8),
      },
    ],
  });

  await prisma.lead.createMany({
    data: [
      {
        id: 'lead-carla',
        name: 'Carla Mendes',
        email: 'carla@acme.test',
        phone: '41999990001',
        company: 'ACME Ltda',
        source: 'DISCADOR',
        status: 'CONVERTED',
        notes: 'Wrap-up: interessada em ERP',
        ownerId: 'user-ana',
        accountId: 'acc-acme',
        opportunityId: 'opp-acme',
        createdAt: HOURS(48),
      },
      {
        id: 'lead-norte',
        name: 'Paulo Compras',
        email: 'compras@lojanorte.test',
        phone: '41999990002',
        company: 'Loja Norte',
        source: 'MANUAL',
        status: 'CONVERTED',
        ownerId: 'user-ana',
        accountId: 'acc-norte',
        opportunityId: 'opp-norte',
        createdAt: HOURS(96),
      },
      {
        id: 'lead-diego',
        name: 'Diego Costa',
        email: 'diego@costa.test',
        phone: '41988880003',
        company: null,
        source: 'CHAT',
        status: 'NEW',
        notes: 'Perguntou no chat do portfólio sobre o ERP',
        ownerId: 'user-ana',
        createdAt: HOURS(5),
      },
    ],
  });

  await prisma.domainEvent.createMany({
    data: [
      {
        type: 'ChamadaEncerrada',
        sourceApp: 'discador',
        aggregateType: 'call',
        aggregateId: 'call-carla',
        correlationId: 'lead-carla',
        idempotencyKey: 'seed-call-carla',
        status: 'PROCESSED',
        payload: { outcome: 'INTERESSADO', phone: '41999990001' },
        occurredAt: HOURS(48),
      },
      {
        type: 'LeadCapturado',
        sourceApp: 'discador',
        aggregateType: 'lead',
        aggregateId: 'lead-carla',
        correlationId: 'lead-carla',
        idempotencyKey: 'lead-capturado-lead-carla',
        status: 'PUBLISHED',
        payload: { name: 'Carla Mendes', company: 'ACME Ltda' },
        occurredAt: HOURS(48),
        publishedAt: HOURS(48),
      },
      {
        type: 'LeadQualificado',
        sourceApp: 'nexo',
        aggregateType: 'lead',
        aggregateId: 'lead-carla',
        correlationId: 'lead-carla',
        idempotencyKey: 'lead-qualificado-lead-carla',
        status: 'PUBLISHED',
        payload: { opportunityId: 'opp-acme' },
        occurredAt: HOURS(40),
        publishedAt: HOURS(40),
      },
      {
        type: 'OportunidadeCriada',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: 'opp-acme',
        correlationId: 'lead-carla',
        idempotencyKey: 'opp-criada-opp-acme',
        status: 'PUBLISHED',
        payload: { title: 'ERP + assistência ACME', amount: 18500 },
        occurredAt: HOURS(40),
        publishedAt: HOURS(40),
      },
      {
        type: 'PropostaEnviada',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: 'opp-acme',
        correlationId: 'lead-carla',
        idempotencyKey: 'seed-proposta-acme',
        status: 'PUBLISHED',
        payload: { amount: 18500 },
        occurredAt: HOURS(6),
        publishedAt: HOURS(6),
      },
      {
        type: 'LeadCapturado',
        sourceApp: 'chat',
        aggregateType: 'lead',
        aggregateId: 'lead-diego',
        correlationId: 'lead-diego',
        idempotencyKey: 'lead-capturado-lead-diego',
        status: 'PUBLISHED',
        payload: { name: 'Diego Costa', source: 'CHAT' },
        occurredAt: HOURS(5),
        publishedAt: HOURS(5),
      },
      {
        type: 'OportunidadeGanha',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: 'opp-norte',
        correlationId: 'lead-norte',
        idempotencyKey: 'ganha-opp-norte',
        status: 'PUBLISHED',
        payload: {
          amount: 42000,
          handoff: { system: 'vendacore', action: 'criarClienteEOrcamento' },
        },
        occurredAt: HOURS(8),
        publishedAt: HOURS(8),
      },
      {
        type: 'PedidoFaturado',
        sourceApp: 'vendacore',
        aggregateType: 'order',
        aggregateId: 'order-norte-1',
        correlationId: 'lead-norte',
        idempotencyKey: 'seed-pedido-norte',
        status: 'PROCESSED',
        payload: { amount: 42000, accountEmail: 'compras@lojanorte.test' },
        occurredAt: HOURS(3),
      },
    ],
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
