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
    // Normalize recipients to a clean array of numbers
    const recipientsList = Array.isArray(recipients) 
        ? recipients 
        : typeof recipients === 'string' 
            ? recipients.split(',').map(r => r.trim()).filter(Boolean)
            : [recipients];

    const phoneNumbers = recipientsList.join(',');
    
    try {
        const arkeselUrl = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${apiKey}&to=${phoneNumbers}&from=${senderId}&sms=${encodeURIComponent(message)}&response=json`
        
        const response = await fetch(arkeselUrl)
        let result;
        
        try {
            result = await response.json()
        } catch (e) {
            const text = await response.text()
            console.error('Arkesel non-JSON response:', text)
            result = { code: 'error', msg: 'Invalid response from provider', raw: text }
        }

        // 4. Log the attempt in Supabase
        const isSuccess = result.code === 'ok' || result.code === '1000' || result.status === 'success';

        const logData = recipientsList.map(phone => ({
            recipient_phone: phone,
            message_content: message,
            status: isSuccess ? 'success' : 'failed',
            provider_response: result,
            admin_id: user.id
        }))

        const { error: logError } = await supabase.from('sms_logs').insert(logData)
        if (logError) {
            console.error('Error logging SMS to DB:', logError)
        }

        if (isSuccess) {
            return NextResponse.json({ success: true, result })
        } else {
            return NextResponse.json({ success: false, error: result.msg || result.message || 'Arkesel error' }, { status: 400 })
        }

    } catch (error) {
        console.error('SMS Send Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
