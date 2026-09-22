import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, unwrap } from '@/lib/api'
import { APP_LABEL, money, OPEN_STAGES, STAGE_LABEL } from '@/lib/brand'
import type { Envelope, Opportunity, OpportunityStage } from '@/lib/types'

const COLUMNS: OpportunityStage[] = [...OPEN_STAGES, 'WON', 'LOST']

export default function PipelinePage() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Envelope<Opportunity[]>>('/opportunities')
      .then(({ data }) => setItems(unwrap(data)))
      .catch(() => setError('Não foi possível carregar o pipeline'))
  }, [])

  const grouped = useMemo(
    () => COLUMNS.map((stage) => ({ stage, cards: items.filter((item) => item.stage === stage) })),
    [items],
  )

  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink-300">Pipeline</h1>
        <p className="mt-1 text-sm text-ink-500">
          Novo → qualificado → proposta → negociação → ganho (handoff VendaCore) ou perdido.
        </p>
      </header>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {grouped.map((column) => (
          <section
            key={column.stage}
            className="w-64 shrink-0 rounded-2xl border border-white/10 bg-ink-900/40 p-3"
          >
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-ink-500">
              <span>{STAGE_LABEL[column.stage]}</span>
              <span>{column.cards.length}</span>
            </div>
            <div className="space-y-2">
              {column.cards.map((card) => (
                <Link
                  key={card.id}
                  to={`/pipeline/${card.id}`}
                  className="block rounded-xl border border-white/10 bg-ink-800 p-3 hover:border-accent/40"
                >
                  <p className="text-sm font-medium text-ink-300">{card.title}</p>
                  <p className="mt-1 text-xs text-accent">{money(card.amount)}</p>
                  <p className="mt-1 text-[11px] text-ink-500">
                    origem {APP_LABEL[card.sourceApp] ?? card.sourceApp}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
