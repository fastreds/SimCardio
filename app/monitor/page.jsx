'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useEcg } from './useEcg';
import { useVitals } from './useVitals';
import styles from './page.module.css';

// ─── Cronómetro hook ──────────────────────────────────────
function useCronometro() {
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);
    const [marks, setMarks] = useState([]);
    const intervalRef = useRef(null);

    const start = useCallback(() => {
        if (intervalRef.current) return;
        setRunning(true);
        intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }, []);

    const pause = useCallback(() => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
    }, []);

    const reset = useCallback(() => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        setSeconds(0);
        setMarks([]);
    }, []);

    const mark = useCallback(() => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        setMarks(prev => [...prev, `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`]);
    }, [seconds]);

    useEffect(() => () => clearInterval(intervalRef.current), []);

    const display = (() => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '00')}`;
    })();

    return { display, marks, running, start, pause, reset, mark };
}

// ─── VitalBox ─────────────────────────────────────────────
function VitalBox({ id, label, unit, value, colorClass }) {
    return (
        <div id={id} className={`${styles.vitalBox} ${styles[colorClass]}`}>
            <div className={styles.vitalLabel}>
                {label} <span className={styles.vitalUnit}>{unit}</span>
            </div>
            <div className={styles.vitalValue}>{value ?? '—'}</div>
        </div>
    );
}

// ─── EKG Modal ────────────────────────────────────────────
function EkgModal({ src, onClose }) {
    useEffect(() => {
        const h = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={onClose}>✕ Cerrar</button>
                <img src={src} alt="EKG 12 derivaciones" className={styles.modalImg} />
            </div>
        </div>
    );
}

// ─── Monitor Page ─────────────────────────────────────────
export default function MonitorPage() {
    const [cases, setCases] = useState([]);
    const [caseIdx, setCaseIdx] = useState(0);
    const [etapaIdx, setEtapaIdx] = useState(0);
    const [started, setStarted] = useState(false);
    const [history, setHistory] = useState('Sistema listo...');
    const [ekgSrc, setEkgSrc] = useState(null);
    const [ekgOpen, setEkgOpen] = useState(false);
    const [isFullscreen, setFullscreen] = useState(false);

    const canvasRef = useRef(null);
    const { setRhythm } = useEcg(canvasRef);
    const crono = useCronometro();
    const { display: vitals, setTarget, stop: stopVitals } = useVitals();

    // ── Cargar casos ───────────────────────────────────
    useEffect(() => {
        fetch('/api/casos')
            .then(r => r.json())
            .then(d => setCases(Array.isArray(d) ? d : []))
            .catch(() => setCases([]));
    }, []);

    // ── Aplicar etapa ──────────────────────────────────
    const applyEtapa = useCallback((cIdx, eIdx) => {
        const caso = cases[cIdx];
        if (!caso) return;
        const etapa = caso.etapas?.[eIdx];
        if (!etapa) return;

        // Pasar los valores crudos al hook — él se encarga de validar y simular
        setTarget({
            hr: etapa.hr || '',
            bp: etapa.bp || '',
            spo2: etapa.spo2 || '',
            capno: etapa.capno || '',
            glucose: etapa.glucose || '',
        });

        setHistory(`${caso.paciente}\n───────────────\n${etapa.infoAdicional || ''}`);
        setRhythm(etapa.ritmo || 'ASISTOLIA', etapa.hr || 75);
        setEkgSrc(etapa.ekg12d || null);
    }, [cases, setRhythm, setTarget]);

    // ── Iniciar caso ───────────────────────────────────
    function handleStart() {
        setEtapaIdx(0);
        setStarted(true);
        crono.reset();
        crono.start();
        applyEtapa(caseIdx, 0);
    }

    // ── Avanzar etapa ──────────────────────────────────
    function handleStep() {
        if (!started) return;
        const caso = cases[caseIdx];
        if (!caso) return;
        const total = caso.etapas?.length ?? 0;

        if (etapaIdx < total - 1) {
            const next = etapaIdx + 1;
            setEtapaIdx(next);
            crono.mark();
            applyEtapa(caseIdx, next);
        } else {
            crono.pause();
            stopVitals();
            setHistory(h => h + '\n\n── Caso Finalizado ──');
            setRhythm('ASISTOLIA', 0);
        }
    }

    // ── Fullscreen ─────────────────────────────────────
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }
    useEffect(() => {
        const h = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);

    const currentCase = cases[caseIdx];
    const totalEtapas = currentCase?.etapas?.length ?? 0;

    return (
        <div className={styles.frame}>
            {/* ── Top Bar ── */}
            <header className={styles.topBar}>
                <div className={styles.topLeft}>
                    <select
                        className={styles.caseSelect}
                        value={caseIdx}
                        onChange={e => {
                            setCaseIdx(Number(e.target.value));
                            setEtapaIdx(0);
                            setStarted(false);
                            stopVitals();
                        }}
                    >
                        {cases.map((c, i) => (
                            <option key={i} value={i}>
                                {c.paciente?.split(',')[0]?.slice(0, 50) || `Caso ${i + 1}`}
                            </option>
                        ))}
                        {cases.length === 0 && <option value={0}>Sin casos cargados</option>}
                    </select>

                    <button className={`${styles.btn} ${styles.btnGreen}`} onClick={handleStart}>
                        ▶ Iniciar
                    </button>
                    <button
                        className={`${styles.btn} ${styles.btnBlue}`}
                        onClick={handleStep}
                        disabled={!started}
                        title={started ? `Etapa ${etapaIdx + 1}/${totalEtapas}` : ''}
                    >
                        ⏭ Avanzar {started ? `(${etapaIdx + 1}/${totalEtapas})` : ''}
                    </button>

                    {ekgSrc && (
                        <button
                            className={`${styles.btn} ${styles.btnViolet}`}
                            onClick={() => setEkgOpen(true)}
                        >
                            📋 Ver Examen
                        </button>
                    )}
                </div>

                <div className={styles.topCenter}>
                    <span className={styles.cronoTime}>{crono.display}</span>
                    <div className={styles.cronoMarks}>
                        {crono.marks.map((m, i) => (
                            <span key={i} className={styles.mark}>{m}</span>
                        ))}
                    </div>
                </div>

                <div className={styles.topRight}>
                    <Link href="/" className={`${styles.btn} ${styles.btnGhost}`}>
                        ⌂ Menú
                    </Link>
                    <button
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={toggleFullscreen}
                        title="Pantalla completa"
                    >
                        {isFullscreen ? '⛶ Salir' : '⛶ Full'}
                    </button>
                </div>
            </header>

            {/* ── Main ── */}
            <main className={styles.main}>
                {/* ECG */}
                <div className={styles.ecgContainer}>
                    <div className={styles.vitalHeader}>ECG / Lead II</div>
                    <canvas ref={canvasRef} className={styles.ecgCanvas} />
                </div>

                {/* Vitals Grid — 6 signos vitales */}
                <div className={styles.vitalsGrid}>
                    <VitalBox
                        id="hr-box"
                        label="HR"
                        unit="bpm"
                        value={vitals.hr}
                        colorClass="boxHr"
                    />
                    <VitalBox
                        id="bp-box"
                        label="NIBP"
                        unit="mmHg"
                        value={vitals.bp}
                        colorClass="boxBp"
                    />
                    <VitalBox
                        id="spo2-box"
                        label="SpO₂"
                        unit="%"
                        value={vitals.spo2}
                        colorClass="boxSpo2"
                    />
                    <VitalBox
                        id="resp-box"
                        label="RESP"
                        unit="rpm"
                        value={vitals.capno}
                        colorClass="boxResp"
                    />
                    <VitalBox
                        id="etco2-box"
                        label="EtCO₂"
                        unit="mmHg"
                        value={vitals.capno}
                        colorClass="boxEtco2"
                    />
                    <VitalBox
                        id="glucose-box"
                        label="GLU"
                        unit="mg/dL"
                        value={vitals.glucose}
                        colorClass="boxGlu"
                    />
                </div>

                {/* Historia / Eventos */}
                <div className={styles.historyBox}>
                    <div className={styles.vitalHeader}>HISTORIAL / EVENTOS</div>
                    <pre className={styles.historyContent}>{history}</pre>
                </div>
            </main>

            {/* ── EKG Modal ── */}
            {ekgOpen && ekgSrc && (
                <EkgModal src={ekgSrc} onClose={() => setEkgOpen(false)} />
            )}
        </div>
    );
}
