import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key to bypass RLS for onboarding
// This is safe because we are only allowing specific fields to be updated
export async function POST(request) {
  try {
    const { userId, onboardingData } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...onboardingData,
        is_onboarded: true
      })

    if (error) {
      console.error('Onboarding API Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding API Catch:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
