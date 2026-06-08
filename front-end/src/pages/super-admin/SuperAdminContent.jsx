import SuperAdminBarbershops from '@/pages/super-admin/SuperAdminBarbershops'
import SuperAdminHome from '@/pages/super-admin/SuperAdminHome'
import SuperAdminUsers from '@/pages/super-admin/SuperAdminUsers'

export default function SuperAdminContent({ path, token }) {
  if (path.startsWith('/super-admin/barberias')) {
    return <SuperAdminBarbershops />
  }

  if (path.startsWith('/super-admin/usuarios')) {
    return <SuperAdminUsers token={token} />
  }

  return <SuperAdminHome />
}
