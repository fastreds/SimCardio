# 🏗️ Arquitectura — SimCardio

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Estilos | CSS Modules + CSS Custom Properties | — |
| Base de datos | Upstash Redis (REST API) | — |
| Hosting | Vercel | — |
| Lenguaje | JavaScript (ESM en app/, CJS compatible) | ES2022 |

## Estructura del Proyecto

```
SimCardio/
├── app/                        ← Next.js App Router
│   ├── layout.jsx                  Root layout (metadata, fuentes, CSS global)
│   ├── globals.css                 Design system (tokens, reset, tipografía)
│   ├── page.jsx                    Home — menú principal
│   ├── page.module.css
│   │
│   ├── editor/                     /editor — CRUD de casos clínicos
│   │   ├── page.jsx                    Componente client-side ('use client')
│   │   └── page.module.css
│   │
│   ├── monitor/                    /monitor — simulador de signos vitales
│   │   ├── page.jsx                    Componente client-side
│   │   ├── page.module.css
│   │   ├── useEcg.js                  Hook del motor ECG (Canvas 2D)
│   │   └── layout.jsx                 Layout con metadata
│   │
│   └── api/                        API Routes (serverless)
│       ├── casos/route.js              GET / POST — datos de casos clínicos
│       ├── upload/route.js             POST — subida de imágenes EKG
│       └── status/route.js             GET — health check
│
├── lib/
│   └── redis.js                ← Cliente Upstash REST API (fetch nativo)
│
├── public/
│   └── uploads/                ← Imágenes EKG subidas (dev local)
│
├── casos.js                    ← Datos seed / fallback para desarrollo
├── docs/                       ← Esta documentación
│
├── next.config.js              ← Config Next.js
├── jsconfig.json               ← Alias @ → raíz del proyecto
├── vercel.json                 ← Config Vercel (headers, funciones)
├── package.json
└── .env.local                  ← Variables de entorno (no versionado)
```

## Flujo de Datos

```
┌─────────┐     fetch()      ┌──────────────┐     REST API     ┌─────────────┐
│ Browser │ ───────────────► │ API Routes   │ ────────────────► │   Upstash   │
│ (React) │ ◄─────────────── │ (Next.js)    │ ◄──────────────── │   Redis     │
└─────────┘    JSON response  └──────────────┘   JSON response   └─────────────┘
                                     │
                                     │  fallback (si Redis vacío)
                                     ▼
                              ┌──────────────┐
                              │  casos.js    │
                              │  (archivo)   │
                              └──────────────┘
```

### Flujo GET /api/casos
1. El API Route llama `getCasos()` en `lib/redis.js`
2. Se envía `GET simcardio:casos` a Upstash via REST
3. Si el resultado es `null`, auto-seed desde `casos.js` (solo la primera vez)
4. Se devuelve el array JSON al cliente

### Flujo POST /api/casos
1. El editor envía el array completo de casos vía `POST`
2. El API Route valida que sea un array
3. Se envía `SET simcardio:casos <json>` a Upstash
4. Respuesta `{ success: true, count: N }`

## Páginas y Componentes

### `/` — Home
- **Tipo:** Server Component
- **Función:** Menú de navegación con tarjetas animadas
- **Datos:** Estáticos (array `MENU_ITEMS`)

### `/editor` — Editor de Casos
- **Tipo:** Client Component (`'use client'`)
- **Función:** CRUD completo de casos clínicos y sus etapas
- **Datos:** Fetch a `/api/casos` (GET al cargar, POST al guardar)
- **Features:** Toast notifications, modal de confirmación, Ctrl+S para guardar

### `/monitor` — Monitor de Signos Vitales
- **Tipo:** Client Component (`'use client'`)
- **Función:** Simulación en tiempo real de un monitor médico
- **Datos:** Fetch a `/api/casos` al montar
- **Features:** ECG Canvas animado, cronómetro, pantalla completa, modal EKG 12D

## Design System

Definido en `app/globals.css` con CSS Custom Properties:

```css
:root {
    --bg-base:       #080c14;      /* Fondo principal */
    --bg-surface:    #0e1421;      /* Paneles y tarjetas */
    --bg-elevated:   #151d2e;      /* Inputs y elementos elevados */
    --accent:        #3b82f6;      /* Azul primario */
    --green:         #22c55e;      /* Signos vitales OK */
    --red:           #ef4444;      /* HR / alertas */
    --amber:         #f59e0b;      /* NIBP / warnings */
    --cyan:          #06b6d4;      /* SpO2 */
    --text-primary:  #e2e8f0;      /* Texto principal */
    --font-mono:     'Share Tech Mono', monospace;
}
```

### Convención de colores médicos
| Color | Variable | Uso clínico |
|-------|----------|-------------|
| 🔴 Rojo | `--red` | Frecuencia cardíaca (HR) |
| 🟡 Ámbar | `--amber` | Presión arterial (NIBP) |
| 🔵 Cyan | `--cyan` | Saturación de oxígeno (SpO₂) |
| 🟣 Violeta | `--violet` | EtCO₂ |
| 🟢 Verde | `--green` | ECG, glucosa, indicadores OK |
| 🔵 Azul | `--accent` | UI (botones, links, focus) |
