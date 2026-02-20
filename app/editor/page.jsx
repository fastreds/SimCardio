'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// ─── Constantes ───────────────────────────────────────────
const RHYTHM_OPTIONS = [
    { value: 'RITMO_SINUSAL', label: 'Ritmo Sinusal', chip: 'normal' },
    { value: 'BRADICARDIA_SINUSAL', label: 'Bradicardia Sinusal', chip: 'warning' },
    { value: 'TAQUICARDIA_SUPRAVENTRICULAR', label: 'Taquicardia SVT', chip: 'warning' },
    { value: 'FIBRILACION_AURICULAR', label: 'Fibrilación Auricular', chip: 'warning' },
    { value: 'BLOQUEO_AV_GRADO_1', label: 'Bloqueo AV Grado 1', chip: 'info' },
    { value: 'BLOQUEO_AV_2_MOBITZ_1', label: 'Bloqueo AV Mobitz I', chip: 'warning' },
    { value: 'TAQUICARDIA_VENTRICULAR', label: 'Taquicardia Ventricular', chip: 'critical' },
    { value: 'FIBRILACION_VENTRICULAR', label: 'Fibrilación Ventricular', chip: 'critical' },
    { value: 'ASISTOLIA', label: 'Asistolia', chip: 'critical' },
    { value: 'INFARTO_AGUDO_MIOCARDIO', label: 'Infarto Agudo (IAM)', chip: 'critical' },
];

function getRhythm(value) {
    return RHYTHM_OPTIONS.find(r => r.value === value) || { label: value, chip: 'info' };
}

// ─── Toast hook ───────────────────────────────────────────
function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(t => [...t, { id, message, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
    }, []);
    return { toasts, show };
}

// ─── Componentes pequeños ─────────────────────────────────
function RhythmChip({ value }) {
    if (!value) return null;
    const r = getRhythm(value);
    return <span className={`${styles.chip} ${styles[`chip_${r.chip}`]}`}>{r.label}</span>;
}

function Toast({ toasts }) {
    return (
        <div className={styles.toastContainer}>
            {toasts.map(t => (
                <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
                    {t.type === 'success' && '✓ '}
                    {t.type === 'error' && '✕ '}
                    {t.type === 'info' && 'ℹ '}
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────
export default function EditorPage() {
    const [cases, setCases] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toasts, show: showToast } = useToast();
    const tableBodyRef = useRef(null);

    // ── Load ────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/casos')
            .then(r => r.json())
            .then(data => { setCases(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { showToast('Error al cargar los casos', 'error'); setLoading(false); });
    }, []);

    // ── Keyboard shortcut Ctrl+S ─────────────────────
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [cases]);

    // ── Helpers ─────────────────────────────────────────
    const currentCase = currentIdx >= 0 ? cases[currentIdx] : null;

    const filteredIndices = cases
        .map((_, i) => i)
        .filter(i => !search || cases[i].paciente.toLowerCase().includes(search.toLowerCase()));

    // ── Case CRUD ────────────────────────────────────────
    function selectCase(idx) { setCurrentIdx(idx); }

    function addCase() {
        const newCase = { paciente: 'Nuevo Caso Clínico', etapas: [] };
        setCases(prev => [...prev, newCase]);
        setCurrentIdx(cases.length);
        setSearch('');
    }

    function deleteCase() {
        setShowConfirm(false);
        setCases(prev => prev.filter((_, i) => i !== currentIdx));
        setCurrentIdx(-1);
        showToast('Caso eliminado', 'info');
    }

    function updatePaciente(value) {
        setCases(prev => prev.map((c, i) =>
            i === currentIdx ? { ...c, paciente: value } : c
        ));
    }

    // ── Stage CRUD ───────────────────────────────────────
    function addStage() {
        setCases(prev => prev.map((c, i) => i !== currentIdx ? c : {
            ...c,
            etapas: [...c.etapas, { infoAdicional: '', bp: '', spo2: '', capno: '', hr: '', glucose: '', ritmo: 'RITMO_SINUSAL' }]
        }));
        // Scroll to bottom of table
        setTimeout(() => {
            tableBodyRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }

    function removeStage(idx) {
        setCases(prev => prev.map((c, i) => i !== currentIdx ? c : {
            ...c, etapas: c.etapas.filter((_, si) => si !== idx)
        }));
    }

    function updateStage(stageIdx, field, value) {
        setCases(prev => prev.map((c, i) => i !== currentIdx ? c : {
            ...c,
            etapas: c.etapas.map((e, si) => si === stageIdx ? { ...e, [field]: value } : e)
        }));
    }

    // ── Upload ───────────────────────────────────────────
    async function uploadImage(file, stageIdx) {
        if (!file) return;
        showToast('Subiendo imagen…', 'info');
        const formData = new FormData();
        formData.append('ekgImage', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                updateStage(stageIdx, 'ekg12d', data.filePath);
                showToast('Imagen subida correctamente', 'success');
            } else {
                showToast('Error al subir imagen', 'error');
            }
        } catch {
            showToast('Error de conexión al subir', 'error');
        }
    }

    // ── Save ─────────────────────────────────────────────
    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch('/api/casos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cases),
            });
            if (res.ok) showToast('Cambios guardados correctamente', 'success');
            else showToast('Error al guardar', 'error');
        } catch {
            showToast('Error de conexión al guardar', 'error');
        } finally {
            setSaving(false);
        }
    }

    // ── Render ───────────────────────────────────────────
    return (
        <div className={styles.app}>

            {/* Top Bar */}
            <header className={styles.topbar}>
                <div className={styles.topbarLeft}>
                    <Link href="/" className={styles.backLink}>
                        ← Menú
                    </Link>
                    <div className={styles.brand}>
                        <span className={styles.brandDot} />
                        <span className={styles.brandName}>SimCardio</span>
                        <span className={styles.brandTag}>MANTENIMIENTO</span>
                    </div>
                </div>
                <button
                    className={`${styles.btn} ${styles.btnSuccess}`}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '⏳ Guardando…' : '💾 Guardar Cambios'}
                </button>
            </header>

            {/* Main Grid */}
            <div className={styles.mainGrid}>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <span className={styles.sidebarTitle}>Casos Clínicos</span>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="🔍 Buscar caso..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className={styles.caseList}>
                        {loading && <div className={styles.loader}><span />Cargando...</div>}
                        {!loading && filteredIndices.length === 0 && (
                            <div className={styles.emptyList}>Sin resultados</div>
                        )}
                        {!loading && filteredIndices.map(idx => (
                            <div
                                key={idx}
                                className={`${styles.caseItem} ${idx === currentIdx ? styles.caseItemActive : ''}`}
                                onClick={() => selectCase(idx)}
                            >
                                <div className={styles.caseNum}>Caso {idx + 1}</div>
                                <div className={styles.caseName}>
                                    {cases[idx].paciente.length > 65
                                        ? cases[idx].paciente.slice(0, 65) + '…'
                                        : cases[idx].paciente}
                                </div>
                                <div className={styles.caseMeta}>
                                    <span className={styles.stageBadge}>
                                        {cases[idx].etapas?.length ?? 0} etapa{cases[idx].etapas?.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.sidebarFooter}>
                        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`} onClick={addCase}>
                            + Nuevo Caso
                        </button>
                    </div>
                </aside>

                {/* Editor Panel */}
                <main className={styles.editorPanel}>
                    {!currentCase && (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📋</span>
                            <h3>Selecciona un caso</h3>
                            <p>Elige un caso de la lista o crea uno nuevo</p>
                        </div>
                    )}

                    {currentCase && (
                        <div className={styles.editorContent}>
                            {/* Patient Header */}
                            <div className={styles.editorHeader}>
                                <div className={styles.editorHeaderLeft}>
                                    <div className={styles.editorLabel}>CASO #{currentIdx + 1} — Descripción del Paciente</div>
                                    <textarea
                                        className={styles.pacienteInput}
                                        rows={2}
                                        value={currentCase.paciente}
                                        onChange={e => updatePaciente(e.target.value)}
                                        placeholder="Descripción clínica del paciente..."
                                    />
                                </div>
                                <button
                                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                    onClick={() => setShowConfirm(true)}
                                >
                                    🗑 Eliminar Caso
                                </button>
                            </div>

                            {/* Stages */}
                            <div className={styles.stagesSection}>
                                <div className={styles.stagesToolbar}>
                                    <div className={styles.stagesLeft}>
                                        <span className={styles.stagesTitle}>Etapas</span>
                                        <span className={styles.stagesCount}>{currentCase.etapas?.length ?? 0}</span>
                                    </div>
                                    <button
                                        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                                        onClick={addStage}
                                    >
                                        + Agregar Etapa
                                    </button>
                                </div>

                                <div className={styles.tableWrapper}>
                                    <table className={styles.stagesTable}>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Descripción / Info Adicional</th>
                                                <th>❤️ HR</th>
                                                <th>🩸 BP</th>
                                                <th>💧 SpO₂</th>
                                                <th>🫁 EtCO₂</th>
                                                <th>🍬 Glu</th>
                                                <th>⚡ Ritmo</th>
                                                <th>🖼 EKG 12D</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody ref={tableBodyRef}>
                                            {currentCase.etapas?.map((etapa, idx) => (
                                                <StageRow
                                                    key={idx}
                                                    idx={idx}
                                                    etapa={etapa}
                                                    onChange={updateStage}
                                                    onRemove={removeStage}
                                                    onUpload={uploadImage}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                    {currentCase.etapas?.length === 0 && (
                                        <div className={styles.noStages}>
                                            Sin etapas — haz clic en &quot;+ Agregar Etapa&quot;
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Confirm Modal */}
            {showConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}>🗑</div>
                        <h3>Eliminar caso clínico</h3>
                        <p>Esta acción es irreversible. ¿Deseas eliminar el caso y todas sus etapas?</p>
                        <div className={styles.modalActions}>
                            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowConfirm(false)}>
                                Cancelar
                            </button>
                            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteCase}>
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <Toast toasts={toasts} />
        </div>
    );
}

// ─── StageRow component ───────────────────────────────────
function StageRow({ idx, etapa, onChange, onRemove, onUpload }) {
    const rhythm = getRhythm(etapa.ritmo);

    return (
        <tr>
            <td className={styles.stageNum}>{idx + 1}</td>
            <td>
                <textarea
                    className={styles.tTextarea}
                    rows={2}
                    defaultValue={etapa.infoAdicional || ''}
                    onBlur={e => onChange(idx, 'infoAdicional', e.target.value)}
                    placeholder="Descripción de la etapa..."
                />
            </td>
            {[
                { field: 'hr', cls: 'vitalHr' },
                { field: 'bp', cls: 'vitalBp' },
                { field: 'spo2', cls: 'vitalSpo2' },
                { field: 'capno', cls: 'vitalCapno' },
                { field: 'glucose', cls: 'vitalGlu' },
            ].map(({ field, cls }) => (
                <td key={field} className={styles.vitalCell}>
                    <input
                        className={`${styles.tInput} ${styles[cls]}`}
                        defaultValue={etapa[field] || ''}
                        placeholder="—"
                        onBlur={e => onChange(idx, field, e.target.value)}
                    />
                </td>
            ))}
            <td>
                <select
                    className={styles.rhythmSelect}
                    value={etapa.ritmo || ''}
                    onChange={e => onChange(idx, 'ritmo', e.target.value)}
                >
                    <option value="">— Sin ritmo —</option>
                    {RHYTHM_OPTIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
                <RhythmChip value={etapa.ritmo} />
            </td>
            <td className={styles.ekgCell}>
                {etapa.ekg12d && (
                    <a href={etapa.ekg12d} target="_blank" rel="noreferrer" className={styles.ekgLink}>
                        🖼 Ver imagen
                    </a>
                )}
                <label className={styles.fileBtn}>
                    📤 {etapa.ekg12d ? 'Cambiar' : 'Subir ECG'}
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => onUpload(e.target.files?.[0], idx)}
                    />
                </label>
            </td>
            <td>
                <button className={styles.deleteRowBtn} onClick={() => onRemove(idx)} title="Eliminar etapa">
                    ✕
                </button>
            </td>
        </tr>
    );
}
