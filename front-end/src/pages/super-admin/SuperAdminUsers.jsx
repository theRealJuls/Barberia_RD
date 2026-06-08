import InviteUserPanel from '@/components/InviteUserPanel'

export default function SuperAdminUsers({ token }) {
  const staffRows = [
    { id: '1', name: 'Jeyson Ramos', email: 'ramosjeyson3@gmail.com', role: 'super_admin', barbershop: 'Trimio' },
    { id: '2', name: 'Carlos Mejia', email: 'carlos@example.com', role: 'barber', barbershop: 'Barberia La Fama' },
    { id: '3', name: 'Ana Perez', email: 'ana@example.com', role: 'receptionist', barbershop: 'Barberia La Fama' },
  ]

  return (
    <>
      <InviteUserPanel token={token} defaultBarbershopId="" />
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="font-semibold">Usuarios internos</h2>
          <p className="mt-1 text-sm text-neutral-600">Admins, recepcionistas y barberos registrados.</p>
        </div>
        <div className="divide-y divide-neutral-200">
          {staffRows.map((staff) => (
            <div key={staff.id} className="grid gap-2 p-5 md:grid-cols-4 md:items-center">
              <p className="font-medium">{staff.name}</p>
              <p className="text-sm text-neutral-600">{staff.email}</p>
              <p className="text-sm text-neutral-600">{staff.barbershop}</p>
              <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">{staff.role}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
