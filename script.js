function getRandomValue(base, range) {
    return Math.floor(base + (Math.random() * (range * 2 + 1)) - range);
}



/// valores iniciales para monitor sin conetar

// Llamada con algunos valores vacíos
updateParameters({

});



function updateParameters(params = {}) {
    const defaultValues = {
        "bp-value": `0`,
        "spo2-value": `0% `,
        "capno-value": `0 `,
        "hr-value": `0 `,
        "glucose-value": `0`,
        "history-container": "Monitor sin conectar"
        
    
     
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

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && !document.msFullscreenElement) {
        // Activar pantalla completa
        let elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
        // Salir de pantalla completa
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

fullscreenBtn.addEventListener("click", toggleFullscreen);

// Activar pantalla completa automáticamente en móviles al tocar la pantalla
if (window.innerWidth < 768) {
    document.addEventListener("touchstart", toggleFullscreen, { once: true });
}

/***********************************fin pantalla completa *********************************** */

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


// Gestion de casos
let casoActual = 0;
let etapaActual = 0;


/// llena el select con los casos disponibles
document.addEventListener("DOMContentLoaded", function () {
    const selectCaso = document.getElementById("caso-select");
    casos.forEach((caso, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = `Caso ${caso.paciente.split(" ",4)}`;
        selectCaso.appendChild(option);
    });
});

document.getElementById("caso-select").addEventListener("change", function () {
    casoActual = this.selectedIndex;
    etapaActual = 0;
    //actualizarCaso();
});

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
    let  message =casos[casoActual].paciente +  etapa.infoAdicional ; 
    updateParameters({
        "bp-value": etapa.bp,
        "spo2-value": etapa.spo2,
        "capno-value": etapa.capno,
        "hr-value": etapa.hr,
        "glucose-value": etapa.glucose,
        "history-container": message
    });
    if(!etapa.ritmo)  etapa.ritmo = "ASISTOLIA";
    setRhythm(etapa.ritmo,etapa.hr);
}

undefined

/***********************************fin  casos *********************************** */
