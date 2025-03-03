    // Generar un solo punto de datos para el ECG basado en el ritmo
    function generateECGPoint(bpm, index) {
        let t;
        let value = 0;
        let duracionOndaP = 0;
        let segmentoPR = 0;
        let complejoQRS = 0;
        let intervaloQT = 0;

        switch (rhythmType) {
            case 'SINUSAL': // Ritmo Sinusal
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                //TIEMPO DE LAS ONDAS
                // Definimos duraciones de cada onda/segmento en proporción al ciclo cardíaco
                duracionOndaP = 0.08;  // 80 ms
                segmentoPR = 0.04;     // 120 ms
                complejoQRS = 0.10;    // 100 ms
                intervaloQT = 0.004;    // 400 ms

                //ELEVACIONES  DE LAS ONDAS
                if (t < duracionOndaP) value = 0.05 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < duracionOndaP + segmentoPR) value = 0; // Segmento PR (Isoeléctrico)
                else if (t < duracionOndaP + segmentoPR + 0.02) value = -0.15; // Onda Q
                else if (t < duracionOndaP + segmentoPR + 0.04) value = 0.8; // Pico R
                else if (t < duracionOndaP + segmentoPR + complejoQRS) value = -0.03; // Onda S
                else if (t < duracionOndaP + segmentoPR + complejoQRS + intervaloQT) value = 0.10 * Math.sin(t * Math.PI * 10); // Onda t

                break;

            case 'IAM': // IAM
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                //TIEMPO DE LAS ONDAS
                // Definimos duraciones de cada onda/segmento en proporción al ciclo cardíaco
                duracionOndaP = 0.08;  // 80 ms
                segmentoPR = 0.04;     // 120 ms
                complejoQRS = 0.10;    // 100 ms
                intervaloQT = 0.004;    // 400 ms

                //ELEVACIONES  DE LAS ONDAS
                if (t < duracionOndaP) value = 0.05 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < duracionOndaP + segmentoPR) value = 0; // Segmento PR (Isoeléctrico)
                else if (t < duracionOndaP + segmentoPR + 0.02) value = -0.15; // Onda Q
                else if (t < duracionOndaP + segmentoPR + 0.04) value = 0.8; // Pico R
                else if (t < duracionOndaP + segmentoPR + complejoQRS) value = 0.15; // Onda S
                else if (t < duracionOndaP + segmentoPR + complejoQRS + intervaloQT) value = 0.10 * Math.sin(t * Math.PI * 10); // Onda t

            case 'BRADI_SINUSAL': // BRADICARDIA  Sinusal
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((20 / bpm) * 250);
                //TIEMPO DE LAS ONDAS
                // Definimos duraciones de cada onda/segmento en proporción al ciclo cardíaco
                duracionOndaP = 0.05;  // 80 ms
                segmentoPR = 0.04;     // 120 ms
                complejoQRS = 0.5;    // 100 ms
                intervaloQT = 0.001;    // 400 ms

                //ELEVACIONES  DE LAS ONDAS
                if (t < duracionOndaP) value = 0.05 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < duracionOndaP + segmentoPR) value = 0; // Segmento PR (Isoeléctrico)
                else if (t < duracionOndaP + segmentoPR + 0.02) value = -0.15; // Onda Q
                else if (t < duracionOndaP + segmentoPR + 0.04) value = 0.8; // Pico R
                else if (t < duracionOndaP + segmentoPR + complejoQRS) value = -0.03; // Onda S
                else if (t < duracionOndaP + segmentoPR + complejoQRS + intervaloQT) value = 0.10 * Math.sin(t * Math.PI * 10); // Onda t


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


                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < 0.05) value = 0.05; // Onda P casi inexistente
                else if (t < 0.2) value = 0.35 * Math.sin(t * Math.PI * 10); // Pico QRS
                else if (t < 0.24) value = -0.8 * Math.sin(t * Math.PI * 5); // Onda S
                else if (t < 0.25) value = 0.01; // Onda T pequeña o inexistente
                else if (t < 0.30) value = 0.05 * Math.sin((t - 0.25) * Math.PI * 4); // Onda T
                break;

            case 'FV': // Fibrilación Ventricular (Ritmo desorganizado)
                t = 0.04;// Tiempo normalizado en segundos

                // Simulamos una señal caótica combinando ruido aleatorio con una serie de senoidales
                let ruido = (Math.random() - 0.5) * 0.1; // Ruido aleatorio con amplitud variable
                let oscilacion = 0.5 * Math.sin(t * Math.PI * (5 + Math.random() * 15)); // Oscilaciones rápidas

                // La señal es una suma de ruido y oscilaciones erráticas
                value = ruido + oscilacion;
                break;

            case 'TSV': // TAQUICARDIA SUPRA VENTRICULAR

                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < 0.1) value = 0.0 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < 0.12) value = -0.15; // Onda Q
                else if (t < 0.14) value = 0.8; // Pico R
                else if (t < 0.16) value = -0.3; // Onda S
                else if (t < 0.3) value = 0.25 * Math.sin((t - 0.16) * Math.PI * 5); // Onda T
                break;

            case 'BS': // Bradicardia Sinusal

                t = (index % Math.round((50 / bpm) * 250)) / Math.round((60 / bpm) * 250);
                if (t < 0.1) value = 0.1 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < 0.12) value = -0.15; // Onda Q
                else if (t < 0.125) value = 0.8; // Pico R
                else if (t < 0.16) value = -0.3; // Onda S
                else if (t < 0.2) value = 0.25 * Math.sin((t - 0.16) * Math.PI * 5); // Onda T


                break;

            case 'Asistolia': // Asistolia (Ritmo plano)


                // Ajustamos 't' para generar una señal que sea prácticamente plana
                t = (index % Math.round((paperSpeed / bpm) * 1)) / Math.round((60 / bpm) * 1000); // Sin actividad regular

                // Simulamos una señal muy suave con pequeñas oscilaciones aleatorias
                value = randomBetween(-0.01, 0.01); // Oscilaciones muy pequeñas (simulando una línea base)

                // La señal será prácticamente plana con apenas variación
                break;

            case 'BAV1': // Bloqueo AV de primer grado


                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((20 / bpm) * 250);

                //TIEMPO DE LAS ONDAS
                // Definimos duraciones de cada onda/segmento en proporción al ciclo cardíaco
                duracionOndaP = 0.05;
                segmentoPR = 0.3
                complejoQRS = 0.055;
                intervaloQT = 0.1;

                //ELEVACIONES  DE LAS ONDAS
                if (t < duracionOndaP) value = 0.08 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < duracionOndaP + segmentoPR) value = 0; // Segmento PR (Isoeléctrico)
                else if (t < duracionOndaP + segmentoPR + 0.02) value = -0.15; // Onda Q
                else if (t < duracionOndaP + segmentoPR + complejoQRS) value = 0.8; // Pico R
                else if (t < duracionOndaP + segmentoPR + intervaloQT) value = 0; // Onda S
                else if (t < duracionOndaP + segmentoPR + intervaloQT + 0.051) value = 0.03; // Onda T

                break;

            case 'FA': // Fibrilación Auricular
                // Variación del intervalo entre latidos (simulando respiración)
                let variacionRR = 0.55 * Math.sin(index / 300); // Variación lenta y progresiva (±15% del ciclo)
                let bpmVariable = bpm * (1 + variacionRR); // Ajuste de BPM dinámico

                // Calculamos el tiempo del ciclo cardíaco ajustado a la variabilidad
                t = (index % Math.round((paperSpeed / bpmVariable) * 250)) / Math.round((60 / bpmVariable) * 250);

                // Duraciones de las ondas ECG
                duracionOndaP = 0.08;
                segmentoPR = 0.04;
                complejoQRS = 0.10;
                intervaloQT = 0.40;

                // Onda P
                if (t < duracionOndaP) value = 0.05 * Math.sin(t * Math.PI * 10);
                // Segmento PR
                else if (t < duracionOndaP + segmentoPR) value = 0;
                // Complejo QRS
                else if (t < duracionOndaP + segmentoPR + 0.02) value = -0.15;
                else if (t < duracionOndaP + segmentoPR + 0.04) value = 0.8;
                else if (t < duracionOndaP + segmentoPR + complejoQRS) value = -0.03;
                // Onda T
                else if (t < duracionOndaP + segmentoPR + complejoQRS + intervaloQT) value = 0.10 * Math.sin(t * Math.PI * 10);

                break;

            //Bloque AV de Segundo Grado Tipo Mobitz I (Wenckebach)
            case 'BLOQUE_AV_MOBITZ_1':
                let ciclo = Math.floor(index / maxDataPoints) % 2; // Cada 4 ciclos, bloquea QRS
                let prProlongado = 0.12 + (0.05 * ciclo); // PR se prolonga en cada latido

                // Si es el último ciclo antes del bloqueo, no se genera QRS
                let latidoBloqueado = (ciclo === 3);

                // Tiempo dentro del ciclo cardíaco
                t = (index % Math.round((paperSpeed / bpm) * 250)) / Math.round((60 / bpm) * 250);

                // Definimos las duraciones ajustadas dinámicamente
                duracionOndaP = 0.08;
                segmentoPR = latidoBloqueado ? 0 : prProlongado; // Si hay bloqueo, PR es infinito
                complejoQRS = latidoBloqueado ? 0 : 0.035;
                intervaloQT = latidoBloqueado ? 0 : 0.1;

                // Generación del ECG
                if (t < duracionOndaP) value = 0.1 * Math.sin(t * Math.PI * 10); // Onda P
                else if (t < duracionOndaP + segmentoPR) value = 0; // Segmento PR
                else if (!latidoBloqueado) {
                    if (t < duracionOndaP + segmentoPR + 0.02) value = -0.15; // Onda Q
                    else if (t < duracionOndaP + segmentoPR + complejoQRS) value = 0.8; // Pico R
                    else if (t < duracionOndaP + segmentoPR + intervaloQT) value = 0; // Onda S
                    else if (t < duracionOndaP + segmentoPR + intervaloQT + 0.051) value = 0.03; // Onda T
                }
                break;


        }
        return value;

    }