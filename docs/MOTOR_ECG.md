# ⚡ Motor ECG — Documentación Técnica

## Ubicación

```
app/monitor/useEcg.js
```

## Arquitectura

El motor ECG es un **React hook** (`useEcg`) que controla un elemento `<canvas>` HTML5 para renderizar una señal de electrocardiograma en tiempo real, simulando la pantalla de fósforo de un monitor médico real.

```jsx
// Uso en el componente
const canvasRef = useRef(null);
const { setRhythm } = useEcg(canvasRef);

// Cambiar ritmo programáticamente
setRhythm('RITMO_SINUSAL', 75);

// En el JSX
<canvas ref={canvasRef} />
```

## Funcionamiento

### Ciclo de animación
1. `useEffect` monta el canvas y arranca el loop `animate()`
2. `requestAnimationFrame` llama `animate()` en cada frame (~60 FPS)
3. En cada frame:
   - Se avanza `scanX` (cursor) 2 pixels
   - Se calcula el tiempo `t` basado en velocidad de papel (25mm/s)
   - Se obtiene el valor de señal `getSignalValue(tipo, bpm, t)`
   - Se dibuja un segmento de línea verde del punto anterior al nuevo
   - Se borra la zona "scan bar" delante del cursor (efecto barrido)
4. Cuando `scanX >= width`, se resetea a 0 (loop continuo)

### Constantes de configuración
```javascript
const CONFIG = {
    paperSpeed:   25,    // mm/s (estándar médico)
    pixelsPerMM:  5,     // Factor de escala
    sampleRate:   60,    // Hz
    lineWidth:    2,     // pixels
    lineColor:    '#00ff00',
    shadowBlur:   10,    // Efecto de glow fosforescente
    scanBarWidth: 20,    // Ancho del borrador (pixels)
    baselineY:    0.5,   // Centro vertical (0.0 - 1.0)
    gain:         100,   // Escala de amplitud
};
```

## Generación de Señales

La función `getSignalValue(type, bpm, timeSeconds)` genera el valor de voltaje para cada punto en el tiempo. Cada ritmo se define matemáticamente:

### Componentes de un latido normal
```
    Onda P      QRS          Onda T
    ┌──┐       ┌┐           ┌──┐
    │  │       ││           │  │
────┘  └───────┘└──────────┘  └────
   10%  20%  29-33%      45-65%

progress: 0.0 ───────────────── 1.0
```

### Signal Map

| Ritmo | progress | Onda P | Q | R | S | T | Comportamiento especial |
|-------|----------|--------|---|---|---|---|------------------------|
| Sinusal | 0-1 | 10-20% | 28-29% | 29-31% (1.0) | 31-33% | 45-65% | Normal |
| Bradicardia | 0-1 | = | = | = | = | = | Mismo patrón, BPM bajo |
| Taquicardia SVT | 0-1 | = | = | = | = | = | Mismo patrón, BPM alto |
| FA | — | f-waves (50Hz) | — | Irregular (+random) | — | — | R-R irregular |
| TV | — | No | — | Sinusoidal ancha | — | — | `sin(phase * 2π/0.3)` |
| FV | — | — | — | — | — | — | Caótico: `sin(t*10) + sin(t*23)` |
| Asistolia | — | — | — | — | — | — | Solo ruido ×0.5 |
| Bloqueo AV-1 | 0-1 | 5-15% (antes) | — | 29-31% | — | 45-65% | PR prolongado |
| IAM | 0-1 | 10-20% | — | 29-31% | — | 45-65% | ST elevado (+0.3) entre QRS y T |
| Mobitz I | Ciclo 4 | Variable (shift) | — | Normal/Ausente | — | 45-65% | Ciclo 4: QRS se cae |

### Mobitz I (Wenckebach) - Detalle
```
Latido 1:  P─────QRS──T     (PR normal)
Latido 2:  P──────QRS──T    (PR +0.03)
Latido 3:  P───────QRS──T   (PR +0.06)
Latido 4:  P─────────        (❌ QRS bloqueado)
                              → reinicia ciclo
```

## Estado interno

El estado del motor **NO usa `useState`** para evitar re-renders. Todo vive en un `useRef`:

```javascript
const stateRef = useRef({
    isRunning:       false,
    rhythmType:      'ASISTOLIA',
    hr:              75,
    t:               0,        // Acumulador de tiempo global
    scanX:           0,        // Posición X del cursor
    lastX:           0,        // Último punto dibujado (X)
    lastY:           0,        // Último punto dibujado (Y)
    animationFrameId: null,
});
```

## API del Hook

```typescript
useEcg(canvasRef: RefObject<HTMLCanvasElement>): {
    setRhythm: (type: string, bpm?: number) => void
}
```

### `setRhythm(type, bpm?)`
Cambia el ritmo y opcionalmente el BPM. El cambio es **inmediato** (sin transición suave).

**Parámetros:**
- `type`: Identificador del ritmo (ver tabla de ritmos)
- `bpm`: Frecuencia cardíaca (default: mantiene el valor actual)

## Agregar un nuevo ritmo

1. Agregar el `case` en `getSignalValue()` dentro de `useEcg.js`
2. Agregar la opción en `RHYTHM_OPTIONS` de `app/editor/page.jsx`
3. Documentar aquí la lógica matemática

```javascript
// Ejemplo: nuevo ritmo
case 'NUEVO_RITMO':
    // P wave
    if (progress > 0.10 && progress < 0.20)
        val += 0.15 * Math.sin((progress - 0.10) / 0.10 * Math.PI);
    // QRS con características específicas
    if (progress > 0.29 && progress <= 0.31) val += 1.0;
    // ... definir T wave, segmentos especiales
    break;
```

## Rendering visual

| Propiedad | Valor | Efecto |
|-----------|-------|--------|
| Línea | `#00ff00`, 2px | Verde fosforescente |
| Shadow | blur 10px, `#00ff00` | Glow suave tipo CRT |
| Fondo | Transparente (CSS lo pone negro) | Canvas limpio |
| Barrido | 20px ahead clear | Efecto de "borrador" de monitor médico |
| Wrap | Reset a x=0 al llegar al borde | Loop continuo sin parpadeo |
