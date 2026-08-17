import ZoneDetailPage from '@/components/admin/ZoneDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ZonaDetailPage({ params }: Props) {
  const { id } = await params
  return <ZoneDetailPage zoneId={id} />
}
