# 📖 SimCardio — Documentación

Simulador de signos vitales para entrenamiento médico.

## Índice

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](./ARQUITECTURA.md) | Estructura del proyecto, stack tecnológico y flujo de datos |
| [Reglas de Desarrollo](./REGLAS_DESARROLLO.md) | Convenciones de código, estilo y buenas prácticas |
| [API Reference](./API.md) | Endpoints disponibles, payloads y respuestas |
| [Despliegue](./DESPLIEGUE.md) | Configuración de Vercel, variables de entorno y Redis |
| [Motor ECG](./MOTOR_ECG.md) | Documentación técnica del motor de electrocardiograma |

## Quick Start

```bash
# Instalar dependencias
npm install

# Desarrollo local (puerto 3001)
npm run dev -- --port 3001

# Build de producción
npm run build

# Iniciar producción local
npm start
```

## URLs

| Entorno | URL |
|---------|-----|
| Producción | https://sim-cardio.vercel.app |
| Local | http://localhost:3001 |
