import { useEffect, useState } from 'react'
import { api, errorMessage, unwrap } from '@/lib/api'
import { APP_LABEL, EVENT_LABEL, timeAgo } from '@/lib/brand'
import type { DomainEvent, Envelope, EventType } from '@/lib/types'

const SIMULATIONS: Array<{
  label: string
  hint: string
  body: { type: EventType; sourceApp: string; payload: Record<string, unknown> }
}> = [
  {
    label: 'Discador: chamada encerrada',
    hint: 'Cria lead da Marina (Studio Pixel)',
    body: {
      type: 'ChamadaEncerrada',
      sourceApp: 'discador',
      payload: {
        name: 'Marina Alves',
        email: 'marina@pixel.test',
        phone: '41977770004',
        company: 'Studio Pixel',
        outcome: 'INTERESSADO',
      },
    },
  },
  {
    label: 'Chat: lead capturado',
    hint: 'Visitante perguntou no chatbot',
    body: {
      type: 'LeadCapturado',
      sourceApp: 'chat',
      payload: { name: 'Rafael Nunes', email: 'rafael@nunes.test', notes: 'Quis ver o ERP' },
    },
  },
  {
    label: 'VendaCore: pedido faturado',
    hint: 'Fecha a jornada da Loja Norte',
    body: {
      type: 'PedidoFaturado',
      sourceApp: 'vendacore',
      payload: { amount: 42000, accountEmail: 'compras@lojanorte.test' },
    },
  },
]

export default function TimelinePage() {
  const [events, setEvents] = useState<DomainEvent[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await api.get<Envelope<DomainEvent[]>>('/events')
    setEvents(unwrap(data))
  }

  useEffect(() => {
    load().catch(() => setError('Não foi possível carregar o bus'))
  }, [])

  async function ingest(index: number) {
    setBusy(true)
    setError('')
    try {
      const sim = SIMULATIONS[index]
      await api.post('/events/ingest', {
        ...sim.body,
        idempotencyKey: `${sim.body.type}-${Date.now()}`,
      })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-300">Bus de eventos</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          Outbox da suíte. Cada ação do CRM publica um evento; Discador, chat e VendaCore entram pelo ingest.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {SIMULATIONS.map((sim, index) => (
          <button
            key={sim.label}
            type="button"
            disabled={busy}
            onClick={() => void ingest(index)}
            className="rounded-2xl border border-white/10 bg-ink-900/60 p-4 text-left hover:border-accent/40 disabled:opacity-60"
          >
            <p className="text-sm font-medium text-ink-300">{sim.label}</p>
            <p className="mt-1 text-xs text-ink-500">{sim.hint}</p>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <ol className="space-y-3">
        {events.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-ink-900/50 px-4 py-3"
          >
            <div>
              <p className="text-sm text-ink-300">{EVENT_LABEL[item.type]}</p>
              <p className="text-xs text-ink-500">
                {APP_LABEL[item.sourceApp] ?? item.sourceApp} · {item.aggregateType}:{item.aggregateId.slice(0, 8)} ·{' '}
                {item.status}
              </p>
            </div>
            <span className="text-xs text-ink-500">{timeAgo(item.occurredAt)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
