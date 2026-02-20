/**
 * app/api/casos/route.js
 */
import { NextResponse } from 'next/server';

const { getCasos, saveCasos } = require('@/lib/redis');

export async function GET() {
    try {
        const casos = await getCasos();
        return NextResponse.json(casos);
    } catch (err) {
        console.error('GET /api/casos:', err);
        return NextResponse.json({ error: 'Error al leer casos' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Se esperaba un array de casos' }, { status: 400 });
        }
        await saveCasos(body);
        return NextResponse.json({ success: true, count: body.length });
    } catch (err) {
        console.error('POST /api/casos:', err);
        return NextResponse.json({ error: 'Error al guardar casos' }, { status: 500 });
    }
}
