# Supabase - Servicios y pagos

La estructura SQL del modulo de Brandon esta en `Data-base/schema.sql` y esta hecha para Supabase PostgreSQL.

Tablas principales:

- `servicios`: catalogo de servicios, precios, duracion y estado.
- `pagos_efectivo`: pagos recibidos en efectivo asociados a servicios, con referencia, comprobante, metodo y estado del pago.

Vistas administrativas:

- `dashboard_administrativo`: resumen general para panel administrativo.
- `ingresos_por_servicio`: ingresos agrupados por servicio.

El script tambien habilita RLS y crea politicas basicas para lectura, creacion, actualizacion y eliminacion necesarias para probar el modulo desde React con la anon key de Supabase.
