#!/usr/bin/env node
/**
 * Lista tus productos en Supabase, te deja borrar los vencidos y siembra
 * un set de productos chilenos típicos.
 *
 * Uso: node scripts/seed-chilean-products.js
 * Pide tu email y contraseña de SmartFridge por consola (no quedan guardados).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const KEY_ENTER = 13;
const KEY_CTRL_C = 3;
const KEY_BACKSPACE = 127;

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

function ask(question, { hidden = false } = {}) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, answer => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    const stdin = process.stdin;
    process.stdout.write(question);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = chunk => {
      const code = chunk.charCodeAt(0);

      if (code === KEY_ENTER) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(value);
        return;
      }
      if (code === KEY_CTRL_C) {
        stdin.setRawMode(false);
        process.exit(1);
      }
      if (code === KEY_BACKSPACE) {
        value = value.slice(0, -1);
        return;
      }
      value += chunk;
    };
    stdin.on('data', onData);
  });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

// Productos chilenos típicos de supermercado, con fechas de vencimiento variadas
// para poblar las alertas de la app (algunos por vencer pronto, otros lejos).
const CHILEAN_PRODUCTS = [
  { name: 'Leche Soprole Entera 1L',          category: 'Lácteos',    quantity: '2 unidades', expiresIn: 6   },
  { name: 'Queso Gauda Colún 200g',           category: 'Lácteos',    quantity: '1 unidad',   expiresIn: 12  },
  { name: 'Yogurt Yoghu Soprole Frutilla',    category: 'Lácteos',    quantity: '4 unidades', expiresIn: 3   },
  { name: 'Manjar Nestlé 400g',               category: 'Despensa',   quantity: '1 unidad',   expiresIn: 90  },
  { name: 'Pan de molde Ideal Integral',      category: 'Despensa',   quantity: '1 unidad',   expiresIn: 5   },
  { name: 'Marraqueta',                       category: 'Despensa',   quantity: '6 unidades', expiresIn: 1   },
  { name: 'Palta Hass',                       category: 'Frutas',     quantity: '4 unidades', expiresIn: 4   },
  { name: 'Plátano',                          category: 'Frutas',     quantity: '1 kg',       expiresIn: 5   },
  { name: 'Manzana Royal Gala',               category: 'Frutas',     quantity: '6 unidades', expiresIn: 10  },
  { name: 'Tomate',                           category: 'Verduras',   quantity: '1 kg',       expiresIn: 6   },
  { name: 'Cebolla',                          category: 'Verduras',   quantity: '1 kg',       expiresIn: 20  },
  { name: 'Choclo',                           category: 'Verduras',   quantity: '3 unidades', expiresIn: 5   },
  { name: 'Posta rosada de vacuno',           category: 'Carnes',     quantity: '1 kg',       expiresIn: 3   },
  { name: 'Pechuga de pollo',                 category: 'Carnes',     quantity: '1 kg',       expiresIn: 2   },
  { name: 'Longaniza',                        category: 'Carnes',     quantity: '500 g',      expiresIn: 4   },
  { name: 'Completos Winter',                 category: 'Congelados', quantity: '1 paquete',  expiresIn: 45  },
  { name: 'Papas fritas congeladas McCain',   category: 'Congelados', quantity: '1 bolsa',    expiresIn: 120 },
  { name: 'Bebida Coca-Cola 1.5L',            category: 'Bebidas',    quantity: '2 botellas', expiresIn: 180 },
  { name: 'Jugo Watts Néctar Durazno',        category: 'Bebidas',    quantity: '1 unidad',   expiresIn: 60  },
  { name: 'Vino Carmenere Concha y Toro',     category: 'Bebidas',    quantity: '1 botella',  expiresIn: 365 },
  { name: 'Mote con huesillo (envasado)',     category: 'Bebidas',    quantity: '2 unidades', expiresIn: 7   },
  { name: 'Galletas Triton',                  category: 'Snacks',     quantity: '1 paquete',  expiresIn: 30  },
  { name: 'Papas fritas Lays',                category: 'Snacks',     quantity: '1 bolsa',    expiresIn: 25  },
  { name: 'Arroz grado 1',                    category: 'Despensa',   quantity: '1 kg',       expiresIn: 200 },
  { name: 'Tallarines Carozzi',               category: 'Despensa',   quantity: '2 paquetes', expiresIn: 200 },
  { name: 'Aceite Chef vegetal',              category: 'Despensa',   quantity: '1 botella',  expiresIn: 200 },
];

async function main() {
  const env = loadEnvLocal();
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error('No se encontraron EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY en .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);

  const email = await ask('Email de SmartFridge: ');
  const password = await ask('Contraseña: ', { hidden: true });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('No se pudo iniciar sesión:', authError.message);
    process.exit(1);
  }
  const userId = authData.user.id;
  console.log(`\nSesión iniciada como ${authData.user.email}\n`);

  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, name, category, expires, quantity, barcode, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('No se pudo leer el inventario:', fetchError.message);
    process.exit(1);
  }

  console.log(`Tienes ${products.length} producto(s) en tu inventario actual:\n`);
  for (const p of products) {
    console.log(`  - [${p.expires || 'sin fecha'}] ${p.name} (${p.category}) · ${p.quantity}`);
  }

  const today = todayISO();
  const expired = products.filter(p => p.expires && p.expires < today);

  console.log(`\n${expired.length} producto(s) están vencidos:\n`);
  for (const p of expired) {
    console.log(`  - [${p.expires}] ${p.name}`);
  }

  if (expired.length > 0) {
    const confirmDelete = await ask('\n¿Eliminar estos productos vencidos? (s/N): ');
    if (confirmDelete.toLowerCase() === 's') {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', expired.map(p => p.id))
        .eq('user_id', userId);
      if (deleteError) {
        console.error('Error al eliminar:', deleteError.message);
      } else {
        console.log(`Se eliminaron ${expired.length} producto(s) vencidos.`);
      }
    } else {
      console.log('Se omitió la eliminación.');
    }
  }

  const confirmInsert = await ask(`\n¿Ingresar ${CHILEAN_PRODUCTS.length} productos chilenos de ejemplo? (s/N): `);
  if (confirmInsert.toLowerCase() === 's') {
    const payload = CHILEAN_PRODUCTS.map(p => ({
      user_id: userId,
      name: p.name,
      category: p.category,
      expires: addDaysISO(p.expiresIn),
      quantity: p.quantity,
      barcode: null,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert(payload)
      .select('name');

    if (insertError) {
      console.error('Error al insertar:', insertError.message);
    } else {
      console.log(`Se ingresaron ${inserted.length} productos chilenos.`);
    }
  } else {
    console.log('Se omitió el ingreso de productos.');
  }

  await supabase.auth.signOut();
  console.log('\nListo.');
}

main().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
