# Trimio Back-end

API Node/Express para validar sesiones de Supabase, consultar permisos y ejecutar acciones sensibles con service role.

## Endpoints

```text
GET  /health
GET  /api/auth/me
POST /api/admin/invite-user
POST /api/admin/assign-role
POST /api/clients/ensure
GET  /api/barbershops/:slug
```

Los endpoints protegidos requieren:

```text
Authorization: Bearer SUPABASE_ACCESS_TOKEN
```
