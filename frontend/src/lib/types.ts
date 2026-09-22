export type UserRole = 'ADMIN' | 'MANAGER' | 'SELLER'
export type LeadSource = 'DISCADOR' | 'CHAT' | 'MANUAL' | 'SMARTY'
export type LeadStatus = 'NEW' | 'QUALIFIED' | 'CONVERTED' | 'DISQUALIFIED'
export type OpportunityStage =
  | 'NEW'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
export type EventType =
  | 'LeadCapturado'
  | 'LeadQualificado'
  | 'OportunidadeCriada'
  | 'EstagioAlterado'
  | 'PropostaEnviada'
  | 'OportunidadeGanha'
  | 'OportunidadePerdida'
  | 'PedidoFaturado'
  | 'ChamadaEncerrada'
  | 'TicketAberto'
export type EventStatus = 'RECEIVED' | 'PROCESSED' | 'PUBLISHED' | 'FAILED'

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  source: LeadSource
  status: LeadStatus
  notes: string | null
  ownerId: string
  accountId: string | null
  opportunityId: string | null
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: string
  title: string
  accountId: string
  leadId: string | null
  ownerId: string
  stage: OpportunityStage
  amount: number
  sourceApp: string
  lostReason: string | null
  wonAt: string | null
  lostAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DomainEvent {
  id: string
  type: EventType
  sourceApp: string
  aggregateType: string
  aggregateId: string
  correlationId: string
  idempotencyKey: string
  payload: Record<string, unknown>
  status: EventStatus
  occurredAt: string
  publishedAt: string | null
}

export interface OpportunityDetail {
  opportunity: Opportunity
  timeline: DomainEvent[]
}

export interface QualifyResult {
  lead: Lead
  opportunity: Opportunity
}

export interface DashboardKpis {
  openAmount: number
  wonAmount: number
  openCount: number
  wonCount: number
  newLeads: number
  conversionRate: number
  byStage: Record<string, { count: number; amount: number }>
  recentEvents: DomainEvent[]
}

export interface Envelope<T> {
  success: boolean
  data: T
  meta?: {
    timestamp?: string
    page?: number
    perPage?: number
    total?: number
    lastPage?: number
  }
  error?: { code: string; message: string }
}
