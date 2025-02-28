document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("ecg-chart").getContext("2d");
    let hr = 75;
    let ecgChart = null;
    let ecgData = Array(500).fill(0);
    const maxDataPoints = 500;
    let updateInterval = null;
    let currentInterval = 1000 / hr;
    const paperSpeed = 25;
    let rhythmType = 'sinus';

    // Parámetros ajustables para las ondas e intervalos
    let params = {
        ondaP: 0.08,
        ampOndaP: 0.1,
        segmentoPR: 0.18,
        complejoQRS: 0.10,
        ampQ: -0.1,
        ampR: 0.8,
        ampS: -0.3,
        segmentoST: 0.16,
        elevacionST: 0.05,
        intervaloQT: 0.40,
        ondaT: 0.16,
        ampOndaT: 0.25
    };

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
                    tension: 0.3,
                }],
            },
            options: {
                animation: { duration: 0 },
                responsive: true,
                elements: {
                    line: { borderWidth: 2 },
                    point: { radius: 0 },
                },
                scales: {
                    x: { display: false },
                    y: { display: false, min: -1.5, max: 1.5 },
                },
            },
        });
    }

    function generateECGPoint(bpm, index) {
        let t;
        let value = 0;

        switch (rhythmType) {
            case 'sinus':
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < params.ondaP) value = params.ampOndaP * Math.sin(t * Math.PI * 10);
                else if (t < params.ondaP + params.segmentoPR) value = 0;
                else if (t < params.ondaP + params.segmentoPR + 0.02) value = params.ampQ;
                else if (t < params.ondaP + params.segmentoPR + 0.04) value = params.ampR;
                else if (t < params.ondaP + params.segmentoPR + params.complejoQRS) value = params.ampS;
                else if (t < params.ondaP + params.segmentoPR + params.complejoQRS + params.segmentoST) 
                    value = params.elevacionST + 0.02 * Math.sin((t - (params.ondaP + params.segmentoPR + params.complejoQRS)) * Math.PI * 3);
                else if (t < params.ondaP + params.segmentoPR + params.complejoQRS + params.segmentoST + params.ondaT) 
                    value = params.ampOndaT * Math.sin((t - (params.ondaP + params.segmentoPR + params.complejoQRS + params.segmentoST)) * Math.PI * 5);
                break;
        }
        return value;
    }

    let index = 0;
    function updateECG() {
        ecgData.shift();
        ecgData.push(generateECGPoint(hr, index));
        index++;
        ecgChart.data.datasets[0].data = ecgData;
        ecgChart.update();
    }

    function startECG() {
        if (updateInterval) clearInterval(updateInterval);
        currentInterval = 1000 / hr;
        updateInterval = setInterval(updateECG, currentInterval);
    }

    createECGChart();
    startECG();

    document.getElementById("hr-slider").addEventListener("input", function () {
        hr = this.value;
        document.getElementById("hr-value").textContent = hr;
        index = 0;
        startECG();
    });

    document.getElementById("rhythm-select").addEventListener("change", function () {
        rhythmType = this.value;
        index = 0;
        startECG();
    });

    document.getElementById("fullscreen-btn").addEventListener("click", function () {
        let elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    });

    if (window.innerWidth < 768) {
        document.addEventListener("touchstart", function () {
            let elem = document.documentElement;
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
            else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
        }, { once: true });
    }

    document.querySelectorAll(".param-slider").forEach(slider => {
        slider.addEventListener("input", function () {
            let paramName = this.dataset.param;
            params[paramName] = parseFloat(this.value);
            document.getElementById(paramName + "-value").textContent = this.value;
            index = 0;
            startECG();
        });
    });
});
