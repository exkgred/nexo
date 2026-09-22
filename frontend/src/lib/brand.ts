import type { EventType, LeadSource, LeadStatus, OpportunityStage, UserRole } from './types'

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SELLER: 'Vendedor',
}

export const STAGE_LABEL: Record<OpportunityStage, string> = {
  NEW: 'Novo',
  QUALIFIED: 'Qualificado',
  PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
}

export const OPEN_STAGES: OpportunityStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION']

export const SOURCE_LABEL: Record<LeadSource, string> = {
  DISCADOR: 'Discador',
  CHAT: 'Chat',
  MANUAL: 'Manual',
  SMARTY: 'Smarty',
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'Novo',
  QUALIFIED: 'Qualificado',
  CONVERTED: 'Convertido',
  DISQUALIFIED: 'Desqualificado',
}

export const EVENT_LABEL: Record<EventType, string> = {
  LeadCapturado: 'Lead capturado',
  LeadQualificado: 'Lead qualificado',
  OportunidadeCriada: 'Oportunidade criada',
  EstagioAlterado: 'Estágio alterado',
  PropostaEnviada: 'Proposta enviada',
  OportunidadeGanha: 'Ganho → VendaCore',
  OportunidadePerdida: 'Perdida',
  PedidoFaturado: 'Pedido faturado',
  ChamadaEncerrada: 'Chamada encerrada',
  TicketAberto: 'Ticket aberto',
}

export const APP_LABEL: Record<string, string> = {
  nexo: 'Nexo',
  discador: 'Discador',
  chat: 'Chat',
  vendacore: 'VendaCore',
  smarty: 'Smarty',
  kanban: 'Kanban',
}

export function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

export function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(1, Math.round(delta / 60_000))
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.round(hours / 24)
  return `há ${days} d`
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}
