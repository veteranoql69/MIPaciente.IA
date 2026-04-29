import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const { session } = data

      // Persist Google Calendar tokens for server-side agent use.
      // provider_refresh_token only arrives when access_type=offline + prompt=consent.
      if (session.provider_refresh_token) {
        await supabase
          .from('mpaci_usuarios')
          .update({
            gcal_access_token:  session.provider_token ?? null,
            gcal_refresh_token: session.provider_refresh_token,
            gcal_token_expiry:  new Date(Date.now() + 3600 * 1000).toISOString(),
          })
          .eq('id', session.user.id)
      }

      // Behind a reverse proxy (Traefik/Nginx), request.url reflects the
      // internal container address. Use x-forwarded-host for the public URL.
      const forwardedHost = request.headers.get('x-forwarded-host')
      if (process.env.NODE_ENV === 'development' || !forwardedHost) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?authError=OAuthCallbackFailed`)
}
