# UPAO Voto Informado — Segunda Vuelta 2026

Webapp interactiva para estudiantes de la Universidad Privada Antenor Orrego (UPAO, Trujillo) sobre la Segunda Vuelta Electoral 2026 entre Keiko Fujimori (Fuerza Popular) y Roberto Sánchez (Juntos por el Perú).

## Características

- Registro vía OAuth (Google + Microsoft + email/password)
- Cuestionario estructurado sobre política nacional
- Comparador lado a lado de planes de gobierno oficiales (datos del JNE)
- Dashboard analítico para el docente

## Stack

Next.js 16.2 LTS · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Supabase · Vercel.

Detalle completo en [CLAUDE.md](./CLAUDE.md).

## Setup

Prerrequisitos:
- Node.js 22+
- pnpm v11 (obligatorio)
- uv (para Spec Kit)
- Cuenta de Supabase, Vercel, Upstash, Cloudflare

```powershell
pnpm install
cp .env.example .env.local
# completar SUPABASE_URL, SUPABASE_ANON_KEY, etc.
pnpm dev
```

## Workflow Spec Kit

```
/speckit-constitution   Principios (ya inicializado)
/speckit-specify        Spec funcional
/speckit-plan           Plan técnico
/speckit-tasks          Backlog
/speckit-implement      Implementación
```

## Data JNE

Ver [data/jne/README.md](./data/jne/README.md) para el detalle del scraping inicial y los endpoints oficiales del JNE.

## Ética

La aplicación no emite recomendaciones de voto. Muestra datos oficiales del JNE con tratamiento simétrico de ambos candidatos. Cumple Ley 29733 (Protección de Datos Personales, Perú).
