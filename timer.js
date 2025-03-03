class Cronometro {
    constructor(containerId) {
        this.timeContainer = document.getElementById(containerId);
        this.timeDisplay = this.timeContainer.children[0]; // Primer <p> para el tiempo
        this.marksDisplay = this.timeContainer.children[1]; // Segundo <p> para las marcas
        this.timer = null;
        this.seconds = 0;
        this.running = false;
        this.marks = [];
        this.updateDisplay(); // Inicializa la pantalla en 00:00
    }

    updateDisplay() {
        let min = Math.floor(this.seconds / 60);
        let sec = this.seconds % 60;
        this.timeDisplay.textContent = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
        this.marksDisplay.innerHTML = this.marks.length > 0 ? "<div>" + this.marks.map(mark => `${mark} - `).join('') + `</div>` : "-";
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.timer = setInterval(() => {
                this.seconds++;
                this.updateDisplay();
            }, 1000);
        }
    }

    pause() {
        this.running = false;
        clearInterval(this.timer);
    }

    reset() {
        this.running = false;
        clearInterval(this.timer);
        this.seconds = 0;
        this.marks = [];
        this.updateDisplay();
    }

    mark() {
        let min = Math.floor(this.seconds / 60);
        let sec = this.seconds % 60;
        let mark = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
        this.marks.push(mark);
        this.updateDisplay();
    }

    getMarks() {
        return this.marks;
    }
}

// Uso del cronómetro
//const cronometro = new Cronometro("time-container");

// Llamadas de ejemplo:
// cronometro.start();
// cronometro.pause();
// cronometro.reset();
// cronometro.mark();
// console.log(cronometro.getMarks());
