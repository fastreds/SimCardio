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
        paciente: "Funcionario LANAME en OBS, 58 años, sobrepeso, hipertensión, tabaquismo. Dolor torácico opresivo irradiado a brazo izquierdo, sudoración, náuseas.",
        etapas: [
            {infoAdicional: "Monitor sin Conectar"},
            {infoAdicional: "El paciente impresiona mal aspecto general.", bp: "75/55", spo2: "85", capno: "40", hr: "48", glucose: "95", ritmo: "BLOQUE_AV_MOBITZ_1" },
            {infoAdicional: "Cuando estaban tomando un electrocardiogramas de 12 derivaciones, el paciente no responde, ha desaturado", bp: "--", spo2: "--", capno: "--", hr: "180", glucose: "95", ritmo: "TV" },
            {infoAdicional: "Paciente Inconsciente", bp: "0/0", spo2: "0", capno: "--", hr: "120", glucose: "95", ritmo: "FV" },
            {infoAdicional: "Paciente Inconsciente", bp: "0/0", spo2: "0", capno: "--", hr: "180", glucose: "-", ritmo: "TV" },
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
        paciente: "Mujer, 72 años, insuficiencia cardíaca, marcapasos sin revisión reciente. Mareos y fatiga.",
        etapas: [
            {infoAdicional: ""},
            {infoAdicional: "Paciente con mareos y fatiga", bp: "100/60", spo2: "97", capno: "--", hr: "38", glucose: "110", ritmo: "BAV3" },
            {infoAdicional: "Paciente con alteración del estado de conciencia", bp: "85/50", spo2: "95", capno: "--", hr: "30", glucose: "110", ritmo: "BAV3" },
            {infoAdicional: "Se coloca marcapasos transcutáneo", bp: "120/75", spo2: "98", capno: "--", hr: "70", glucose: "110", ritmo: "marcapasos" }
        ]
    },
    {
        paciente: "Hombre, 35 años, Deportista. Refiere Palpitaciones y disnea leve.",
        etapas: [
            {infoAdicional: "Monitor sin Conectar"},
            {infoAdicional: "Paciente con palpitaciones rápidas", bp: "70/55", spo2: "94", capno: "--", hr: "140", glucose: "120", ritmo: "FA" },
            {infoAdicional: "Frecuencia cardíaca controlada con betabloqueadores", bp: "135/80", spo2: "96", capno: "--", hr: "75", glucose: "120", ritmo: "FA" }
        ]
    },
    {
        paciente: "Hombre, 78 años, insuficiencia cardíaca avanzada. Encontrado inconsciente.",
        etapas: [
            {infoAdicional: "Monitor sin Conectar"},
            {infoAdicional: "Paciente encontrado sin respuesta", bp: "--", spo2: "--", capno: "--", hr: "0", glucose: "--", ritmo: "asistolia" },
            {infoAdicional: "No respuesta tras RCP y adrenalina", bp: "--", spo2: "--", capno: "--", hr: "0", glucose: "--", ritmo: "asistolia" }
        ]
    }
];
