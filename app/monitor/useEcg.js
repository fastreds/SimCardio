'use client';

import { useRef, useEffect, useCallback } from 'react';

// ─── Signal Generation (ported from ecg/ecg.js — math unchanged) ───────────
const CONFIG = {
    paperSpeed: 25,
    pixelsPerMM: 5,
    sampleRate: 60,
    lineWidth: 2,
    lineColor: '#00ff00',
    shadowBlur: 10,
    shadowColor: '#00ff00',
    scanBarWidth: 20,
    baselineY: 0.5,
    gain: 100,
};

function getSignalValue(type, bpm, timeSeconds) {
    let val = 0;
    const beatDuration = 60 / bpm;
    const phase = timeSeconds % beatDuration;
    const progress = phase / beatDuration;
    const noise = (Math.random() - 0.5) * 0.05;

    switch (type) {
        case 'RITMO_SINUSAL':
        case 'BRADICARDIA_SINUSAL':
        case 'TAQUICARDIA_SUPRAVENTRICULAR':
            if (progress > 0.10 && progress < 0.20)
                val += 0.15 * Math.sin((progress - 0.10) / 0.10 * Math.PI);
            if (progress > 0.28 && progress <= 0.29) val -= 0.1;
            else if (progress > 0.29 && progress <= 0.31) val += 1.0;
            else if (progress > 0.31 && progress <= 0.33) val -= 0.2;
            if (progress > 0.45 && progress < 0.65)
                val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
            break;

        case 'ASISTOLIA':
            return noise * 0.5;

        case 'FIBRILACION_VENTRICULAR':
            val = 0.5 * Math.sin(timeSeconds * 10) + 0.3 * Math.sin(timeSeconds * 23);
            break;

        case 'FIBRILACION_AURICULAR':
            val += 0.05 * Math.sin(timeSeconds * 50);
            if (progress > 0.29 && progress <= 0.31) val += 0.9 + (Math.random() * 0.2);
            val += noise * 2;
            break;

        case 'TAQUICARDIA_VENTRICULAR':
            val = 0.8 * Math.sin(phase * (Math.PI * 2) / 0.3);
            break;

        case 'BLOQUEO_AV_GRADO_1':
            if (progress > 0.05 && progress < 0.15)
                val += 0.15 * Math.sin((progress - 0.05) / 0.10 * Math.PI);
            if (progress > 0.29 && progress <= 0.31) val += 1.0;
            if (progress > 0.45 && progress < 0.65)
                val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
            break;

        case 'INFARTO_AGUDO_MIOCARDIO':
            if (progress > 0.10 && progress < 0.20)
                val += 0.15 * Math.sin((progress - 0.10) / 0.10 * Math.PI);
            if (progress > 0.29 && progress <= 0.31) val += 1.0;
            if (progress > 0.31 && progress < 0.50) val += 0.3;
            if (progress > 0.45 && progress < 0.65)
                val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
            break;

        case 'BLOQUEO_AV_2_MOBITZ_1': {
            const beatIdx = Math.floor(timeSeconds / beatDuration);
            const cycle = beatIdx % 4;
            const pStart = 0.10 - (cycle * 0.03);
            if (cycle === 3) {
                if (progress > pStart && progress < pStart + 0.10)
                    val += 0.15 * Math.sin((progress - pStart) / 0.10 * Math.PI);
            } else {
                if (progress > pStart && progress < pStart + 0.10)
                    val += 0.15 * Math.sin((progress - pStart) / 0.10 * Math.PI);
                if (progress > 0.29 && progress <= 0.31) val += 1.0;
                if (progress > 0.45 && progress < 0.65)
                    val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
            }
            break;
        }

        default:
            if (progress > 0.29 && progress <= 0.31) val += 1.0;
    }

    return val + noise;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useEcg(canvasRef) {
    const stateRef = useRef({
        isRunning: false,
        rhythmType: 'ASISTOLIA',
        hr: 75,
        t: 0,
        scanX: 0,
        lastX: 0,
        lastY: 0,
        animationFrameId: null,
    });

    // Start the animation loop
    const startLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        function animate() {
            if (!s.isRunning) return;

            const w = canvas.width;
            const h = canvas.height;
            const speed = 2;

            ctx.lineWidth = CONFIG.lineWidth;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowBlur = CONFIG.shadowBlur;
            ctx.shadowColor = CONFIG.shadowColor;
            ctx.strokeStyle = CONFIG.lineColor;

            // Erase scan bar ahead
            ctx.clearRect(s.scanX, 0, CONFIG.scanBarWidth + speed, h);
            if (s.scanX + CONFIG.scanBarWidth > w)
                ctx.clearRect(0, 0, (s.scanX + CONFIG.scanBarWidth) % w, h);

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(s.lastX, s.lastY);

            s.scanX += speed;
            const pxPerSec = CONFIG.paperSpeed * CONFIG.pixelsPerMM;
            s.t += speed / pxPerSec;

            const rawSignal = getSignalValue(s.rhythmType, s.hr, s.t);
            const y = (h * CONFIG.baselineY) - (rawSignal * CONFIG.gain);

            if (s.scanX >= w) {
                s.scanX = 0; s.lastX = 0; s.lastY = y;
                ctx.moveTo(0, y);
            } else {
                ctx.lineTo(s.scanX, y);
                ctx.stroke();
                s.lastX = s.scanX;
                s.lastY = y;
            }

            s.animationFrameId = requestAnimationFrame(animate);
        }

        animate();
    }, [canvasRef]);

    // Resize handler
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        stateRef.current.lastY = canvas.height * CONFIG.baselineY;
        stateRef.current.scanX = 0;
        stateRef.current.lastX = 0;
    }, [canvasRef]);

    // Mount / unmount
    useEffect(() => {
        resizeCanvas();
        stateRef.current.isRunning = true;
        startLoop();

        const onResize = () => { resizeCanvas(); };
        window.addEventListener('resize', onResize);

        return () => {
            stateRef.current.isRunning = false;
            cancelAnimationFrame(stateRef.current.animationFrameId);
            window.removeEventListener('resize', onResize);
        };
    }, [resizeCanvas, startLoop]);

    // Control function (equivalent to window.setRhythm in original)
    const setRhythm = useCallback((type, bpm) => {
        stateRef.current.rhythmType = type;
        if (bpm) stateRef.current.hr = Number(bpm);
    }, []);

    return { setRhythm };
}
