/**
 * app/api/upload/route.js
 * POST → sube una imagen de ECG 12D
 * En Vercel: filesistema efímero en /tmp
 */
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

function getUploadDir() {
    // Vercel → /tmp/uploads, Local → ./public/uploads
    const isVercel = process.env.VERCEL === '1';
    if (isVercel) {
        return path.join(os.tmpdir(), 'uploads');
    }
    return path.join(process.cwd(), 'public', 'uploads');
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('ekgImage');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const uploadDir = getUploadDir();
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const ext = path.extname(file.name);
        const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${baseName}_${Date.now()}${ext}`;
        const filePath = path.join(uploadDir, filename);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        // En producción (Vercel) el archivo es temporal no accesible por URL
        // En local, lo servimos desde /public/uploads/
        const isVercel = process.env.VERCEL === '1';
        const publicPath = isVercel ? `/tmp/uploads/${filename}` : `/uploads/${filename}`;

        return NextResponse.json({ filePath: publicPath });
    } catch (err) {
        console.error('Upload error:', err);
        return NextResponse.json({ error: 'Error al subir archivo: ' + err.message }, { status: 500 });
    }
}
