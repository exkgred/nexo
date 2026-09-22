import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Phone, Sparkles } from 'lucide-react'
import { api, unwrap } from '@/lib/api'
import { EVENT_LABEL, APP_LABEL, money, percent, timeAgo } from '@/lib/brand'
import type { DashboardKpis, Envelope } from '@/lib/types'

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Envelope<DashboardKpis>>('/dashboard')
      .then(({ data }) => setKpis(unwrap(data)))
      .catch(() => setError('Não foi possível carregar o painel'))
  }, [])

  if (error) return <p className="text-red-400">{error}</p>
  if (!kpis) return <p className="text-ink-500">Carregando funil…</p>

  const cards = [
    { label: 'Pipeline aberto', value: money(kpis.openAmount), hint: `${kpis.openCount} oportunidades` },
    { label: 'Ganho', value: money(kpis.wonAmount), hint: `${kpis.wonCount} handoffs ao VendaCore` },
    { label: 'Leads novos', value: String(kpis.newLeads), hint: 'aguardando qualificação' },
    { label: 'Conversão', value: percent(kpis.conversionRate), hint: 'leads → oportunidade' },
  ]

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-accent">Jornada</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-300">O fluxo da suíte, num só lugar</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          Discador e chat capturam. O Nexo qualifica e move o funil. Ganho dispara o handoff para o
          VendaCore — e o pedido faturado volta para esta linha do tempo.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-ink-900/70 p-4">
            <p className="text-xs text-ink-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink-300">{card.value}</p>
            <p className="mt-1 text-xs text-ink-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-ink-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-ink-300">Últimos eventos do bus</h2>
            <Link to="/timeline" className="text-xs text-accent hover:underline">
              ver todos
            </Link>
          </div>
          <ul className="space-y-3">
            {kpis.recentEvents.slice(0, 8).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="text-ink-300">{EVENT_LABEL[item.type]}</p>
                  <p className="text-xs text-ink-500">
                    {APP_LABEL[item.sourceApp] ?? item.sourceApp} · {item.status.toLowerCase()}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-500">{timeAgo(item.occurredAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <Link
            to="/pipeline"
            className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/10 px-5 py-4 hover:bg-accent/15"
          >
            <div>
              <p className="flex items-center gap-2 font-medium text-accent">
                <Sparkles size={16} /> Abrir o pipeline
              </p>
              <p className="mt-1 text-xs text-ink-500">Arraste o olhar: proposta ACME está esperando.</p>
            </div>
            <ArrowRight size={18} className="text-accent" />
          </Link>
          <Link
            to="/timeline"
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-900/70 px-5 py-4 hover:border-white/20"
          >
            <div>
              <p className="flex items-center gap-2 font-medium text-ink-300">
                <Phone size={16} /> Simular Discador / Chat / ERP
              </p>
              <p className="mt-1 text-xs text-ink-500">Injeta eventos no bus como se os outros apps falassem.</p>
            </div>
            <ArrowRight size={18} className="text-ink-500" />
          </Link>
        </div>
      </section>
    </div>
  )
}
