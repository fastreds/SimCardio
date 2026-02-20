import './globals.css';

export const metadata = {
    title: {
        default: 'SimCardio',
        template: '%s — SimCardio',
    },
    description: 'Simulador de signos vitales y casos clínicos para entrenamiento médico',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}
