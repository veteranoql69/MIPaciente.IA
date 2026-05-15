import { PlantillasSubNav } from './_components/PlantillasSubNav'

type Props = {
  params: Promise<{ empresa_slug: string }>
  children: React.ReactNode
}

export default async function PlantillasLayout({ params, children }: Props) {
  const { empresa_slug } = await params
  return (
    <div>
      <PlantillasSubNav empresaSlug={empresa_slug} />
      {children}
    </div>
  )
}
