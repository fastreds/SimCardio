document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("ecg-chart").getContext("2d");
    let hr = 75; // Frecuencia cardíaca inicial
    let ecgChart = null;
    let ecgData = Array(500).fill(0); // Datos iniciales del ECG
    const maxDataPoints = 500; // Máximo de puntos en el gráfico
    let updateInterval = null; // Intervalo de actualización
    let currentInterval = 1000 / hr; // Intervalo en milisegundos (cada latido debe ser 1 segundo)
    const paperSpeed = 25; // Velocidad del papel en mm/s (típico para 25 mm/s)
    let rhythmType = 'sinus'; // Ritmo inicial
    window.setRhythm = setRhythm;

    // Crear el gráfico
    function createECGChart() {
        if (ecgChart !== null) {
            ecgChart.destroy();
        }

        ecgChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: Array(maxDataPoints).fill(""),
                datasets: [{
                    label: "ECG",
                    borderColor: "green",
                    borderWidth: 2,
                    fill: true,
                    data: ecgData,
                    tension: 0.1, // Suaviza la línea para dar fluidez
                }],
            },
            options: {
                animation: {
                    duration: 0, // Deshabilitar animaciones internas para mejor control
                },
                responsive: true,
                elements: {
                    line: { borderWidth: 2 }, // Mantener grosor uniforme
                    point: { radius: 0 }, // Ocultar puntos individuales
                },
                scales: {
                    x: { display: false },
                    y: { display: false, min: -1.5, max: 1.5 },
                },
            },
        });
    }

    // Generar un solo punto de datos para el ECG basado en el ritmo
    function generateECGPoint(bpm, index) {
        let t;
        let value = 0;

        switch (rhythmType) {
            case 'sinus': // Ritmo Sinusal
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                 // Definimos duraciones de cada onda/segmento en proporción al ciclo cardíaco
                let duracionOndaP = 0.08;  // 80 ms
                let segmentoPR = 0.08;     // 120 ms
                let complejoQRS = 0.10;    // 100 ms
                let segmentoST = 0.1;   
                let intervaloQT = 0.005;    // 400 ms
                let ondaT = 0.10;    // 400 ms

                if (t < duracionOndaP) value = 0.1 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < duracionOndaP + segmentoPR) value = 0; // Segmento PR (Isoeléctrico)
                else if (t < duracionOndaP + segmentoPR + 0.02) value = -0.15; // Onda Q
                else if (t < duracionOndaP + segmentoPR + 0.04) value = 0.8; // Pico R
                else if (t < duracionOndaP + segmentoPR + complejoQRS ) value = 0; // Onda S
                else if (t < duracionOndaP + segmentoPR + complejoQRS + segmentoST) value = 0; // Segmento ST 
                else if (t < duracionOndaP + segmentoPR + complejoQRS + segmentoST + intervaloQT) value = 0.25 * Math.sin((t - (duracionOndaP + segmentoPR + complejoQRS + segmentoST)) * Math.PI * 5); // Onda T
                else if (t < duracionOndaP + segmentoPR + complejoQRS + segmentoST + intervaloQT) value = value = 0.5 * Math.sin(t * Math.PI * 10); // Onda T
                break;

                

            case 'afib': // Fibrilación Auricular
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < 0.05) value = 0.1 * Math.sin(t * Math.PI * 15); // Onda P errática
                else if (t < 0.1) value = -0.2; // Onda Q irregular
                else if (t < 0.12) value = 0.6; // Pico R
                else if (t < 0.18) value = -0.4; // Onda S
                else if (t < 0.25) value = 0.2 * Math.sin((t - 0.18) * Math.PI * 4); // Onda T irregular
                break;

            case 'TV': // Taquicardia Ventricular

                bpm = 165;
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < 0.05) value = 0.1; // Onda P casi inexistente
                else if (t < 0.2) value = 0.25 * Math.sin(t * Math.PI * 10); // Pico QRS
                else if (t < 0.24) value = -0.8 * Math.sin(t * Math.PI * 5); // Onda S
                else if (t < 0.25) value = 0.0; // Onda T pequeña o inexistente
                else if (t < 0.30) value = 0.2 * Math.sin((t - 0.25) * Math.PI * 4); // Onda T
                break;

            case 'FV': // Fibrilación Ventricular (Ritmo desorganizado)
                bpm = 250; // Frecuencia cardíaca elevada para un ritmo rápido (taquicardia)
                // Ajustamos 't' para incrementar la irregularidad entre las ondas
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * randomBetween(250, 350)); // Tiempo irregular

                // Generación de ondas más redondas y con intervalos irregulares
                if (t < 0.05) value = 0.1 * Math.sin(t * Math.PI * randomBetween(0.5, 1)); // Onda pequeña y suave (P casi inexistente)
                else if (t < 0.15) value = 0.4 * Math.sin(t * Math.PI * randomBetween(0.8, 1.2)); // Pico QRS suave y redondeado
                else if (t < 0.18) value = -0.4 * Math.sin(t * Math.PI * randomBetween(1, 1.5)); // Onda S redonda
                else if (t < 0.22) value = 0.0; // Onda T pequeña o inexistente
                else if (t < 0.25) value = 0.2 * Math.sin((t - randomBetween(-0.5, 2)) * Math.PI * randomBetween(1.5, 2.5)); // Onda T pequeña y suave, más redonda
                else if (t < 0.30) value = -0.25 * Math.sin((t - randomBetween(-0.2, 1.5)) * Math.PI * randomBetween(2, 3)); // Oscilación pequeña y redondeada
                else if (t < 0.32) value = 0.3 * Math.sin((t - randomBetween(-0.1, 0.7)) * Math.PI * randomBetween(3, 4)); // Oscilación suave y redonda
                else if (t < 0.34) value = -0.2 * Math.sin(t * Math.PI * randomBetween(1.5, 2)); // Oscilación rápida y suave, sin picos bruscos
                else if (t < 0.36) value = 0.1 * Math.sin(t * Math.PI * randomBetween(1.2, 1.8)); // Otra pequeña oscilación redondeada
                break;

            case 'TSV': // Ritmo Sinusal
                bpm = 189;
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < 0.1) value = 0.0 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < 0.12) value = -0.15; // Onda Q
                else if (t < 0.14) value = 0.8; // Pico R
                else if (t < 0.16) value = -0.3; // Onda S
                else if (t < 0.3) value = 0.25 * Math.sin((t - 0.16) * Math.PI * 5); // Onda T
                break;

            case 'BS': // Bradicardia Sinusal
                bpm = 45; // Forzar la frecuencia a 45 latidos por minuto para bradicardia
                t = (index % Math.round((50 / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < 0.1) value = 0.1 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < 0.12) value = -0.15; // Onda Q
                else if (t < 0.125) value = 0.8; // Pico R
                else if (t < 0.16) value = -0.3; // Onda S
                else if (t < 0.2) value = 0.25 * Math.sin((t - 0.16) * Math.PI * 5); // Onda T


                hrSlider.disabled = true; // Bloquear el slider
                break;

            case 'Asistolia': // Asistolia (Ritmo plano)
                bpm = 0; // No hay latidos en asistolia, por lo que la frecuencia es 0

                // Ajustamos 't' para generar una señal que sea prácticamente plana
                t = (index % Math.round((paperSpeed / bpm) * 1)) / Math.round((60 / bpm) * 1000); // Sin actividad regular

                // Simulamos una señal muy suave con pequeñas oscilaciones aleatorias
                value = randomBetween(-0.01, 0.01); // Oscilaciones muy pequeñas (simulando una línea base)

                // La señal será prácticamente plana con apenas variación
                break;

            case 'BAV1': // Bloqueo AV de primer grado
                bpm = 50; // Frecuencia cardíaca

                // Intervalo PR prolongado (30 ms = 0.030 segundos)
                const intervaloPR = 0.030; // Intervalo PR mínimo

                // Calcular el valor de 't' para el retraso en el intervalo PR
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);

                // Generar la señal ECG con la prolongación del intervalo PR
                if (t < 0.1) value = 0.1 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < 0.1) value = -0.15; // Onda Q (con un retraso mínimo de 30ms)
                else if (t < 0.14 + intervaloPR) value = 0.8; // Pico R
                else if (t < 0.16) value = -0.3; // Onda S
                else if (t < 0.3) value = 0.25 * Math.sin((t - 0.16) * Math.PI * 5); // Onda T
                break;



            default:
                break;
        }
        // Actualizar el slider
        hrSlider.value = bpm;
        hrValue.textContent = bpm;
        hrSlider.disabled = false; // Desbloquear el slider después de actualizar
        return value;
    }

    let index = 0; // Control de avance de la onda

    // Actualizar el gráfico con desplazamiento
    function updateECG() {
        ecgData.shift();
        ecgData.push(generateECGPoint(hr, index));
        index++;

        ecgChart.data.datasets[0].data = ecgData;
        ecgChart.update();
    }

    // Iniciar el ECG con movimiento continuo
    function startECG() {
        if (updateInterval) clearInterval(updateInterval);

        currentInterval = 1000 / hr;
        updateInterval = setInterval(updateECG, currentInterval);
    }

    // Inicializar el gráfico y comenzar la simulación
    createECGChart();
    startECG();

    // Control de frecuencia cardíaca
    const hrSlider = document.getElementById("hr-slider");
    const hrValue = document.getElementById("hr-value");

    hrSlider.addEventListener("input", function () {
        hr = this.value;
        hrValue.textContent = hr;
        index = 0; // Reiniciar el ciclo
        startECG(); // Reiniciar con la nueva frecuencia
    });


    function setRhythm(type) {
        rhythmType = type;
        index = 0;
        startECG();
    }
    // Menú desplegable para seleccionar el ritmo
    const rhythmSelect = document.getElementById("rhythm-select");

    rhythmSelect.addEventListener("change", function () {
        rhythmType = this.value;
        index = 0; // Reiniciar el ciclo
        startECG(); // Reiniciar con el nuevo ritmo
    });

    // Pantalla completa
    const fullscreenBtn = document.getElementById("fullscreen-btn");

    function enterFullscreen() {
        let elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    }

    fullscreenBtn.addEventListener("click", enterFullscreen);

    if (window.innerWidth < 768) {
        document.addEventListener("touchstart", enterFullscreen, { once: true });
    }

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
});
