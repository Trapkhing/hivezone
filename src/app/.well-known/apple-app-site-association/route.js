import { NextResponse } from 'next/server';

// iOS Universal Links verification
// Replace YOUR_TEAM_ID with your Apple Developer Team ID
const aasa = {
    applinks: {
        details: [
            {
                appIDs: ['YOUR_TEAM_ID.co.hivezone.app'],
                components: [
                    { '/': '/dashboard/*' },
                    { '/': '/auth/*' },
                    { '/': '/*' }
                ]
            }
        ]
    }
};

export async function GET() {
    return NextResponse.json(aasa, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
