# Nexo

CRM + bus de eventos da suíte. Lead entra pelo Discador ou pelo chat, vira oportunidade, ganha — e o handoff aponta para o VendaCore. A linha do tempo mostra o caminho entre os sistemas.

Backend em NestJS (Clean Architecture), frontend em React + Vite, PostgreSQL e Prisma.

---

## O que o produto faz

- Captura de leads (manual, Discador, chat, Smarty)
- Qualificação: cria conta + oportunidade em `QUALIFIED`
- Pipeline: Novo → Qualificado → Proposta → Negociação → Ganho / Perdido
- Ganho exige valor > 0 e publica `OportunidadeGanha` com handoff `{ system: vendacore, action: criarClienteEOrcamento }`
- Bus (outbox): cada ação vira evento; `POST /events/ingest` recebe o que os outros apps emitiriam
- Demo na Vercel com API mockada no `localStorage`

Fluxo contado no recrutamento:

```text
Discador / Chat
  → LeadCapturado
    → Qualificar (Nexo)
      → PropostaEnviada
        → OportunidadeGanha
          → PedidoFaturado (VendaCore)
```

---

## Arquitetura

```text
Controller (presentation)
  → Use Case (application)
    → Port / repository (domain)
      → Prisma repository (infrastructure)
EventBus = outbox (grava DomainEvent e marca PUBLISHED)
```

---

## Tecnologias

- **Backend:** Node.js 20, NestJS 10, TypeScript strict, Prisma, PostgreSQL 16, Passport JWT, Jest
- **Frontend:** React 18, Vite, Tailwind, Zustand, Axios
- **Demo:** Vercel estática com `VITE_DEMO=true`

---

## Como rodar

Pré-requisitos: Node.js ≥ 20, Docker Compose, npm.

### 1. Postgres

Na raiz `nexo/`:

```bash
docker compose up -d postgres
```

Porta **5437**.

### 2. Backend (porta 3004)

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

- API: http://localhost:3004/api/v1
- Health: http://localhost:3004/api/v1/health
- Swagger: http://localhost:3004/api/docs

### 3. Frontend (porta 5175)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:5175

### Contas seed

| Email | Senha | Papel |
|-------|-------|-------|
| ana@nexo.dev | password123 | SELLER |
| manager@nexo.dev | password123 | MANAGER |
| admin@nexo.dev | password123 | ADMIN |

Ingest de eventos: header `x-ingest-secret: nexo-ingest-dev`.

## Demo na Vercel (estática)

O frontend sobe sozinho, sem Nest/Postgres. Com `VITE_DEMO=true` o Axios usa um adapter no navegador (leads, pipeline, ingest e outbox no `localStorage`).

1. No [Vercel](https://vercel.com/new) importe `exkgred/nexo`
2. **Root Directory:** deixe a raiz (o `vercel.json` da raiz já builda `frontend`)
3. Framework: Vite · o build gera `dist`
4. Variável: `VITE_DEMO=true` (já vem em `frontend/.env.production`)

Login da demo: `ana@nexo.dev` / `password123`.

## Testes

```bash
cd backend
npm test
npm run test:cov
npm run lint
```
