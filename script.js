// clase del cronometro
const cronometro = new Cronometro("time-container");

function getRandomValue(base, range) {
    return Math.floor(base + (Math.random() * (range * 2 + 1)) - range);
}

const uiStatus = {
    simStatus: document.getElementById("sim-status"),
    caseName: document.getElementById("current-case-name"),
    stageIndicator: document.getElementById("stage-indicator"),
    rhythmIndicator: document.getElementById("rhythm-indicator")
};

updateParameters({});

function updateParameters(params = {}) {
    const defaultValues = {
        "bp-value": "0/0",
        "spo2-value": "0",
        "capno-value": "0",
        "hr-value": "0",
        "fr-value": "0",
        "glucose-value": "0",
        "history-content": "Monitor sin conectar"
    };

    Object.keys(defaultValues).forEach(key => {
        let value = params[key];

        if (value === undefined) {
            value = defaultValues[key];
        } else if (value === "") {
            value = "--";
        } else if (!isNaN(value) && key !== "history-content") {
            value = getRandomValue(parseInt(value, 10), 5);
        }

        const element = document.getElementById(key);
        if (element) {
            element.innerHTML = value;
        }
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
    snap: {
        targets: [
            interact.snappers.grid({ x: 25, y: 25 })
        ],
        range: 25,
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

const fullscreenBtn = document.getElementById("fullscreen-btn");

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.mozFullScreenElement &&
        !document.webkitFullscreenElement && !document.msFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

fullscreenBtn.addEventListener("click", toggleFullscreen);

if (window.innerWidth < 768) {
    document.addEventListener("touchstart", toggleFullscreen, { once: true });
}

let casoActual = 0;
let etapaActual = 0;

function updateTopSummary(etapa = null) {
    const caso = casos[casoActual];
    const stageCount = caso?.etapas?.length || 0;
    const stageNumber = stageCount ? etapaActual + 1 : 0;

    if (uiStatus.caseName && caso) {
        uiStatus.caseName.textContent = caso.paciente.split(',')[0].trim();
    }

    if (uiStatus.stageIndicator) {
        uiStatus.stageIndicator.textContent = `${stageNumber}/${stageCount}`;
    }

    if (uiStatus.simStatus) {
        uiStatus.simStatus.textContent = etapa ? "Simulación en curso" : "Sin iniciar";
    }

    if (uiStatus.rhythmIndicator) {
        uiStatus.rhythmIndicator.textContent = (etapa?.ritmo || "ASISTOLIA").replaceAll('_', ' ');
    }
}

function fillCaseSelector() {
    const selectCaso = document.getElementById("caso-select");
    casos.forEach((caso, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${index + 1}. ${caso.paciente.split(",", 2).join(',')}`;
        selectCaso.appendChild(option);
    });
    updateTopSummary();
}

document.addEventListener("DOMContentLoaded", () => {
    fillCaseSelector();

    document.getElementById("caso-select").addEventListener("change", function () {
        casoActual = this.selectedIndex;
        etapaActual = 0;
        updateTopSummary();
        updateParameters({ "history-content": "Caso listo para iniciar." });
    });

    document.getElementById("iniciar_caso-btn").addEventListener("click", () => {
        etapaActual = 0;
        actualizarCaso();
        cronometro.reset();
        cronometro.start();
    });

    document.getElementById("paso_caso-btn").addEventListener("click", () => {
        if (etapaActual < casos[casoActual].etapas.length - 1) {
            etapaActual++;
            actualizarCaso();
            cronometro.mark();
        } else {
            cronometro.pause();
            updateParameters({ "history-content": "Caso finalizado." });
            if (uiStatus.simStatus) uiStatus.simStatus.textContent = "Completado";
            ritmo = "ASISTOLIA";
            setRhythm(ritmo, 0);
            if (uiStatus.rhythmIndicator) uiStatus.rhythmIndicator.textContent = "ASISTOLIA";
        }
    });

    const helpBtn = document.getElementById("help-btn");
    const helpModal = document.getElementById("help-modal");
    if (helpBtn && helpModal) {
        helpBtn.addEventListener("click", () => {
            helpModal.style.display = "flex";
        });
        helpModal.addEventListener("click", (event) => {
            if (event.target.id === "help-modal") {
                helpModal.style.display = "none";
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
            return;
        }

        if (event.key.toLowerCase() === "i") {
            document.getElementById("iniciar_caso-btn").click();
        }
        if (event.key.toLowerCase() === "a" || event.code === "Space") {
            event.preventDefault();
            document.getElementById("paso_caso-btn").click();
        }
        if (event.key.toLowerCase() === "f") {
            toggleFullscreen();
        }
        if (event.key.toLowerCase() === "r") {
            resetPositions();
        }
    });
});

function actualizarCaso() {
    const etapa = casos[casoActual].etapas[etapaActual];
    const caseTitle = casos[casoActual].paciente;
    const message = `${caseTitle}
    <hr style="border: 1px solid #1f365f; margin: 6px 0;"> 
    <strong>Etapa ${etapaActual + 1}</strong>
    <hr style="border: 1px solid #1f365f; margin: 6px 0;">
    <span style="font-style: italic; color: #b7c7ea;">${etapa.infoAdicional || "Sin información adicional"}</span>`;

    updateParameters({
        "bp-value": etapa.bp,
        "spo2-value": etapa.spo2,
        "capno-value": etapa.capno,
        "hr-value": etapa.hr,
        "fr-value": etapa.fr,
        "glucose-value": etapa.glucose,
        "history-content": message
    });

    if (!etapa.ritmo) etapa.ritmo = "ASISTOLIA";
    setRhythm(etapa.ritmo, etapa.hr);
    updateTopSummary(etapa);

    const ekgBtn = document.getElementById("ekg12d-btn");
    const ekgModal = document.getElementById("ekg-modal");
    const ekgImg = document.getElementById("ekg-modal-img");

    if (etapa.ekg12d) {
        ekgBtn.style.display = "inline-block";
        ekgBtn.onclick = () => {
            ekgImg.src = etapa.ekg12d;
            ekgModal.style.display = "flex";
        };
    } else {
        ekgBtn.style.display = "none";
    }
}
