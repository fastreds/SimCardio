// ECG Monitor Engine (Canvas 2D)
// Replaces Chart.js with a direct high-performance rendering system
// simulating a medical phosphor screen.

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("ecg-chart");
    const ctx = canvas.getContext("2d");

    // Configuration
    const CONFIG = {
        paperSpeed: 25, // mm/s
        pixelsPerMM: 5, // Scale factor (adjust for screen density perception)
        sampleRate: 60, // Hz (drawing updates per second)
        lineWidth: 2,
        lineColor: "#00ff00", // Bright Green
        shadowBlur: 10,
        shadowColor: "#00ff00",
        gridColor: "#112211",
        scanBarWidth: 20, // Width of the "eraser" bar
        baselineY: 0.5, // Center of canvas (0.0 to 1.0)
        gain: 100, // Amplitude scaling
    };

    // State
    let width, height;
    let scanX = 0; // Current cursor position (0 to width)
    let lastX = 0;
    let lastY = 0;
    let t = 0; // Global time accumulator
    let hr = 75; // Heart Rate
    let rhythmType = 'ASISTOLIA';
    let isRunning = false;
    let animationFrameId;

    // Buffer for signal processing (optional, but good for noise filtering)
    let buffer = [];

    // Initialize Canvas Size
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        width = canvas.width;
        height = canvas.height;
        lastY = height * CONFIG.baselineY;

        // Clear background
        ctx.fillStyle = "transparent"; // CSS handles background
        ctx.clearRect(0, 0, width, height);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- Signal Generation Logic (Refining the math from previous version) ---
    // We treat 'tick' as a continuous time variable.
    // The previous math relied on 'index' modulation. We will adapt it.

    let signalIndex = 0;

    function getSignalValue(type, bpm, timeSeconds) {
        let val = 0;
        let beatDuration = 60 / bpm; // duration of one beat in seconds
        let phase = timeSeconds % beatDuration; // time within the current beat
        let progress = phase / beatDuration; // 0.0 to 1.0 within beat

        // Add baseline noise (EMG / electrical noise)
        let noise = (Math.random() - 0.5) * 0.05;

        switch (type) {
            case 'RITMO_SINUSAL':
            case 'BRADICARDIA_SINUSAL':
            case 'TAQUICARDIA_SUPRAVENTRICULAR':
                // P wave (at ~15%)
                if (progress > 0.10 && progress < 0.20) {
                    val += 0.15 * Math.sin((progress - 0.10) / 0.10 * Math.PI);
                }
                // QRS Complex (at ~30%)
                if (progress > 0.28 && progress <= 0.29) val -= 0.1;
                else if (progress > 0.29 && progress <= 0.31) val += 1.0;
                else if (progress > 0.31 && progress <= 0.33) val -= 0.2;
                // T wave (at ~50-65%)
                if (progress > 0.45 && progress < 0.65) {
                    val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
                }
                break;

            case 'ASISTOLIA':
                // Just noise
                noise *= 0.5;
                break;

            case 'FIBRILACION_VENTRICULAR': // Chaotic
                val = 0.5 * Math.sin(timeSeconds * 10) + 0.3 * Math.sin(timeSeconds * 23);
                break;

            case 'FIBRILACION_AURICULAR': // Irregular R-R, no P
                // P wave replaced by "f" waves
                val += 0.05 * Math.sin(timeSeconds * 50);
                // Irregular QRS (simulated by random height jitter + noise)
                if (progress > 0.29 && progress <= 0.31) val += 0.9 + (Math.random() * 0.2);
                val += noise * 2;
                break;

            case 'TAQUICARDIA_VENTRICULAR': // Large wide complex, no P
                val = 0.8 * Math.sin(phase * (Math.PI * 2) / 0.3);
                break;

            case 'BLOQUEO_AV_GRADO_1': // Prolonged PR
                // P wave earlier (at 5% instead of 10%)
                if (progress > 0.05 && progress < 0.15) {
                    val += 0.15 * Math.sin((progress - 0.05) / 0.10 * Math.PI);
                }
                // QRS (Normal spot)
                if (progress > 0.29 && progress <= 0.31) val += 1.0;
                // T wave
                if (progress > 0.45 && progress < 0.65) val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
                break;

            case 'INFARTO_AGUDO_MIOCARDIO': // ST Elevation
                // P
                if (progress > 0.10 && progress < 0.20) val += 0.15 * Math.sin((progress - 0.10) / 0.10 * Math.PI);
                // QRS
                if (progress > 0.29 && progress <= 0.31) val += 1.0;
                // ST Elevation (Significantly raised segment merging into T)
                if (progress > 0.31 && progress < 0.50) val += 0.3;
                // T
                if (progress > 0.45 && progress < 0.65) val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
                break;

            case 'BLOQUEO_AV_2_MOBITZ_1': // Wenckebach
                // We need state or a way to derive "cycle" from time.
                // beatIndex = floor(time / beatDuration)
                let beatIdx = Math.floor(timeSeconds / beatDuration);
                let cycle = beatIdx % 4; // 4 beat cycle

                // PR prolongs: 0.12, 0.17, 0.22...
                // In our normalized 'progress' (0-1), PR gap needs to grow.
                // Standard P is at 0.15 (center). QRS at 0.30. Gap = 0.15.
                // We shift P earlier or QRS later. Let's shift P earlier.

                let pStart = 0.10 - (cycle * 0.03); // Moves left: 0.10, 0.07, 0.04
                if (cycle === 3) {
                    // Blocked beat - Just P wave, NO QRS
                    if (progress > pStart && progress < pStart + 0.10) {
                        val += 0.15 * Math.sin((progress - pStart) / 0.10 * Math.PI);
                    }
                } else {
                    // Conducted beat with prolonged PR
                    if (progress > pStart && progress < pStart + 0.10) {
                        val += 0.15 * Math.sin((progress - pStart) / 0.10 * Math.PI);
                    }
                    // QRS
                    if (progress > 0.29 && progress <= 0.31) val += 1.0;
                    // T
                    if (progress > 0.45 && progress < 0.65) val += 0.25 * Math.sin((progress - 0.45) / 0.20 * Math.PI);
                }
                break;

            default:
                // Default to sinusal logic
                if (progress > 0.29 && progress <= 0.31) val += 1.0;
        }

        return val + noise;
    }

    // --- Rendering Loop ---

    function animate() {
        if (!isRunning) return;

        // Calculate delta
        const pixelsPerFrame = (CONFIG.paperSpeed * CONFIG.pixelsPerMM) / CONFIG.sampleRate; // Speed control

        // We might draw multiple sub-steps if performance is high, but let's do 1 step per frame for simplicity
        // or loop to fill the "time passed". 
        // Better: Use real delta time? For a medical simulation, fixed steps are safer for consistent waveform shapes.
        // We'll define speed as "X pixels per redraw".

        const speed = 2; // Pixels to move per frame (tweak for "sweep speed")

        ctx.lineWidth = CONFIG.lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.shadowBlur = CONFIG.shadowBlur;
        ctx.shadowColor = CONFIG.shadowColor;
        ctx.strokeStyle = CONFIG.lineColor;

        // Erase "scan bar" ahead
        // We clear a rect ahead of scanX
        const eraseWidth = CONFIG.scanBarWidth;
        ctx.clearRect(scanX, 0, eraseWidth + speed, height); // Clear minimal area

        // If we wrapped around, clear the start too
        if (scanX + eraseWidth > width) {
            ctx.clearRect(0, 0, (scanX + eraseWidth) % width, height);
        }

        // Draw Line Segment
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);

        // Advance scanX
        scanX += speed;

        // Advance Time
        // speed (px) corresponds to time?
        // If 25mm/s, and 5px/mm -> 125px/s.
        // If we move 2px per frame at 60fps -> 120px/s. Close enough.
        // So t increases by (speed / 125).
        const pxPerSec = CONFIG.paperSpeed * CONFIG.pixelsPerMM;
        t += speed / pxPerSec;

        // Calculate Y
        let rawSignal = getSignalValue(rhythmType, hr, t);

        // Map Y to canvas coords
        // -1 to 1 signal -> mapped to gain
        let y = (height * CONFIG.baselineY) - (rawSignal * CONFIG.gain);

        // Handle wrap-around
        if (scanX >= width) {
            // Jump to start
            scanX = 0;
            lastX = 0;
            lastY = y; // Don't draw a line across screen
            ctx.moveTo(0, y); // Reset path
        } else {
            ctx.lineTo(scanX, y);
            ctx.stroke();

            lastX = scanX;
            lastY = y;
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // --- Control Interface ---

    window.setRhythm = function (type, newBpm) {
        // Smooth transition? 
        rhythmType = type;
        if (newBpm) hr = newBpm;

        // If Asistolia, flatline logic is handled in getSignalValue

        // Restart loop if stopped
        if (!isRunning) {
            isRunning = true;
            animate();
        }
    };

    // Start Logic
    isRunning = true;
    animate();

    // Resize observer handles window changes, but let's ensure reset on strict resize
    window.addEventListener('resize', () => {
        scanX = 0;
        lastX = 0;
        // ctx is cleared in resizeCanvas
    });

});


