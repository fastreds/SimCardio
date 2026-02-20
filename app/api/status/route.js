/**
 * app/api/status/route.js
 */
import { NextResponse } from 'next/server';

const { storageMode } = require('@/lib/redis');

export async function GET() {
    return NextResponse.json({
        storage: storageMode(),
        framework: 'nextjs',
        timestamp: new Date().toISOString(),
    });
}
