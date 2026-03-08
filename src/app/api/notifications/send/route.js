import { NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = "b9314dfb-651e-4f29-b1e9-c1f6f2300b0e";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export async function POST(request) {
    try {
        const body = await request.json();
        const { userIds, title, message, url } = body;

        if (!userIds || !userIds.length || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!ONESIGNAL_REST_API_KEY) {
            console.error('ONESIGNAL_REST_API_KEY is not set');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // We use include_aliases.external_id which corresponds to what we pass to OneSignal.login()
        const payload = {
            app_id: ONESIGNAL_APP_ID,
            include_aliases: {
                external_id: userIds
            },
            target_channel: "push",
            headings: { en: title || 'New Notification' },
            contents: { en: message },
            url: url || undefined,
        };

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OneSignal API Error:', data);
            return NextResponse.json({ error: 'Failed to send notification', details: data }, { status: response.status });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Notification API route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
