import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Scissors } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'

export default function Shell({ title, nav, children }) {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-neutral-200 bg-white">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-neutral-200">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-neutral-900 text-white">
            <Scissors size={18} />
          </div>
          <span className="font-semibold">Trimio</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const isSectionRoot = item.href.split('/').length <= 2
            const isActive =
              location.pathname === item.href ||
              (!isSectionRoot && location.pathname.startsWith(`${item.href}/`))

            return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                isActive ? 'bg-neutral-100 font-medium text-neutral-950' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
            )
          })}
        </nav>
      </aside>
      <main className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Panel</p>
            <h1 className="font-semibold text-neutral-950">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-neutral-900">{profile?.full_name || profile?.email || 'Usuario'}</p>
              <p className="text-xs text-neutral-500">{role || 'sin rol'}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Salir
            </Button>
            <Button variant="outline" className="md:hidden">
              <Menu size={16} />
            </Button>
          </div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
