# 📏 Reglas de Desarrollo — SimCardio

## 1. Estructura de Archivos

### Convenciones de nombres
| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Páginas | `app/[ruta]/page.jsx` | `app/editor/page.jsx` |
| Layouts | `app/[ruta]/layout.jsx` | `app/monitor/layout.jsx` |
| API Routes | `app/api/[endpoint]/route.js` | `app/api/casos/route.js` |
| CSS Modules | `page.module.css` junto al componente | `app/editor/page.module.css` |
| Hooks | `use[Nombre].js` dentro de la carpeta de la página | `app/monitor/useEcg.js` |
| Librerías | `lib/[nombre].js` | `lib/redis.js` |

### Reglas clave
- **No crear archivos en la raíz** salvo configuración (`next.config.js`, `package.json`, etc.)
- **No usar carpetas `components/` globales** — cada página contiene sus propios componentes
- **Los hooks de página van junto a su `page.jsx`**, no en carpeta separada
- **`lib/` solo para utilidades compartidas** entre múltiples rutas

## 2. Componentes React

### Client vs Server Components
```jsx
// Server Component (default) — para contenido estático
export default function HomePage() { ... }

// Client Component — para interactividad, hooks, eventos
'use client';
export default function EditorPage() { ... }
```

**Regla:** Usar `'use client'` **solo cuando sea necesario** (hooks, eventos, estado).

### Patrones obligatorios
```jsx
// ✅ CORRECTO — Estado local + fetch
const [data, setData] = useState([]);
useEffect(() => {
    fetch('/api/casos').then(r => r.json()).then(setData);
}, []);

// ❌ INCORRECTO — No usar getServerSideProps, getStaticProps (son de Pages Router)
```

### Manejo de errores
```jsx
// ✅ Siempre envolver fetches en try/catch
try {
    const res = await fetch('/api/casos', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Error al guardar');
    showToast('Guardado correctamente', 'success');
} catch (err) {
    showToast('Error: ' + err.message, 'error');
}
```

## 3. Estilos CSS

### CSS Modules obligatorio
```jsx
// ✅ CORRECTO
import styles from './page.module.css';
<div className={styles.container}>

// ❌ INCORRECTO — No usar CSS inline ni className strings
<div style={{ color: 'red' }}>
<div className="container">
```

### Tokens del Design System
```css
/* ✅ CORRECTO — Usar variables CSS */
.card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    color: var(--text-primary);
}

/* ❌ INCORRECTO — No hardcodear colores */
.card {
    background: #0e1421;
    color: white;
}
```

### Convenciones CSS Modules
| Convención | Ejemplo |
|-----------|---------|
| camelCase para clases | `.stagesTable`, `.vitalBox` |
| Variantes con underscore | `.btn_primary`, `.chip_critical` |
| Animaciones con @keyframes local | `@keyframes pulse { ... }` |
| Media queries al final del archivo | `@media (max-width: 900px) { ... }` |

### Colores médicos
**Nunca inventar colores nuevos.** Usar los tokens existentes para cada signo vital:
- HR → `var(--red)` / `var(--red-dim)`
- NIBP → `var(--amber)` / `var(--amber-dim)`
- SpO₂ → `var(--cyan)`
- EtCO₂ → `var(--violet)`
- ECG → `#00ff00` (verde fósforo, solo en canvas)

## 4. API Routes

### Estructura estándar
```javascript
import { NextResponse } from 'next/server';
import { getCasos, saveCasos } from '@/lib/redis';

export async function GET() {
    try {
        const data = await getCasos();
        return NextResponse.json(data);
    } catch (err) {
        console.error('GET /api/ruta:', err);
        return NextResponse.json(
            { error: 'Mensaje para el usuario', detail: err.message },
            { status: 500 }
        );
    }
}
```

### Reglas de API
- **Siempre usar `NextResponse.json()`** — no `new Response()`
- **Siempre hacer try/catch** con log del error
- **Incluir `detail` en errores** para diagnóstico
- **Validar input** antes de procesar (tipo, forma, tamaño)
- **Import de lib con alias `@/`**: `import { ... } from '@/lib/redis'`

## 5. Base de Datos (Upstash Redis)

### Clave única
La app usa **una sola clave** en Redis:
```
simcardio:casos → JSON string (array de casos)
```

### Lectura/escritura vía fetch nativo
`lib/redis.js` NO usa la librería `@upstash/redis`. Usa **fetch directo** a la API REST de Upstash:
```javascript
await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(['SET', 'key', 'value']),
});
```

### Fallback automático
Si Redis no tiene datos o no hay credenciales:
1. Lee `casos.js` del directorio raíz
2. Si Redis está disponible pero vacío, auto-seed desde `casos.js`

## 6. Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Sí | URL de la base de datos Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token con permisos de lectura **y escritura** |

- Se definen en `.env.local` (local) y en Vercel Dashboard (producción)
- **Nunca commitear `.env.local`** — está en `.gitignore`
- El token debe tener **permisos completos** (no read-only)

## 7. Git & Despliegue

### Commits
```bash
# Formato de commits
feat: agregar nueva arritmia al monitor
fix: corregir guardado de etapas en editor
docs: actualizar documentación de API
refactor: mover lógica ECG a hook separado
```

### Despliegue
```bash
# Deploy a producción
vercel --prod

# El deploy es automático al hacer push a main
git push origin main
```

### Archivos que nunca se commitean
- `node_modules/`
- `.next/`
- `.env*.local`
- `.vercel/`
- `public/uploads/*`

## 8. Rendimiento

### Canvas ECG
- El motor ECG usa `requestAnimationFrame` — **nunca `setInterval`**
- El estado del canvas se maneja con `useRef`, no `useState` (evita re-renders)
- El resize del canvas se hace con `ResizeObserver` o `window.resize`

### Fetching
- **No usar `useSWR` ni `React Query`** por ahora — fetch simple es suficiente
- El editor usa `defaultValue` + `onBlur` en inputs de tabla para evitar re-renders por keystroke

### Imágenes
- Las subidas van a `public/uploads/` (local) o `/tmp/` (Vercel)
- Formato aceptado: `image/*`
- Sin procesamiento server-side (se guarda tal cual)
