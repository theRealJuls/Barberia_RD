# Frontend React - Servicios y pagos

Modulo administrativo de Brandon para Barberia RD hecho con JavaScript y React.

Incluye:

- CRUD de servicios y precios.
- Registro de pagos en efectivo con referencia, comprobante, metodo y estado del pago.
- Dashboard con servicios activos, pagos, ingresos y ticket promedio.
- Conexion a Supabase usando `@supabase/supabase-js`.

## Supabase

1. Abrir el SQL Editor en Supabase.
2. Ejecutar el archivo `../Data-base/schema.sql`.
3. Copiar `.env.example` como `.env`.
4. Colocar las credenciales del proyecto:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Uso

Instalar dependencias y ejecutar Vite:

```bash
npm install
npm run dev
```
