# ❤️ Simulación de Signos Vitales — useVitals

## Ubicación

```
app/monitor/useVitals.js
```

## Propósito

El hook `useVitals` simula variaciones fisiológicas **realistas** de los signos vitales 
durante una sesión de entrenamiento. Cada signo vital tiene su propia frecuencia de 
actualización y rango de variación basados en práctica clínica real.

## Reglas fisiológicas implementadas

| Signo vital | Intervalo de cambio | Variación máxima | Rango válido |
|------------|-------------------|-----------------|-------------|
| **HR** (Frec. cardíaca) | Cada 4 seg | ±2 bpm | 20–300 bpm |
| **SpO₂** (Saturación) | Cada 10 seg | ±1% | 0–100% |
| **NIBP** (Presión arterial) | Cada 5 min | ±8/4 mmHg | Sys≥60, Dia≥30 |
| **RESP** (Respiración) | Cada 10 seg | ±1 rpm | 0–80 rpm |
| **EtCO₂** (Capnografía) | Cada 7 seg | ±2 mmHg | 0–80 mmHg |
| **Glucosa** | Cada 10 min | ±1 mg/dL | 20–600 mg/dL |

## Garantías de seguridad

- **Nunca valores negativos**: cada signo tiene un mínimo clamp (ej. SpO₂ mín=0%)
- **Nunca valores imposibles**: máximos fisiológicos clampeados (HR máx=300, SpO₂ máx=100%)
- **NIBP coherente**: siempre diastólica < sistólica (diff mínima 20 mmHg)
- **Glucosa estable**: no varía en 10 minutos, refleja la realidad clínica

## API del hook

```typescript
useVitals(): {
    display: {
        hr:      string,   // "75" | "—"
        bp:      string,   // "120/80" | "—/—"
        spo2:    string,   // "98" | "—"
        capno:   string,   // "35" | "—"
        glucose: string,   // "110" | "—"
    },
    setTarget: (target: VitalTarget) => void,
    stop:      () => void,
}
```

### `setTarget(target)`
Inicializa los valores desde una etapa del caso clínico. Activa la simulación.

```javascript
setTarget({
    hr:      '75',
    bp:      '120/80',
    spo2:    '98',
    capno:   '35',
    glucose: '110',
});
```

- Si un valor es vacío o no numérico → se muestra `'—'`
- Los valores se toman como base y se aplica drift paulatino

### `stop()`
Detiene la simulación y resetea todos los signos a `'—'`.

## Flujo interno

```
setTarget(etapa)
    │
    ▼
initFromTarget()   ← Parsea strings, clampea al rango válido
    │
    ▼
tick() cada 1 seg  ← setInterval
    │
    ├─ timer.hr >= 4s    → applyDrift(hr, ±2, 20, 300)
    ├─ timer.spo2 >= 10s → applyDrift(spo2, ±1, 0, 100)
    ├─ timer.capno >= 7s → applyDrift(capno, ±2, 0, 80)
    ├─ timer.bp >= 300s  → applyDrift(bpSys, ±8) + applyDrift(bpDia, ±4)
    └─ timer.glucose >= 600s → applyDrift(glucose, ±1, 20, 600)
    │
    ▼
pushDisplay()  ← setState → re-render del componente
```

## Función applyDrift

```javascript
function applyDrift(current, drift, min, max) {
    const delta = Math.round((Math.random() * drift * 2) - drift);
    return Math.max(min, Math.min(max, current + delta));
}
```

- Genera un delta aleatorio en `[-drift, +drift]`
- Clampea el resultado entre `min` y `max`
- Nunca retorna valores fuera del rango fisiológico

## Diferencias con la versión anterior

| Aspecto | Antes (parseVital) | Ahora (useVitals) |
|---------|------------------|-----------------|
| Frecuencia de cambio | Cada render (60fps+) | Según fisiología (4–600s) |
| Valores negativos | Posibles ❌ | Imposibles ✅ |
| Glucosa | Cambiaba cada render | Estable 10 min ✅ |
| NIBP | Cambiaba cada render | Cada 5 min ✅ |
| Coherencia diastólica | No verificada | Siempre < sistólica ✅ |
| SpO2 > 100 | Posible | Imposible ✅ |
