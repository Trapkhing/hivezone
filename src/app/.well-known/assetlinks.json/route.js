import { NextResponse } from 'next/server';

// Android App Links verification
// Replace YOUR_SHA256_FINGERPRINT with output from: ./gradlew signingReport
const assetlinks = [
    {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
            namespace: 'android_app',
            package_name: 'co.hivezone.app',
            sha256_cert_fingerprints: [
                'YOUR_SHA256_FINGERPRINT'
            ]
        }
    }
];

export async function GET() {
    return NextResponse.json(assetlinks, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
