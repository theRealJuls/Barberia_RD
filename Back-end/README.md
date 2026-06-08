# Barberia RD - Backend (API de Servicios)

Backend en **Node.js + Express** (ES Modules) que expone una API REST para gestionar
los **servicios** de la barberia y leer los **pagos**, usando **Supabase** como base de datos.

El servidor se conecta a Supabase con la **service_role key**, por lo que opera con
privilegios administrativos (bypassa RLS). Por eso este backend solo debe correr en el
servidor y **nunca** exponer la service_role key al frontend ni subirla a git.

## Que hace

- Asegura que exista una barberia base con slug `barberia-rd` (la crea si no existe).
- CRUD de servicios asociados a esa barberia.
- Lectura de pagos asociados a esa barberia.

El backend habla en los **nombres reales de las columnas** de la base de datos
(`name`, `description`, `base_price`, `base_duration_minutes`, `is_active`). El frontend
se encarga de mapear esos campos a su interfaz en espanol.

## Requisitos

- Node.js 18+ (se usa `import 'dotenv/config'` y `node --watch`).
- Un proyecto de Supabase con las tablas `barbershops`, `services` y `payments`.

## Configuracion

Crea un archivo `.env` dentro de `Back-end/` (puedes partir de `.env.example`):

```
PORT=4000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

> El archivo `.env` esta ignorado por git. **NUNCA** subas tu `.env` ni compartas la
> `SUPABASE_SERVICE_ROLE_KEY`: es una clave secreta con acceso total a la base de datos.

## Como correrlo

```bash
cd Back-end
npm install
npm start
```

Para desarrollo con recarga automatica:

```bash
npm run dev
```

El servidor arranca en `http://127.0.0.1:4000` (o el `PORT` que definas).

## Endpoints

Todas las respuestas son JSON. Los errores se devuelven como `{ "error": "mensaje" }`
con el codigo de estado apropiado.

| Metodo | Ruta                  | Descripcion |
| ------ | --------------------- | ----------- |
| GET    | `/api/health`         | Healthcheck. Responde `{ "ok": true }`. |
| GET    | `/api/barbershop`     | Devuelve `{ id, name, slug }` de la barberia base (la crea si no existe). |
| GET    | `/api/services`       | Lista los servicios de la barberia base, ordenados por `name` ascendente. |
| POST   | `/api/services`       | Crea un servicio. Devuelve la fila creada (201). |
| PATCH  | `/api/services/:id`   | Actualiza un servicio (campos parciales). Devuelve la fila (200) o 404 si no existe. |
| DELETE | `/api/services/:id`   | Elimina un servicio. Responde `{ "ok": true }` o 409 si esta referenciado. |
| GET    | `/api/payments`       | Solo lectura. Lista los pagos de la barberia base, ordenados por `created_at` descendente. |
| *      | (cualquier otra ruta) | 404 con `{ "error": "Not found" }`. |

### POST `/api/services`

Body esperado:

```json
{
  "name": "Corte clasico",
  "description": "Corte de cabello tradicional",
  "base_price": 350,
  "base_duration_minutes": 30,
  "is_active": true
}
```

Validaciones:

- `name`: obligatorio, no vacio.
- `base_price`: numero mayor que 0.
- `base_duration_minutes`: numero mayor que 0.

Si falla la validacion, responde `400 { "error": "..." }`.
`description` es opcional (se guarda `null` si no se envia) e `is_active` por defecto es `true`.

### PATCH `/api/services/:id`

Body con un subconjunto de:
`{ name, description, base_price, base_duration_minutes, is_active }`.
Solo se actualizan los campos presentes en el body. Si no se envia ningun campo valido,
responde 400. Si el servicio no existe, responde 404.

### Campos crudos de un servicio

`id`, `barbershop_id`, `name`, `description`, `base_price`, `base_duration_minutes`,
`is_active`, `created_at`, `updated_at`.

## Estructura

```
Back-end/
  src/
    index.js        # servidor Express y endpoints
  .env              # secretos (ignorado por git)
  .env.example      # plantilla sin secretos
  package.json
  README.md
```
