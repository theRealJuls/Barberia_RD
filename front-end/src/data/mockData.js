export const barbershops = [
  {
    id: '1',
    slug: 'la-fama',
    name: 'Barberia La Fama',
    phone: '(809) 555-0198',
    whatsapp: '8095550198',
    address: 'Av. Winston Churchill #45, Piantini',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    description: 'Barberia enfocada en cortes modernos, barba y atencion personalizada.',
    openingHours: 'Lunes a sabado, 9:00 AM - 7:00 PM',
  },
]

export const services = [
  { id: '1', barbershopId: '1', name: 'Corte de cabello', duration: 35, price: 500 },
  { id: '2', barbershopId: '1', name: 'Barba', duration: 20, price: 300 },
  { id: '3', barbershopId: '1', name: 'Corte + barba', duration: 55, price: 750 },
  { id: '4', barbershopId: '1', name: 'Cejas', duration: 15, price: 200 },
]

export const barbers = [
  { id: '1', barbershopId: '1', name: 'Carlos Mejia', role: 'Barbero senior' },
  { id: '2', barbershopId: '1', name: 'Miguel Santos', role: 'Especialista en barba' },
  { id: '3', barbershopId: '1', name: 'Luis Ramirez', role: 'Cortes modernos' },
]

export const appointments = [
  { id: '1', client: 'Juan Perez', barber: 'Carlos Mejia', service: 'Corte + barba', time: '10:00 AM', status: 'Confirmada', price: 750 },
  { id: '2', client: 'Roberto Diaz', barber: 'Miguel Santos', service: 'Barba', time: '11:15 AM', status: 'Pendiente', price: 300 },
  { id: '3', client: 'Andres Martinez', barber: 'Luis Ramirez', service: 'Corte', time: '2:00 PM', status: 'Completada', price: 500 },
]
