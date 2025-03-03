document.addEventListener("DOMContentLoaded", function () {
    const ritmoDisplay = document.getElementById("ritmo-display");
    const opcionesContainer = document.getElementById("opciones-container");
    const resultadoTexto = document.getElementById("resultado");
    const btnSiguiente = document.getElementById("btn-siguiente");

    let ritmosDisponibles = [];
    let ritmoActual = {};

    // Cargar los ritmos desde ritmos.js
    async function cargarRitmos() {
        try {
            const response = await fetch("ritmos.js");
            const data = await response.json();
            ritmosDisponibles = data.ritmos;
            seleccionarNuevoRitmo();
        } catch (error) {
            console.error("Error cargando los ritmos:", error);
        }
    }

    function seleccionarNuevoRitmo() {
        resultadoTexto.textContent = "";
        btnSiguiente.style.display = "none";

        if (ritmosDisponibles.length === 0) {
            resultadoTexto.textContent = "No hay más ritmos disponibles.";
            return;
        }

        const indiceAleatorio = Math.floor(Math.random() * ritmosDisponibles.length);
        ritmoActual = ritmosDisponibles[indiceAleatorio];

        ritmoDisplay.innerHTML = `<img src="${ritmoActual.imagen}" alt="ECG" class="ritmo-imagen">`;

        opcionesContainer.innerHTML = "";
        ritmoActual.opciones.forEach(opcion => {
            const boton = document.createElement("button");
            boton.textContent = opcion;
            boton.classList.add("opcion-boton");
            boton.onclick = () => verificarRespuesta(opcion);
            opcionesContainer.appendChild(boton);
        });
    }

    function verificarRespuesta(opcionSeleccionada) {
        if (opcionSeleccionada === ritmoActual.correcto) {
            resultadoTexto.textContent = "¡Correcto!";
            resultadoTexto.style.color = "green";
        } else {
            resultadoTexto.textContent = `Incorrecto. La respuesta correcta es: ${ritmoActual.correcto}`;
            resultadoTexto.style.color = "red";
        }
        btnSiguiente.style.display = "block";
    }

    btnSiguiente.addEventListener("click", seleccionarNuevoRitmo);

    cargarRitmos();
});
