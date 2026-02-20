# 🔌 API Reference — SimCardio

Base URL:
- **Local:** `http://localhost:3001`
- **Producción:** `https://sim-cardio.vercel.app`

---

## GET /api/casos

Obtiene todos los casos clínicos.

**Request:**
```
GET /api/casos
```

**Response (200):**
```json
[
    {
        "paciente": "Descripción del paciente...",
        "etapas": [
            {
                "infoAdicional": "Descripción de la etapa",
                "hr": "75",
                "bp": "120/80",
                "spo2": "98",
                "capno": "35",
                "glucose": "110",
                "ritmo": "RITMO_SINUSAL",
                "ekg12d": "/uploads/imagen.png"
            }
        ]
    }
]
```

**Response (500):**
```json
{
    "error": "Error al leer casos",
    "detail": "Mensaje técnico del error"
}
```

---

## POST /api/casos

Guarda todos los casos clínicos (reemplaza el contenido completo).

**Request:**
```
POST /api/casos
Content-Type: application/json

[
    {
        "paciente": "Descripción...",
        "etapas": [...]
    }
]
```

**Response (200):**
```json
{
    "success": true,
    "count": 6
}
```

**Response (400):**
```json
{
    "error": "Se esperaba un array de casos"
}
```

**Response (500):**
```json
{
    "error": "Error al guardar casos",
    "detail": "Redis write failed: ..."
}
```

---

## POST /api/upload

Sube una imagen de EKG 12 derivaciones.

**Request:**
```
POST /api/upload
Content-Type: multipart/form-data

campo: ekgImage (archivo de imagen)
```

**Response (200):**
```json
{
    "success": true,
    "filePath": "/uploads/1708444800000-imagen.png"
}
```

**Notas:**
- En desarrollo local, se guarda en `public/uploads/`
- En Vercel, se guarda en `/tmp/` (efímero)

---

## GET /api/status

Health check del sistema.

**Request:**
```
GET /api/status
```

**Response (200):**
```json
{
    "storage": "upstash-redis",
    "framework": "nextjs",
    "timestamp": "2026-02-20T18:53:34.626Z"
}
```

**Valores posibles de `storage`:**
| Valor | Significado |
|-------|-------------|
| `upstash-redis` | Conectado a Redis correctamente |
| `local-fallback` | Sin credenciales, usando `casos.js` |

---

## Modelo de Datos

### Caso Clínico
```typescript
{
    paciente: string,       // Descripción del paciente
    etapas: Etapa[]         // Array de etapas del caso
}
```

### Etapa
```typescript
{
    infoAdicional: string,  // Descripción clínica de la etapa
    hr:            string,  // Frecuencia cardíaca (bpm)
    bp:            string,  // Presión arterial (ej: "120/80")
    spo2:          string,  // Saturación de oxígeno (%)
    capno:         string,  // EtCO₂ (mmHg)
    glucose:       string,  // Glucosa (mg/dL)
    ritmo:         string,  // Tipo de ritmo ECG (ver tabla)
    ekg12d:        string   // Ruta a imagen de EKG 12D (opcional)
}
```

### Ritmos ECG soportados
| Valor | Nombre |
|-------|--------|
| `RITMO_SINUSAL` | Ritmo Sinusal |
| `BRADICARDIA_SINUSAL` | Bradicardia Sinusal |
| `TAQUICARDIA_SUPRAVENTRICULAR` | Taquicardia Supraventricular |
| `FIBRILACION_AURICULAR` | Fibrilación Auricular |
| `BLOQUEO_AV_GRADO_1` | Bloqueo AV de 1er Grado |
| `BLOQUEO_AV_2_MOBITZ_1` | Bloqueo AV Mobitz I (Wenckebach) |
| `TAQUICARDIA_VENTRICULAR` | Taquicardia Ventricular |
| `FIBRILACION_VENTRICULAR` | Fibrilación Ventricular |
| `ASISTOLIA` | Asistolia |
| `INFARTO_AGUDO_MIOCARDIO` | Infarto Agudo de Miocardio |
