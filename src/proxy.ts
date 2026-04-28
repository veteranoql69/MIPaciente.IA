import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/lib/database.types'
import fs from 'fs'
import path from 'path'

function logDebug(msg: string) {
  const logPath = path.join(process.cwd(), 'doc', 'proxy_debug.log')
  const timestamp = new Date().toISOString()
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`)
  } catch (e) {
    console.error('Failed to write log:', e)
  }
}

const PUBLIC_PATHS = ['/login', '/auth', '/unauthorized']
const RESERVED_SEGMENTS = new Set([
  'onboarding', 'dashboard', 'login', 'auth', 'unauthorized', 'api', '_next',
])

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function extractEmpresaSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null
  const first = segments[0]
  if (RESERVED_SEGMENTS.has(first)) return null
  return first
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() must be called immediately after createServerClient
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public paths: session refresh only, no auth gate
  if (isPublicPath(pathname)) {
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Auth gate — unauthenticated users go to /login
  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Load user profile (empresa_id, rol, onboarding status)
  const { data: profile, error: profileError } = await supabase
    .from('mpaci_usuarios')
    .select('empresa_id, rol, onboarding_completado')
    .eq('id', user.id)
    .single()

  logDebug(`Path: ${pathname}, User: ${user.email}, Profile found: ${!!profile}, Error: ${JSON.stringify(profileError)}`)

  // No profile row → new user, send to onboarding
  if (!profile) {
    logDebug('No profile found, redirecting to onboarding')
    if (pathname === '/onboarding') return response
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Onboarding pending → detect invitation and route accordingly
  if (!profile.onboarding_completado) {
    logDebug('Onboarding incomplete, redirecting')
    if (pathname.startsWith('/onboarding')) return response

    const { data: inv } = await supabase
      .from('mpaci_invitaciones')
      .select('id')
      .eq('email', user.email!)
      .eq('usado', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()

    const dest = inv ? '/onboarding/invitado' : '/onboarding'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Onboarding complete + going to wizard → redirect home
  if (pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Root / or legacy /dashboard → role-based redirect to empresa route
  if (pathname === '/' || pathname === '/dashboard') {
    logDebug('Root path detected, calculating target...')
    if (!profile.empresa_id) {
      logDebug('No empresa_id in profile, redirecting to onboarding')
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    const { data: empresa } = await supabase
      .from('mpaci_empresas')
      .select('slug')
      .eq('id', profile.empresa_id)
      .single()

    if (!empresa) {
      console.log('[Proxy] Empresa not found for ID:', profile.empresa_id)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    const target =
      ['medico', 'asistente', 'enfermera_tens', 'externo'].includes(profile.rol)
        ? `/${empresa.slug}/agenda/hoy`
        : `/${empresa.slug}/dashboard`

    logDebug(`Redirecting to: ${target}`)
    return NextResponse.redirect(new URL(target, request.url))
  }

  // /[empresa_slug]/* — validate slug belongs to user's empresa
  // RLS policy "Usuarios ven su empresa asignada" ensures the query returns rows
  // only if the slug matches the user's empresa_id — unauthorized access returns empty.
  const empresaSlug = extractEmpresaSlug(pathname)
  if (empresaSlug) {
    const { data: empresa } = await supabase
      .from('mpaci_empresas')
      .select('id, activo')
      .eq('slug', empresaSlug)
      .single()

    if (!empresa || !empresa.activo) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
