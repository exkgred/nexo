import type { AxiosAdapter } from 'axios'
import type {
  DashboardKpis,
  DomainEvent,
  Envelope,
  EventType,
  Lead,
  LeadSource,
  Opportunity,
  OpportunityStage,
  PublicUser,
} from './types'

const STORAGE_KEY = 'nexo-demo-v1'
const OPEN: OpportunityStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION']

interface DemoUser extends PublicUser {
  password: string
}

interface DemoState {
  users: DemoUser[]
  leads: Lead[]
  opportunities: Opportunity[]
  events: DomainEvent[]
  currentUserId: string | null
}

const nowIso = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

function seed(): DemoState {
  const users: DemoUser[] = [
    { id: 'user-admin', name: 'Admin Nexo', email: 'admin@nexo.dev', role: 'ADMIN', password: 'password123' },
    { id: 'user-ana', name: 'Ana Comercial', email: 'ana@nexo.dev', role: 'SELLER', password: 'password123' },
    { id: 'user-manager', name: 'Marcos Manager', email: 'manager@nexo.dev', role: 'MANAGER', password: 'password123' },
  ]

  const leads: Lead[] = [
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
      createdAt: hoursAgo(48),
      updatedAt: hoursAgo(40),
    },
    {
      id: 'lead-norte',
      name: 'Paulo Compras',
      email: 'compras@lojanorte.test',
      phone: '41999990002',
      company: 'Loja Norte',
      source: 'MANUAL',
      status: 'CONVERTED',
      notes: null,
      ownerId: 'user-ana',
      accountId: 'acc-norte',
      opportunityId: 'opp-norte',
      createdAt: hoursAgo(96),
      updatedAt: hoursAgo(90),
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
      accountId: null,
      opportunityId: null,
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
    },
  ]

  const opportunities: Opportunity[] = [
    {
      id: 'opp-acme',
      title: 'ERP + assistência ACME',
      accountId: 'acc-acme',
      leadId: 'lead-carla',
      ownerId: 'user-ana',
      stage: 'PROPOSAL',
      amount: 18500,
      sourceApp: 'discador',
      lostReason: null,
      wonAt: null,
      lostAt: null,
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(6),
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
      lostReason: null,
      wonAt: hoursAgo(8),
      lostAt: null,
      createdAt: hoursAgo(90),
      updatedAt: hoursAgo(8),
    },
  ]

  const events: DomainEvent[] = [
    event('ChamadaEncerrada', 'discador', 'call', 'call-carla', 'lead-carla', hoursAgo(48), { outcome: 'INTERESSADO' }),
    event('LeadCapturado', 'discador', 'lead', 'lead-carla', 'lead-carla', hoursAgo(48), { name: 'Carla Mendes' }),
    event('LeadQualificado', 'nexo', 'lead', 'lead-carla', 'lead-carla', hoursAgo(40), { opportunityId: 'opp-acme' }),
    event('OportunidadeCriada', 'nexo', 'opportunity', 'opp-acme', 'lead-carla', hoursAgo(40), { amount: 18500 }),
    event('PropostaEnviada', 'nexo', 'opportunity', 'opp-acme', 'lead-carla', hoursAgo(6), { amount: 18500 }),
    event('LeadCapturado', 'chat', 'lead', 'lead-diego', 'lead-diego', hoursAgo(5), { name: 'Diego Costa' }),
    event('OportunidadeGanha', 'nexo', 'opportunity', 'opp-norte', 'lead-norte', hoursAgo(8), {
      amount: 42000,
      handoff: { system: 'vendacore', action: 'criarClienteEOrcamento' },
    }),
    event('PedidoFaturado', 'vendacore', 'order', 'order-norte-1', 'lead-norte', hoursAgo(3), { amount: 42000 }),
  ]

  return { users, leads, opportunities, events, currentUserId: null }
}

function event(
  type: EventType,
  sourceApp: string,
  aggregateType: string,
  aggregateId: string,
  correlationId: string,
  occurredAt: string,
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    id: uid('evt'),
    type,
    sourceApp,
    aggregateType,
    aggregateId,
    correlationId,
    idempotencyKey: `${type}-${aggregateId}-${occurredAt}`,
    payload,
    status: sourceApp === 'nexo' ? 'PUBLISHED' : 'PROCESSED',
    occurredAt,
    publishedAt: sourceApp === 'nexo' ? occurredAt : null,
  }
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DemoState
  } catch {
    /* seed */
  }
  const state = seed()
  save(state)
  return state
}

function save(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function ok<T>(data: T): Envelope<T> {
  return { success: true, data, meta: { timestamp: nowIso() } }
}

function fail(status: number, message: string, code: string) {
  const error = Object.assign(new Error(message), {
    response: {
      status,
      data: {
        success: false,
        error: { code, message },
        meta: { timestamp: nowIso() },
      },
    },
  })
  return Promise.reject(error)
}

function publicUser(user: DemoUser): PublicUser {
  const { password: _password, ...rest } = user
  return rest
}

function publish(
  state: DemoState,
  partial: Omit<DomainEvent, 'id' | 'status' | 'occurredAt' | 'publishedAt' | 'idempotencyKey'> & {
    idempotencyKey?: string
  },
): DomainEvent {
  const stored: DomainEvent = {
    ...partial,
    id: uid('evt'),
    idempotencyKey: partial.idempotencyKey ?? uid('key'),
    status: 'PUBLISHED',
    occurredAt: nowIso(),
    publishedAt: nowIso(),
  }
  state.events.unshift(stored)
  return stored
}

function dashboardOf(state: DemoState): DashboardKpis {
  const open = state.opportunities.filter((item) => OPEN.includes(item.stage))
  const won = state.opportunities.filter((item) => item.stage === 'WON')
  const converted = state.leads.filter((item) => item.status === 'CONVERTED')
  const byStage: DashboardKpis['byStage'] = {}
  for (const opp of state.opportunities) {
    const bucket = byStage[opp.stage] ?? { count: 0, amount: 0 }
    bucket.count += 1
    bucket.amount += opp.amount
    byStage[opp.stage] = bucket
  }
  return {
    openAmount: open.reduce((sum, item) => sum + item.amount, 0),
    wonAmount: won.reduce((sum, item) => sum + item.amount, 0),
    openCount: open.length,
    wonCount: won.length,
    newLeads: state.leads.filter((item) => item.status === 'NEW').length,
    conversionRate: state.leads.length === 0 ? 0 : Number((converted.length / state.leads.length).toFixed(2)),
    byStage,
    recentEvents: state.events.slice(0, 12),
  }
}

function sourceToApp(source: LeadSource): string {
  if (source === 'DISCADOR') return 'discador'
  if (source === 'CHAT') return 'chat'
  if (source === 'SMARTY') return 'smarty'
  return 'nexo'
}

export const demoAdapter: AxiosAdapter = async (config) => {
  const state = load()
  const method = (config.method ?? 'get').toLowerCase()
  const url = (config.url ?? '').replace(config.baseURL ?? '', '')
  const [path, queryString] = url.split('?')
  const params = new URLSearchParams(queryString ?? '')
  const tokenHeader = config.headers.Authorization
  const token = typeof tokenHeader === 'string' && tokenHeader.startsWith('Bearer ') ? tokenHeader.slice(7) : null
  if (token) {
    const owner = state.users.find((user) => user.id === token)
    if (owner) state.currentUserId = owner.id
  }
  const json = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {}
  const respond = (payload: unknown, status = 200) => ({
    data: payload,
    status,
    statusText: 'OK',
    headers: {},
    config,
  })

  if (method === 'get' && path.endsWith('/health')) {
    return respond(ok({ status: 'ok' }))
  }

  if (method === 'post' && path.endsWith('/auth/login')) {
    const user = state.users.find((item) => item.email === json.email && item.password === json.password)
    if (!user) return fail(401, 'Credenciais inválidas', 'UNAUTHORIZED')
    state.currentUserId = user.id
    save(state)
    return respond(ok({ user: publicUser(user), tokens: { accessToken: user.id, refreshToken: `refresh-${user.id}` } }))
  }

  if (method === 'post' && path.endsWith('/auth/refresh')) {
    const userId = String(json.refreshToken ?? '').replace('refresh-', '')
    const user = state.users.find((item) => item.id === userId)
    if (!user) return fail(401, 'Refresh token inválido', 'UNAUTHORIZED')
    return respond(ok({ accessToken: user.id, refreshToken: `refresh-${user.id}` }))
  }

  if (method === 'post' && path.endsWith('/auth/logout')) {
    state.currentUserId = null
    save(state)
    return respond(ok({ ok: true }))
  }

  if (method === 'post' && path.endsWith('/events/ingest')) {
    const existing = state.events.find((item) => item.idempotencyKey === json.idempotencyKey)
    if (existing) return respond(ok(existing))
    const ingest: DomainEvent = {
      id: uid('evt'),
      type: json.type,
      sourceApp: json.sourceApp,
      aggregateType: json.aggregateType ?? 'lead',
      aggregateId: json.aggregateId ?? uid('agg'),
      correlationId: json.correlationId ?? uid('corr'),
      idempotencyKey: json.idempotencyKey ?? uid('key'),
      payload: json.payload ?? {},
      status: 'PROCESSED',
      occurredAt: nowIso(),
      publishedAt: null,
    }
    state.events.unshift(ingest)
    if (json.type === 'ChamadaEncerrada' || json.type === 'LeadCapturado') {
      const payload = (json.payload ?? {}) as Record<string, unknown>
      const name = typeof payload.name === 'string' ? payload.name : 'Lead sem nome'
      const email = typeof payload.email === 'string' ? payload.email : null
      const phone = typeof payload.phone === 'string' ? payload.phone : null
      const found = state.leads.find((item) => (email && item.email === email) || (phone && item.phone === phone))
      if (!found) {
        const source: LeadSource =
          json.sourceApp === 'discador' || json.type === 'ChamadaEncerrada'
            ? 'DISCADOR'
            : json.sourceApp === 'chat'
              ? 'CHAT'
              : json.sourceApp === 'smarty'
                ? 'SMARTY'
                : 'MANUAL'
        const lead: Lead = {
          id: uid('lead'),
          name,
          email,
          phone,
          company: typeof payload.company === 'string' ? payload.company : null,
          source,
          status: 'NEW',
          notes: typeof payload.outcome === 'string' ? payload.outcome : null,
          ownerId: state.currentUserId ?? 'user-ana',
          accountId: null,
          opportunityId: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        state.leads.unshift(lead)
        publish(state, {
          type: 'LeadCapturado',
          sourceApp: json.sourceApp,
          aggregateType: 'lead',
          aggregateId: lead.id,
          correlationId: ingest.correlationId,
          payload: { name: lead.name, source: lead.source },
        })
      }
    }
    save(state)
    return respond(ok(ingest))
  }

  const actor = state.users.find((user) => user.id === state.currentUserId)
  if (!actor) return fail(401, 'Unauthorized', 'UNAUTHORIZED')

  if (method === 'get' && path.endsWith('/auth/me')) {
    return respond(ok(publicUser(actor)))
  }

  if (method === 'get' && path.endsWith('/dashboard')) {
    return respond(ok(dashboardOf(state)))
  }

  if (method === 'get' && path.endsWith('/leads')) {
    const status = params.get('status')
    const source = params.get('source')
    const items = state.leads.filter((item) => {
      if (status && item.status !== status) return false
      if (source && item.source !== source) return false
      return true
    })
    return respond(ok(items))
  }

  if (method === 'post' && path.endsWith('/leads')) {
    const existing = state.leads.find(
      (item) => (json.email && item.email === json.email) || (json.phone && item.phone === json.phone),
    )
    if (existing && existing.status !== 'DISQUALIFIED') return respond(ok(existing))
    const lead: Lead = {
      id: uid('lead'),
      name: json.name,
      email: json.email ?? null,
      phone: json.phone ?? null,
      company: json.company ?? null,
      source: json.source ?? 'MANUAL',
      status: 'NEW',
      notes: json.notes ?? null,
      ownerId: actor.id,
      accountId: null,
      opportunityId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    state.leads.unshift(lead)
    publish(state, {
      type: 'LeadCapturado',
      sourceApp: 'nexo',
      aggregateType: 'lead',
      aggregateId: lead.id,
      correlationId: lead.id,
      payload: { name: lead.name, source: lead.source },
      idempotencyKey: `lead-capturado-${lead.id}`,
    })
    save(state)
    return respond(ok(lead))
  }

  const qualifyMatch = path.match(/\/leads\/([^/]+)\/qualify$/)
  if (method === 'post' && qualifyMatch) {
    const lead = state.leads.find((item) => item.id === qualifyMatch[1])
    if (!lead) return fail(404, 'Lead not found', 'RESOURCE_NOT_FOUND')
    if (lead.status === 'CONVERTED' && lead.opportunityId) {
      const existing = state.opportunities.find((item) => item.id === lead.opportunityId)
      if (!existing) return fail(404, 'Opportunity not found', 'RESOURCE_NOT_FOUND')
      return respond(ok({ lead, opportunity: existing }))
    }
    if (lead.status === 'DISQUALIFIED') {
      return fail(422, 'Lead desqualificado não vira oportunidade', 'BUSINESS_RULE_VIOLATION')
    }
    const opportunity: Opportunity = {
      id: uid('opp'),
      title: json.title || `Oportunidade ${lead.company || lead.name}`,
      accountId: uid('acc'),
      leadId: lead.id,
      ownerId: lead.ownerId,
      stage: 'QUALIFIED',
      amount: Number(json.amount ?? 0),
      sourceApp: sourceToApp(lead.source),
      lostReason: null,
      wonAt: null,
      lostAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    lead.status = 'CONVERTED'
    lead.opportunityId = opportunity.id
    lead.accountId = opportunity.accountId
    lead.updatedAt = nowIso()
    state.opportunities.unshift(opportunity)
    publish(state, {
      type: 'LeadQualificado',
      sourceApp: 'nexo',
      aggregateType: 'lead',
      aggregateId: lead.id,
      correlationId: lead.id,
      payload: { opportunityId: opportunity.id },
      idempotencyKey: `lead-qualificado-${lead.id}`,
    })
    publish(state, {
      type: 'OportunidadeCriada',
      sourceApp: 'nexo',
      aggregateType: 'opportunity',
      aggregateId: opportunity.id,
      correlationId: lead.id,
      payload: { title: opportunity.title, amount: opportunity.amount },
      idempotencyKey: `opp-criada-${opportunity.id}`,
    })
    save(state)
    return respond(ok({ lead, opportunity }))
  }

  const leadMatch = path.match(/\/leads\/([^/]+)$/)
  if (method === 'get' && leadMatch && !path.includes('opportunities')) {
    const lead = state.leads.find((item) => item.id === leadMatch[1])
    if (!lead) return fail(404, 'Lead not found', 'RESOURCE_NOT_FOUND')
    return respond(ok(lead))
  }

  if (method === 'get' && path.endsWith('/opportunities')) {
    const stage = params.get('stage')
    return respond(ok(state.opportunities.filter((item) => !stage || item.stage === stage)))
  }

  const stageMatch = path.match(/\/opportunities\/([^/]+)\/stage$/)
  if (method === 'patch' && stageMatch) {
    const opportunity = state.opportunities.find((item) => item.id === stageMatch[1])
    if (!opportunity) return fail(404, 'Opportunity not found', 'RESOURCE_NOT_FOUND')
    const to = json.stage as OpportunityStage
    if (opportunity.stage === to) return fail(422, 'A oportunidade já está neste estágio', 'BUSINESS_RULE_VIOLATION')
    if (opportunity.stage === 'WON' || opportunity.stage === 'LOST') {
      return fail(422, 'Oportunidade encerrada não muda de estágio', 'BUSINESS_RULE_VIOLATION')
    }
    if (to === 'WON' && opportunity.amount <= 0) {
      return fail(422, 'Ganho exige valor maior que zero para gerar o handoff ao VendaCore', 'BUSINESS_RULE_VIOLATION')
    }
    if (to === 'LOST' && String(json.lostReason ?? '').trim().length < 3) {
      return fail(422, 'Informe o motivo da perda (mínimo 3 caracteres)', 'BUSINESS_RULE_VIOLATION')
    }
    const from = opportunity.stage
    opportunity.stage = to
    opportunity.updatedAt = nowIso()
    if (to === 'WON') opportunity.wonAt = nowIso()
    if (to === 'LOST') {
      opportunity.lostAt = nowIso()
      opportunity.lostReason = json.lostReason
    }
    const correlationId = opportunity.leadId ?? opportunity.id
    publish(state, {
      type: 'EstagioAlterado',
      sourceApp: 'nexo',
      aggregateType: 'opportunity',
      aggregateId: opportunity.id,
      correlationId,
      payload: { from, to, actorId: actor.id },
    })
    if (to === 'PROPOSAL') {
      publish(state, {
        type: 'PropostaEnviada',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: opportunity.id,
        correlationId,
        payload: { amount: opportunity.amount },
      })
    }
    if (to === 'WON') {
      publish(state, {
        type: 'OportunidadeGanha',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: opportunity.id,
        correlationId,
        payload: {
          amount: opportunity.amount,
          handoff: { system: 'vendacore', action: 'criarClienteEOrcamento' },
        },
        idempotencyKey: `ganha-${opportunity.id}`,
      })
    }
    if (to === 'LOST') {
      publish(state, {
        type: 'OportunidadePerdida',
        sourceApp: 'nexo',
        aggregateType: 'opportunity',
        aggregateId: opportunity.id,
        correlationId,
        payload: { reason: json.lostReason },
        idempotencyKey: `perdida-${opportunity.id}`,
      })
    }
    save(state)
    return respond(ok(opportunity))
  }

  const oppMatch = path.match(/\/opportunities\/([^/]+)$/)
  if (method === 'get' && oppMatch) {
    const opportunity = state.opportunities.find((item) => item.id === oppMatch[1])
    if (!opportunity) return fail(404, 'Opportunity not found', 'RESOURCE_NOT_FOUND')
    const timeline = state.events
      .filter(
        (item) =>
          item.aggregateId === opportunity.id ||
          (opportunity.leadId && item.correlationId === opportunity.leadId),
      )
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
    return respond(ok({ opportunity, timeline }))
  }

  if (method === 'get' && path.endsWith('/events')) {
    const type = params.get('type')
    const sourceApp = params.get('sourceApp')
    const items = state.events.filter((item) => {
      if (type && item.type !== type) return false
      if (sourceApp && item.sourceApp !== sourceApp) return false
      return true
    })
    return respond(ok(items))
  }

  return fail(404, `Rota demo não mapeada: ${method.toUpperCase()} ${path}`, 'RESOURCE_NOT_FOUND')
}
