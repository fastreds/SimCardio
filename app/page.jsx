import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
    title: 'SimCardio — Inicio',
    description: 'Simulador de signos vitales y casos clínicos para entrenamiento médico',
};

const MENU_ITEMS = [
    {
        href: '/monitor',
        icon: '⚡',
        title: 'Simulador',
        desc: 'Monitor de signos vitales en tiempo real',
        enabled: true,
        color: 'green',
    },
    {
        href: '/editor',
        icon: '🛠️',
        title: 'Mantenimiento',
        desc: 'Editor de casos clínicos y configuración',
        enabled: true,
        color: 'blue',
    },
    {
        href: '#',
        icon: '📚',
        title: 'Material Educativo',
        desc: 'Próximamente: Guías y recursos',
        enabled: false,
        color: 'muted',
    },
];

export default function HomePage() {
    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoDot} />
                    <h1 className={styles.logoText}>SimCardio</h1>
                </div>
                <p className={styles.subtitle}>Sistema de Simulación Clínica</p>
            </header>

            {/* Cards */}
            <div className={styles.grid}>
                {MENU_ITEMS.map((item) => (
                    item.enabled ? (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.card} ${styles[`card_${item.color}`]}`}
                        >
                            <CardContent item={item} />
                        </Link>
                    ) : (
                        <div
                            key={item.title}
                            className={`${styles.card} ${styles.cardDisabled}`}
                        >
                            <CardContent item={item} />
                            <span className={styles.comingSoon}>Próximamente</span>
                        </div>
                    )
                ))}
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <span>SimCardio v2.0</span>
                <span>·</span>
                <span>Entrenamiento Médico</span>
            </footer>
        </main>
    );
}

function CardContent({ item }) {
    return (
        <>
            <div className={styles.cardIcon}>{item.icon}</div>
            <div className={styles.cardTitle}>{item.title}</div>
            <div className={styles.cardDesc}>{item.desc}</div>
        </>
    );
}
