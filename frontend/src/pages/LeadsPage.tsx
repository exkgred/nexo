import { FormEvent, useEffect, useState } from 'react'
import { api, errorMessage, unwrap } from '@/lib/api'
import { SOURCE_LABEL, STATUS_LABEL } from '@/lib/brand'
import type { Envelope, Lead, LeadSource, QualifyResult } from '@/lib/types'
import { Link } from 'react-router-dom'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'MANUAL' as LeadSource })

  async function load() {
    try {
      const { data } = await api.get<Envelope<Lead[]>>('/leads')
      setLeads(unwrap(data))
    } catch {
      setError('Não foi possível listar leads')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/leads', form)
      setForm({ name: '', email: '', phone: '', company: '', source: 'MANUAL' })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function qualify(id: string) {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<Envelope<QualifyResult>>(`/leads/${id}/qualify`, { amount: 8000 })
      unwrap(data)
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
        <h1 className="text-2xl font-semibold text-ink-300">Leads</h1>
        <p className="mt-1 text-sm text-ink-500">Captura manual ou via eventos do Discador e do chat.</p>
      </header>

      <form onSubmit={onCreate} className="grid gap-3 rounded-2xl border border-white/10 bg-ink-900/60 p-4 md:grid-cols-6">
        <input
          required
          placeholder="Nome"
          className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm outline-none focus:border-accent md:col-span-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="E-mail"
          className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm outline-none focus:border-accent"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Telefone"
          className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm outline-none focus:border-accent"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Empresa"
          className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm outline-none focus:border-accent"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-ink-950 hover:bg-accent-hover disabled:opacity-60"
        >
          Capturar
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-900 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-white/5 bg-ink-900/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-300">{lead.name}</p>
                  <p className="text-xs text-ink-500">{lead.company || lead.email || lead.phone}</p>
                </td>
                <td className="px-4 py-3 text-ink-500">{SOURCE_LABEL[lead.source]}</td>
                <td className="px-4 py-3 text-ink-500">{STATUS_LABEL[lead.status]}</td>
                <td className="px-4 py-3 text-right">
                  {lead.status === 'NEW' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void qualify(lead.id)}
                      className="rounded-md bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/25"
                    >
                      Qualificar
                    </button>
                  ) : lead.opportunityId ? (
                    <Link to={`/pipeline/${lead.opportunityId}`} className="text-xs text-accent hover:underline">
                      ver oportunidade
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
