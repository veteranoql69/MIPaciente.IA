import { redirect } from 'next/navigation'

type Props = { params: Promise<{ empresa_slug: string }> }

export default async function ClinicaPage({ params }: Props) {
  const { empresa_slug } = await params
  redirect(`/${empresa_slug}/configuracion/clinica/servicios`)
}
