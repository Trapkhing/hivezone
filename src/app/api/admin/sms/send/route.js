import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value },
            },
        }
    )

    // 1. Verify Admin Session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 2. Parse Request
    const { recipients, message } = await request.json()
    if (!recipients || !message) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const apiKey = process.env.ARKESEL_API_KEY
    const senderId = process.env.ARKESEL_SENDER_ID || 'HiveZone'

    if (!apiKey) return NextResponse.json({ error: 'API Key not configured' }, { status: 500 })

    // 3. Prepare for Arkesel Call
    // Note: recipients should be joined by comma for bulk
    const phoneNumbers = Array.isArray(recipients) ? recipients.join(',') : recipients
    
    try {
        const arkeselUrl = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${apiKey}&to=${phoneNumbers}&from=${senderId}&sms=${encodeURIComponent(message)}`
        
        const response = await fetch(arkeselUrl)
        const result = await response.json()

        // 4. Log the attempt in Supabase
        const logData = (Array.isArray(recipients) ? recipients : [recipients]).map(phone => ({
            recipient_phone: phone,
            message_content: message,
            status: result.code === 'ok' ? 'success' : 'failed',
            provider_response: result,
            admin_id: user.id
        }))

        await supabase.from('sms_logs').insert(logData)

        if (result.code === 'ok') {
            return NextResponse.json({ success: true, result })
        } else {
            return NextResponse.json({ success: false, error: result.msg || 'Arkesel error' }, { status: 400 })
        }

    } catch (error) {
        console.error('SMS Send Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
