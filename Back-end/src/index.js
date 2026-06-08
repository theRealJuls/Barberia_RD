import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// --- Validacion de variables de entorno al arrancar ---
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Faltan variables de entorno requeridas: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Revisa el archivo Back-end/.env'
  );
  process.exit(1);
}

// --- Cliente Supabase con la SERVICE_ROLE key ---
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const app = express();
app.use(cors());
app.use(express.json());

// --- Cache del id de la barberia base ---
let cachedBarbershopId = null;

/**
 * Asegura que exista la barberia base con slug 'barberia-rd'.
 * Si no existe, la crea. Cachea el id en memoria para no consultarlo cada vez.
 * @returns {Promise<string>} id de la barberia base
 */
async function ensureBarbershop() {
  if (cachedBarbershopId) {
    return cachedBarbershopId;
  }

  // Buscar la barberia existente
  const { data: existing, error: selectError } = await supabase
    .from('barbershops')
    .select('id,name,slug')
    .eq('slug', 'barberia-rd')
    .limit(1);

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existing && existing.length > 0) {
    cachedBarbershopId = existing[0].id;
    return cachedBarbershopId;
  }

  // No existe: crearla. country DEBE ser 'DO' (CHECK constraint rechaza null).
  const { data: created, error: insertError } = await supabase
    .from('barbershops')
    .insert({
      name: 'Barberia RD',
      slug: 'barberia-rd',
      country: 'DO',
      slot_buffer_minutes: 0,
      is_active: true,
      public_page_enabled: true,
    })
    .select('id,name,slug')
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  cachedBarbershopId = created.id;
  return cachedBarbershopId;
}

// --- Endpoints ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Barberia base
app.get('/api/barbershop', async (req, res) => {
  try {
    const bsId = await ensureBarbershop();
    const { data, error } = await supabase
      .from('barbershops')
      .select('id,name,slug')
      .eq('id', bsId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar servicios de la barberia base
app.get('/api/services', async (req, res) => {
  try {
    const bsId = await ensureBarbershop();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', bsId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear servicio
app.post('/api/services', async (req, res) => {
  try {
    const { name, description, base_price, base_duration_minutes, is_active } =
      req.body ?? {};

    // Validaciones
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre (name) es obligatorio.' });
    }
    const price = Number(base_price);
    if (!Number.isFinite(price) || price <= 0) {
      return res
        .status(400)
        .json({ error: 'base_price debe ser un numero mayor que 0.' });
    }
    const duration = Number(base_duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return res
        .status(400)
        .json({ error: 'base_duration_minutes debe ser un numero mayor que 0.' });
    }

    const bsId = await ensureBarbershop();

    const { data, error } = await supabase
      .from('services')
      .insert({
        name: name.trim(),
        description: description ?? null,
        base_price: price,
        base_duration_minutes: duration,
        is_active: is_active ?? true,
        barbershop_id: bsId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar servicio
app.patch('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    const update = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return res
          .status(400)
          .json({ error: 'El nombre (name) no puede estar vacio.' });
      }
      update.name = body.name.trim();
    }

    if (body.description !== undefined) {
      update.description = body.description;
    }

    if (body.base_price !== undefined) {
      const price = Number(body.base_price);
      if (!Number.isFinite(price) || price <= 0) {
        return res
          .status(400)
          .json({ error: 'base_price debe ser un numero mayor que 0.' });
      }
      update.base_price = price;
    }

    if (body.base_duration_minutes !== undefined) {
      const duration = Number(body.base_duration_minutes);
      if (!Number.isFinite(duration) || duration <= 0) {
        return res.status(400).json({
          error: 'base_duration_minutes debe ser un numero mayor que 0.',
        });
      }
      update.base_duration_minutes = duration;
    }

    if (body.is_active !== undefined) {
      update.is_active = body.is_active;
    }

    if (Object.keys(update).length === 0) {
      return res
        .status(400)
        .json({ error: 'No se proporciono ningun campo para actualizar.' });
    }

    const { data, error } = await supabase
      .from('services')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // PGRST116: no rows returned (no se encontro la fila)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Servicio no encontrado.' });
      }
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar servicio
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      // 23503: violacion de foreign key
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'No se puede eliminar: el servicio esta referenciado por otros registros.',
        });
      }
      throw new Error(error.message);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pagos (solo lectura)
app.get('/api/payments', async (req, res) => {
  try {
    const bsId = await ensureBarbershop();
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', bsId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://127.0.0.1:${PORT}`);
});
