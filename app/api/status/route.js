import { NextResponse } from 'next/server';
import { storageMode } from '@/lib/redis';

export async function GET() {
    return NextResponse.json({
        storage: storageMode(),
        framework: 'nextjs',
        timestamp: new Date().toISOString(),
    });
}
