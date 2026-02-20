# 🚀 Despliegue — SimCardio

## Plataforma

SimCardio se despliega en **Vercel** con las siguientes características:
- **Framework:** Next.js (detectado automáticamente)
- **Region:** Automática (edge más cercano)
- **Base de datos:** Upstash Redis (REST API)

## Variables de Entorno

### Requeridas
| Variable | Descripción | Dónde se configura |
|----------|-------------|--------------------|
| `UPSTASH_REDIS_REST_URL` | URL de la instancia Redis | Vercel Dashboard + `.env.local` |
| `UPSTASH_REDIS_REST_TOKEN` | Token con permisos R/W | Vercel Dashboard + `.env.local` |

### Configurar en Vercel Dashboard
1. Ir a [vercel.com](https://vercel.com) → Proyecto `sim-cardio`
2. **Settings → Environment Variables**
3. Agregar ambas variables para los 3 entornos: `Production`, `Preview`, `Development`

### Configurar localmente
Crear archivo `.env.local` en la raíz:
```bash
UPSTASH_REDIS_REST_URL="https://tu-instancia.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-token-con-permisos-rw"
```

> ⚠️ **IMPORTANTE:** El token debe tener permisos de escritura (`SET`). Un token read-only causará error `NOPERM` al guardar.

## Upstash Redis

### Consola
- URL: [console.upstash.com](https://console.upstash.com)
- Base de datos: `fair-gazelle-26347`
- Clave principal: `simcardio:casos`

### Verificar permisos del token
```bash
# Probar escritura
curl -X POST "https://fair-gazelle-26347.upstash.io/set/test/ok" \
  -H "Authorization: Bearer TU_TOKEN"

# Respuesta esperada: {"result":"OK"}
# Si falla: {"error":"NOPERM..."} → token sin permisos de escritura
```

### Seed inicial
Si la base de datos está vacía, el sistema **auto-seed** desde `casos.js` la primera vez que se hace GET a `/api/casos`.

Para hacer seed manual:
```bash
# Verificar estado actual
curl https://sim-cardio.vercel.app/api/status
# → {"storage":"upstash-redis","framework":"nextjs",...}

# Verificar datos
curl https://sim-cardio.vercel.app/api/casos | jq length
# → 6
```

## Comandos de Despliegue

```bash
# Deploy a producción
vercel --prod

# Deploy de preview (rama actual)
vercel

# Ver logs en tiempo real
vercel logs sim-cardio.vercel.app --follow
```

## vercel.json

```json
{
    "version": 2,
    "framework": "nextjs",
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                { "key": "X-Content-Type-Options", "value": "nosniff" },
                { "key": "X-Frame-Options", "value": "DENY" }
            ]
        }
    ]
}
```

## Troubleshooting

### `/api/casos` devuelve `[]`
1. Verificar que Redis tenga datos: `curl /api/status` → `"storage": "upstash-redis"`
2. Si `storage` es `"local-fallback"` → faltan credenciales en las env vars
3. Si `storage` es correcto pero vacío → la clave `simcardio:casos` es null, se auto-seed al próximo GET

### Error `NOPERM` al guardar
El token de Upstash no tiene permisos de escritura. Ir a Upstash Console → copiar el token principal (no el read-only) → actualizar en Vercel y `.env.local`.

### Build falla en Vercel
```bash
# Probar build local primero
npm run build

# Si falla, limpiar caché
rm -rf .next
npm run build
```
