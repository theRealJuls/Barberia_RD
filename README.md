# Barberia_RD

Trimio es una plataforma web responsive para barberias. Permite gestionar barberias, clientes, barberos, servicios, citas y pagos basicos.

## Estructura

```text
Back-end/   API Node/Express para auth central y acciones sensibles
Data-base/  Base de datos oficial del proyecto
front-end/  App React/Vite
```

## Frontend

```bash
cd front-end
npm install
cp .env.example .env
npm run dev
```

Variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://127.0.0.1:4000
```

## Backend

```bash
cd Back-end
npm install
cp .env.example .env
npm run dev
```

Variables:

```env
PORT=4000
HOST=127.0.0.1
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

La `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en el backend.

## Google Auth En Supabase

En Supabase Dashboard:

1. Ir a `Authentication -> Providers -> Google`.
2. Activar Google.
3. En Google Cloud, usar como callback:

```text
https://PROJECT_REF.supabase.co/auth/v1/callback
```

4. En Supabase, agregar redirect URL:

```text
http://localhost:5173/auth/callback
```

Cuando exista produccion, agregar tambien la URL final de produccion.
