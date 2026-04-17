import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/lib/database.types'

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
  const { data: profile } = await supabase
    .from('mpaci_usuarios')
    .select('empresa_id, rol, onboarding_completado')
    .eq('id', user.id)
    .single()

  // No profile row → new user, send to onboarding
  if (!profile) {
    if (pathname === '/onboarding') return response
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Onboarding pending → force wizard
  if (!profile.onboarding_completado) {
    if (pathname === '/onboarding') return response
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Onboarding complete + going to wizard → redirect home
  if (pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Root / or legacy /dashboard → role-based redirect to empresa route
  if (pathname === '/' || pathname === '/dashboard') {
    if (!profile.empresa_id) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    const { data: empresa } = await supabase
      .from('mpaci_empresas')
      .select('slug')
      .eq('id', profile.empresa_id)
      .single()

    if (!empresa) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    const target =
      profile.rol === 'medico' || profile.rol === 'asistente'
        ? `/${empresa.slug}/agenda/hoy`
        : `/${empresa.slug}/dashboard`

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
