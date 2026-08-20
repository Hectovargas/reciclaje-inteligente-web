import type { Metadata } from 'next'
import { AdminSidebar, AdminMobileHeader } from '@/components/admin/AdminNavigation'
import './admin.css'

export const metadata: Metadata = {
  title: 'EcoGridAI Admin — CleanCity',
  description: 'Panel administrativo de la red de reciclaje inteligente CleanCity',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-wrapper mesh-bg" style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        <AdminMobileHeader />
        {children}
      </main>
    </div>
  )
}

