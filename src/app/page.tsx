import { redirect } from 'next/navigation'

// The proxy handles all routing logic for authenticated users.
// This component only renders if the proxy lets the request through,
// which should never happen for `/` — proxy always redirects.
export default function RootPage() {
  redirect('/login')
}
