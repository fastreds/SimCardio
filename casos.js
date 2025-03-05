const casos = [
    /*{
        paciente: "Hombre, 98 años, insuficiencia cardíaca avanzada. Encontrado inconsciente.",
        etapas: [
            {infoAdicional: "Paciente encontrado sin respuesta", bp: "--", spo2: "--", capno: "--", hr: "40", glucose: "--", ritmo: "BLOQUE_AV_MOBITZ_1" },
            {infoAdicional: "No respuesta tras RCP y adrenalina", bp: "--", spo2: "--", capno: "--", hr: "48", glucose: "--", ritmo: "BRADI_SINUSAL" },
            {infoAdicional: "Se aplica adrenalina, no hay respuesta", bp: "--", spo2: "--", capno: "--", hr: "60", glucose: "--", ritmo: "BAV1" }
        ]
    },*/
    {
        paciente: "CM - Funcionaria LANAMME en OBS, 58 años, indica sentir  dolor de pecho, \"un poquito de falta de aire\". 20 minutos de evolución.",
        etapas: [
            {infoAdicional: "La paciente luce diaforética."},
            {infoAdicional: "El paciente impresiona mal aspecto general. La paciente está afebril, ", bp: "75/45", spo2: "85", capno: "0", hr: "32", glucose: "95", ritmo: "BRADI_SINUSAL" },
            {infoAdicional: "Han cosiderado usar atropina ", bp: "75/45", spo2: "92", capno: "41", hr: "45", glucose: "95", ritmo: "BRADI_SINUSAL" },
            {infoAdicional: "Cuando estaban tomando un electrocardiogramas de 12 derivaciones, el paciente no responde, ha desaturado", bp: "--", spo2: "--", capno: "--", hr: "180", glucose: "95", ritmo: "TV" },
            {infoAdicional: "Paciente Inconsciente", bp: "0/0", spo2: "52", capno: "45", hr: "85", glucose: "00", ritmo: "SINUSAL" },
            {infoAdicional: "Paciente Inconsciente", bp: "75/60", spo2: "82", capno: "40", hr: "110", glucose: "-", ritmo: "SINUSAL" },
            {infoAdicional: "Paciente genera ruidos, parece que su nivel de conciencia ha mejorado", bp: "95/80", spo2: "98", capno: "55", hr: "80", glucose: "95", ritmo: "IAM" }
        ]
    },
    {
        paciente: "Cancha de Futbol, Hombre, 45 años, diabético tipo 2, colapsa súbitamente. us es parte del equipo de trabajo de una ambulancia",
        etapas: [
            {infoAdicional: "Monitor sin Conectar"},
            {infoAdicional: "Colapso súbito en estacionamiento", bp: "--", spo2: "--", capno: "--", hr: "190", glucose: "--", ritmo: "FV" },
            {infoAdicional: "Se aplica descarga con DEA", bp: "75/50", spo2: "82", capno: "--", hr: "50", glucose: "105", ritmo: "BRADI_SINUSAL" },
            {infoAdicional: "Paciente comienza a reaccionar", bp: "120/85", spo2: "96", capno: "--", hr: "75", glucose: "105", ritmo: "SINUSAL" }
        ]
    },
    {
        paciente: "BS - Mujer, 42 años, Hipertensa tratada con atenolol, sin revisión reciente. Mareos y fatiga Le refiere a la enferemera en el triage que le costó lenvantarse del inodoro.",
        etapas: [
            {infoAdicional: "No tiene buen aspecto"},
            {infoAdicional: "Paciente con mareos y fatiga", bp: "75/45", spo2: "85", capno: "36", hr: "32", glucose: "92", ritmo: "BLOQUE_AV_MOBITZ_1" },
            {infoAdicional: "Paciente con mareos y fatiga", bp: "70/35", spo2: "95", capno: "36", hr: "40", glucose: "n/d", ritmo: "BLOQUE_AV_MOBITZ_1" },
            {infoAdicional: "Paciente con mareos y fatiga", bp: "60/35", spo2: "87", capno: "36", hr: "40", glucose: "95", ritmo: "BLOQUE_AV_MOBITZ_1" },
            {infoAdicional: "Paciente con mareos y fatiga", bp: "65/35", spo2: "87", capno: "36", hr: "40", glucose: "95", ritmo: "BLOQUE_AV_MOBITZ_1" },
            {infoAdicional: "Paciente con mareos y fatiga", bp: "00/00", spo2: "87", capno: "36", hr: "40", glucose: "95", ritmo: "BLOQUE_AV_MOBITZ_1" },
            {infoAdicional: "Paciente con alteración del estado de conciencia", bp: "0/0", spo2: "0", capno: "--", hr: "0", glucose: "0", ritmo: "ASISTOLIA" },
            {infoAdicional: "Paciente con mareos y fatiga", bp: "64/35", spo2: "87", capno: "36", hr: "75", glucose: "95", ritmo: "BRADI_SINUSAL" }, // MARCAPASO 
            {infoAdicional: "Se coloca marcapasos transcutáneo", bp: "120/75", spo2: "98", capno: "--", hr: "65", glucose: "110", ritmo: "SINUSAL" }
        ]
    },
    {
        paciente: "T  Hombre, 65 años, Paciente ingresda a recepción refiere dolor torácico, y cae subitamente. los compañeros lo llevan a enfermeria.",
        etapas: [
            {infoAdicional: "Monitor sin Conectar"},
            {infoAdicional: "Paciente con palpitaciones rápidas", bp: "0/0", spo2: "0", capno: "--", hr: "140", glucose: "0", ritmo: "FV" },
            {infoAdicional: "Paciente con palpitaciones rápidas", bp: "0/0", spo2: "0", capno: "--", hr: "140", glucose: "0", ritmo: "TV" },
            {infoAdicional: "Paciente con palpitaciones rápidas", bp: "0/0", spo2: "0", capno: "--", hr: "140", glucose: "0", ritmo: "FV" },
            {infoAdicional: "Paciente con palpitaciones rápidas", bp: "0/0", spo2: "0", capno: "--", hr: "140", glucose: "0", ritmo: "TV" },
            {infoAdicional: "Frecuencia cardíaca controlada con betabloqueadores", bp: "135/80", spo2: "96", capno: "--", hr: "101", glucose: "120", ritmo: "SINUSAL" }
        ]
    },
    {
        paciente: "AESP Hombre, 52 años. Encontrado inconsciente  en farmacia.",
        etapas: [
            {infoAdicional: "Monitor sin Conectar"},
            {infoAdicional: "Paciente encontrado sin respuesta", bp: "--", spo2: "--", capno: "--", hr: "0", glucose: "--", ritmo: "ASISTOLIA" },
            {infoAdicional: "Lo estan estudiando por insuficiencia Renal", bp: "--", spo2: "--", capno: "--", hr: "0", glucose: "--", ritmo: "ASISTOLIA" },
            {infoAdicional: "Paciente encontrado sin respuesta", bp: "--", spo2: "--", capno: "--", hr: "89", glucose: "--", ritmo: "SINUSAL" },
            {infoAdicional: "Paciente encontrado sin respuesta", bp: "--", spo2: "--", capno: "--", hr: "79", glucose: "--", ritmo: "SINUSAL" },
            {infoAdicional: "Paciente encontrado sin respuesta", bp: "145/70", spo2: "97", capno: "--", hr: "115", glucose: "--", ritmo: "SINUSAL" },
        ]
    }
];
