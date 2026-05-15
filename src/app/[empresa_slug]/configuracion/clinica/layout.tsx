import { ClinicaSubNav } from './_components/ClinicaSubNav'

type Props = {
  params: Promise<{ empresa_slug: string }>
  children: React.ReactNode
}

export default async function ClinicaLayout({ params, children }: Props) {
  const { empresa_slug } = await params
  return (
    <div>
      <ClinicaSubNav empresaSlug={empresa_slug} />
      {children}
    </div>
  )
}
