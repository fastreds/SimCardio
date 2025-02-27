function startSimulation() {
    setInterval(updateParameters, 5000);
    setRhythm("sinus");
   
}

function getRandomValue(base, range) {
    return Math.floor(base + (Math.random() * (range * 2 + 1)) - range);
}

function updateParameters(params = {}) {
    const defaultValues = {
        "bp-value": `${getRandomValue(120, 5)}/${getRandomValue(80, 5)}`,
        "spo2-value": `${getRandomValue(97, 3)}% `,
        "capno-value": `${getRandomValue(37, 5)} `,
        "hr-value": `${getRandomValue(80, 20)} `,
        "glucose-value": `${getRandomValue(90, 20)}`
    };

    Object.keys(defaultValues).forEach(key => {
        let value = params[key];
        
        if (value === undefined) {
            value = defaultValues[key];
        } else if (value === "") {
            value = "- -";
        } else if (!isNaN(value)) {
            value = getRandomValue(parseInt(value), 5);
        }
        
        document.getElementById(key).textContent = value;
    });
}

interact('.container').draggable({
  
    onmove(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    },
            // Simulando un campo magnético (snap)
snap: {
    targets: [
        interact.snappers.grid({ x: 25, y: 25 }) // "pegado" a una cuadrícula de 25px   
    ],
    range: 30, // Distancia de atracción
    relativePoints: [{ x: 0.25, y: 0.25 }]
}
});

function resetPositions() {
    document.querySelectorAll('.container').forEach(el => {
        el.style.transform = 'translate(0, 0)';
        el.setAttribute('data-x', 0);
        el.setAttribute('data-y', 0);
    });
}


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


/*
// Llamada con algunos valores vacíos
updateParameters({
    "bp-value": "",
    "spo2-value": "",
    "capno-value": "55",
    "hr-value": "250",
    "glucose-value": ""
});

setRhythm("sinus");

// Llamada sin parámetros (usará valores por defecto)
updateParameters();*/





const casos = [
    {
        paciente: "Hombre, 58 años, sobrepeso, hipertensión, tabaquismo. Dolor torácico opresivo irradiado a brazo izquierdo, sudoración, náuseas.",
        etapas: [
            { bp: "145/90", spo2: "96", capno: "55", hr: "98", glucose: "95", ritmo: "elevacion_st" },
            { bp: "130/85", spo2: "94", capno: "55", hr: "110", glucose: "95", ritmo: "taquicardia_sinusal" },
            { bp: "105/70", spo2: "88", capno: "55", hr: "120", glucose: "95", ritmo: "fibrilacion_ventricular" },
            { bp: "125/80", spo2: "98", capno: "55", hr: "80", glucose: "95", ritmo: "sinusal" }
        ]
    }
];

let casoActual = 0;
let etapaActual = 0;

document.getElementById("iniciar_caso-btn").addEventListener("click", function () {
    etapaActual = 0;
    actualizarCaso();
});

document.getElementById("paso_caso-btn").addEventListener("click", function () {
    if (etapaActual < casos[casoActual].etapas.length - 1) {
        etapaActual++;
        actualizarCaso();
    } else {
        alert("Caso finalizado");
    }
});

function actualizarCaso() {
    const etapa = casos[casoActual].etapas[etapaActual];
    updateParameters({
        "bp-value": etapa.bp,
        "spo2-value": etapa.spo2,
        "capno-value": etapa.capno,
        "hr-value": etapa.hr,
        "glucose-value": etapa.glucose,
        "Clinic_data": casos[casoActual].paciente
    });
    setRhythm(etapa.ritmo);
}

undefined