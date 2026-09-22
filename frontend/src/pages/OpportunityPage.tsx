import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage, unwrap } from '@/lib/api'
import { APP_LABEL, EVENT_LABEL, money, OPEN_STAGES, STAGE_LABEL, timeAgo } from '@/lib/brand'
import type { Envelope, Opportunity, OpportunityDetail, OpportunityStage } from '@/lib/types'

export default function OpportunityPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState<OpportunityDetail | null>(null)
  const [error, setError] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!id) return
    const { data } = await api.get<Envelope<OpportunityDetail>>(`/opportunities/${id}`)
    setDetail(unwrap(data))
  }

  useEffect(() => {
    load().catch(() => setError('Oportunidade não encontrada'))
  }, [id])

  async function move(stage: OpportunityStage, extra?: { lostReason?: string }) {
    if (!id) return
    setBusy(true)
    setError('')
    try {
      await api.patch<Envelope<Opportunity>>(`/opportunities/${id}/stage`, { stage, ...extra })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onLose(event: FormEvent) {
    event.preventDefault()
    await move('LOST', { lostReason })
  }

  if (!detail) return <p className="text-ink-500">{error || 'Carregando…'}</p>
  const { opportunity, timeline } = detail
  const closed = opportunity.stage === 'WON' || opportunity.stage === 'LOST'

  return (
    <div className="space-y-6">
      <Link to="/pipeline" className="text-xs text-accent hover:underline">
        ← pipeline
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">{STAGE_LABEL[opportunity.stage]}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-300">{opportunity.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {money(opportunity.amount)} · origem {APP_LABEL[opportunity.sourceApp] ?? opportunity.sourceApp}
          </p>
        </div>
        {opportunity.stage === 'WON' && (
          <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            Handoff: criar cliente e orçamento no VendaCore
          </div>
        )}
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!closed && (
        <div className="flex flex-wrap gap-2">
          {OPEN_STAGES.filter((stage) => stage !== opportunity.stage).map((stage) => (
            <button
              key={stage}
              type="button"
              disabled={busy}
              onClick={() => void move(stage)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-300 hover:border-accent/40 hover:text-accent"
            >
              Mover para {STAGE_LABEL[stage]}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void move('WON')}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-accent-hover"
          >
            Marcar ganho
          </button>
        </div>
      )}

      {!closed && (
        <form onSubmit={onLose} className="flex max-w-lg gap-2">
          <input
            required
            minLength={3}
            placeholder="Motivo da perda"
            className="flex-1 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm outline-none focus:border-accent"
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10"
          >
            Perder
          </button>
        </form>
      )}

      <section className="rounded-2xl border border-white/10 bg-ink-900/50 p-5">
        <h2 className="mb-4 font-medium text-ink-300">Jornada</h2>
        <ol className="space-y-4 border-l border-white/10 pl-4">
          {timeline.map((item) => (
            <li key={item.id}>
              <p className="text-sm text-ink-300">{EVENT_LABEL[item.type]}</p>
              <p className="text-xs text-ink-500">
                {APP_LABEL[item.sourceApp] ?? item.sourceApp} · {timeAgo(item.occurredAt)} · {item.status}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
