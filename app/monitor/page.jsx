'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useEcg } from './useEcg';
import styles from './page.module.css';

// ─── Constants ────────────────────────────────────────────
function getRandomValue(base, range) {
    return Math.floor(base + (Math.random() * (range * 2 + 1)) - range);
}

function parseVital(raw) {
    if (!raw || raw === '') return '— —';
    if (!isNaN(raw)) return getRandomValue(parseInt(raw, 10), 5);
    return raw;
}

const DEFAULT_VITALS = {
    hr: '0', bp: '0/0', spo2: '0', capno: '0', glucose: '0',
};

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
        const label = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        setMarks(prev => [...prev, label]);
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
function VitalBox({ id, label, unit, value, colorClass, draggable, onDragStart }) {
    return (
        <div
            id={id}
            className={`${styles.vitalBox} ${styles[colorClass]}`}
            draggable={draggable}
            onDragStart={onDragStart}
        >
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
        const handler = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
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
    const [vitals, setVitals] = useState(DEFAULT_VITALS);
    const [history, setHistory] = useState('Sistema listo...');
    const [ekgSrc, setEkgSrc] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const canvasRef = useRef(null);
    const { setRhythm } = useEcg(canvasRef);
    const crono = useCronometro();

    // ── Load cases ─────────────────────────────────────
    useEffect(() => {
        fetch('/api/casos')
            .then(r => r.json())
            .then(d => setCases(Array.isArray(d) ? d : []))
            .catch(() => setCases([]));
    }, []);

    // ── Compute display vitals ─────────────────────────
    const displayVitals = {
        hr: parseVital(vitals.hr),
        bp: vitals.bp || '—/—',
        spo2: parseVital(vitals.spo2),
        capno: parseVital(vitals.capno),
        glucose: parseVital(vitals.glucose),
    };

    // ── Update a stage ─────────────────────────────────
    const applyEtapa = useCallback((cIdx, eIdx) => {
        const caso = cases[cIdx];
        if (!caso) return;
        const etapa = caso.etapas?.[eIdx];
        if (!etapa) return;

        setVitals({
            hr: etapa.hr || '',
            bp: etapa.bp || '',
            spo2: etapa.spo2 || '',
            capno: etapa.capno || '',
            glucose: etapa.glucose || '',
        });

        setHistory(
            `${caso.paciente}\n───────────────\n${etapa.infoAdicional || ''}`
        );

        const ritmo = etapa.ritmo || 'ASISTOLIA';
        setRhythm(ritmo, etapa.hr || 75);
        setEkgSrc(etapa.ekg12d || null);
    }, [cases, setRhythm]);

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

        if (etapaIdx < (caso.etapas?.length ?? 0) - 1) {
            const next = etapaIdx + 1;
            setEtapaIdx(next);
            crono.mark();
            applyEtapa(caseIdx, next);
        } else {
            crono.pause();
            setHistory('Caso Finalizado');
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
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const currentCase = cases[caseIdx];
    const hasEkg12d = !!ekgSrc;

    return (
        <div className={styles.frame}>
            {/* ── Top Bar ──────────────────────────────── */}
            <header className={styles.topBar}>
                <div className={styles.topLeft}>
                    <select
                        className={styles.caseSelect}
                        value={caseIdx}
                        onChange={e => { setCaseIdx(Number(e.target.value)); setEtapaIdx(0); setStarted(false); }}
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
                    <button className={`${styles.btn} ${styles.btnBlue}`} onClick={handleStep} disabled={!started}>
                        ⏭ Avanzar
                    </button>

                    {hasEkg12d && (
                        <button className={`${styles.btn} ${styles.btnViolet}`} onClick={() => setEkgSrc(ekgSrc)}>
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
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={toggleFullscreen} title="Pantalla completa">
                        {isFullscreen ? '⛶' : '⛶'}
                    </button>
                </div>
            </header>

            {/* ── Main ─────────────────────────────────── */}
            <main className={styles.main}>
                {/* ECG */}
                <div className={styles.ecgContainer}>
                    <div className={styles.vitalHeader}>ECG / Lead II</div>
                    <canvas ref={canvasRef} className={styles.ecgCanvas} />
                </div>

                {/* Vitals Grid */}
                <div className={styles.vitalsGrid}>
                    <VitalBox id="hr-box" label="HR" unit="bpm" value={displayVitals.hr} colorClass="boxHr" />
                    <VitalBox id="bp-box" label="NIBP" unit="mmHg" value={displayVitals.bp} colorClass="boxBp" />
                    <VitalBox id="spo2-box" label="SpO₂" unit="%" value={displayVitals.spo2} colorClass="boxSpo2" />
                    <VitalBox id="resp-box" label="RESP" unit="rpm" value={displayVitals.capno} colorClass="boxResp" />
                    <VitalBox id="etco2-box" label="EtCO₂" unit="mmHg" value={displayVitals.capno} colorClass="boxEtco2" />
                    <VitalBox id="glucose-box" label="GLU" unit="mg/dL" value={displayVitals.glucose} colorClass="boxGlu" />
                </div>

                {/* History */}
                <div className={styles.historyBox}>
                    <div className={styles.vitalHeader}>HISTORIAL / EVENTOS</div>
                    <pre className={styles.historyContent}>{history}</pre>
                </div>
            </main>

            {/* ── EKG Modal ─────────────────────────────── */}
            {ekgSrc && hasEkg12d && (
                <EkgModal src={ekgSrc} onClose={() => setEkgSrc(null)} />
            )}
        </div>
    );
}
