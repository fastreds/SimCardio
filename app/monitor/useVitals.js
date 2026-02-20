'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Fisiología: reglas de actualización por signo vital ───
// Basado en estándares clínicos de monitoreo:
//   HR       → varía cada 3-5s, ±2 bpm
//   SpO2     → varía cada 8-12s, ±1%
//   NIBP     → se mide cada 5 min, ±8/4 mmHg
//   RESP     → varía cada 8-15s, ±1 rpm
//   EtCO2    → varía cada 5-10s, ±1-2 mmHg
//   Glucose  → prácticamente estática en 10 min, ±1 mg/dL
// ──────────────────────────────────────────────────────────

const VITAL_RULES = {
    hr: {
        interval: 4,     // segundos entre actualizaciones
        drift: 2,     // máxima variación por actualización
        min: 20,
        max: 300,
    },
    spo2: {
        interval: 10,
        drift: 1,
        min: 0,
        max: 100,
    },
    resp: {
        interval: 10,
        drift: 1,
        min: 0,
        max: 80,
    },
    capno: {                 // EtCO2
        interval: 7,
        drift: 2,
        min: 0,
        max: 80,
    },
    glucose: {
        interval: 600,   // 10 minutos — prácticamente estática
        drift: 1,
        min: 20,
        max: 600,
    },
    // NIBP es especial: formato "sistolica/diastolica"
    bp: {
        interval: 300,   // 5 minutos
        driftSys: 8,
        driftDia: 4,
        minSys: 60,
        maxSys: 220,
        minDia: 30,
        maxDia: 130,
    },
};

// Parsear presión arterial "120/80" → { sys: 120, dia: 80 }
function parseBP(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const parts = raw.split('/');
    if (parts.length !== 2) return null;
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    if (isNaN(sys) || isNaN(dia)) return null;
    return { sys, dia };
}

// Aplicar drift con clamp
function applyDrift(current, drift, min, max) {
    const delta = Math.round((Math.random() * drift * 2) - drift);
    return Math.max(min, Math.min(max, current + delta));
}

// ─── Hook principal ────────────────────────────────────────
export function useVitals() {
    // Valores "objetivo" que vienen de la etapa (strings tal cual de la BD)
    const targetRef = useRef({
        hr: '', bp: '', spo2: '', capno: '', glucose: '',
    });

    // Estado actual simulado con variación realista
    const [display, setDisplay] = useState({
        hr: '—', bp: '—/—', spo2: '—', capno: '—', glucose: '—',
    });

    // Tiempo acumulado para cada signo vital
    const timerRef = useRef({
        hr: 0, spo2: 0, resp: 0, capno: 0, glucose: 0, bp: 0,
    });

    // Valores "actuales" simulados (números)
    const currentRef = useRef({
        hr: null, spo2: null, resp: null, capno: null, glucose: null,
        bpSys: null, bpDia: null,
    });

    const intervalRef = useRef(null);
    const [active, setActive] = useState(false);

    // ── Inicializar valores desde target ───────────────
    const initFromTarget = useCallback((target) => {
        const c = currentRef.current;

        // HR
        const hrNum = parseInt(target.hr, 10);
        c.hr = isNaN(hrNum) ? null : Math.max(VITAL_RULES.hr.min, hrNum);

        // SpO2
        const spo2Num = parseInt(target.spo2, 10);
        c.spo2 = isNaN(spo2Num) ? null : Math.min(100, Math.max(0, spo2Num));

        // RESP (usamos capno como fuente, separado en display)
        const respNum = parseInt(target.capno, 10);
        c.resp = isNaN(respNum) ? null : Math.max(0, respNum);

        // EtCO2 (mismo campo capno, valor diferente)
        c.capno = isNaN(respNum) ? null : Math.max(0, respNum);

        // Glucosa
        const gluNum = parseInt(target.glucose, 10);
        c.glucose = isNaN(gluNum) ? null : Math.max(VITAL_RULES.glucose.min, gluNum);

        // NIBP
        const bp = parseBP(target.bp);
        if (bp) {
            c.bpSys = Math.max(VITAL_RULES.bp.minSys, bp.sys);
            c.bpDia = Math.max(VITAL_RULES.bp.minDia, bp.dia);
        } else {
            c.bpSys = null;
            c.bpDia = null;
        }

        // Reset timers
        timerRef.current = { hr: 0, spo2: 0, resp: 0, capno: 0, glucose: 0, bp: 0 };

        // Mostrar valores iniciales inmediatamente
        pushDisplay();
    }, []);

    // ── Publicar estado al componente ──────────────────
    function pushDisplay() {
        const c = currentRef.current;
        setDisplay({
            hr: c.hr !== null ? String(c.hr) : '—',
            spo2: c.spo2 !== null ? String(c.spo2) : '—',
            capno: c.capno !== null ? String(c.capno) : '—',
            glucose: c.glucose !== null ? String(c.glucose) : '—',
            bp: (c.bpSys !== null && c.bpDia !== null)
                ? `${c.bpSys}/${c.bpDia}`
                : '—/—',
        });
    }

    // ── Tick (1 segundo) ───────────────────────────────
    const tick = useCallback(() => {
        const t = timerRef.current;
        const c = currentRef.current;
        let changed = false;

        // HR
        t.hr++;
        if (t.hr >= VITAL_RULES.hr.interval && c.hr !== null) {
            c.hr = applyDrift(c.hr, VITAL_RULES.hr.drift,
                VITAL_RULES.hr.min, VITAL_RULES.hr.max);
            t.hr = 0;
            changed = true;
        }

        // SpO2
        t.spo2++;
        if (t.spo2 >= VITAL_RULES.spo2.interval && c.spo2 !== null) {
            c.spo2 = applyDrift(c.spo2, VITAL_RULES.spo2.drift,
                VITAL_RULES.spo2.min, VITAL_RULES.spo2.max);
            t.spo2 = 0;
            changed = true;
        }

        // RESP
        t.resp++;
        if (t.resp >= VITAL_RULES.resp.interval && c.resp !== null) {
            c.resp = applyDrift(c.resp, VITAL_RULES.resp.drift,
                VITAL_RULES.resp.min, VITAL_RULES.resp.max);
            t.resp = 0;
        }

        // EtCO2
        t.capno++;
        if (t.capno >= VITAL_RULES.capno.interval && c.capno !== null) {
            c.capno = applyDrift(c.capno, VITAL_RULES.capno.drift,
                VITAL_RULES.capno.min, VITAL_RULES.capno.max);
            t.capno = 0;
            changed = true;
        }

        // Glucosa (muy lenta)
        t.glucose++;
        if (t.glucose >= VITAL_RULES.glucose.interval && c.glucose !== null) {
            c.glucose = applyDrift(c.glucose, VITAL_RULES.glucose.drift,
                VITAL_RULES.glucose.min, VITAL_RULES.glucose.max);
            t.glucose = 0;
            changed = true;
        }

        // NIBP (muy lenta)
        t.bp++;
        if (t.bp >= VITAL_RULES.bp.interval && c.bpSys !== null) {
            c.bpSys = applyDrift(c.bpSys, VITAL_RULES.bp.driftSys,
                VITAL_RULES.bp.minSys, VITAL_RULES.bp.maxSys);
            c.bpDia = applyDrift(c.bpDia, VITAL_RULES.bp.driftDia,
                VITAL_RULES.bp.minDia, VITAL_RULES.bp.maxDia);
            // Asegurar que diastolica < sistolica
            if (c.bpDia >= c.bpSys) c.bpDia = c.bpSys - 20;
            t.bp = 0;
            changed = true;
        }

        if (changed) pushDisplay();
    }, []);

    // ── Arrancar / parar simulación ────────────────────
    useEffect(() => {
        if (active) {
            intervalRef.current = setInterval(tick, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [active, tick]);

    // ── API pública ────────────────────────────────────
    const setTarget = useCallback((target) => {
        targetRef.current = target;
        initFromTarget(target);
        setActive(true);
    }, [initFromTarget]);

    const stop = useCallback(() => {
        setActive(false);
        setDisplay({ hr: '—', bp: '—/—', spo2: '—', capno: '—', glucose: '—' });
    }, []);

    return { display, setTarget, stop };
}
