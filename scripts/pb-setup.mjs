// Setup del backend PocketBase para el panel de cotizaciones.
// Uso:
//   1. Crear superuser:   pocketbase.exe superuser upsert admin@pyp.local <password>
//   2. Levantar:          pocketbase.exe serve --http 0.0.0.0:8090
//   3. Correr este script:
//      node scripts/pb-setup.mjs --url http://localhost:8090 --admin admin@pyp.local --pass <password>
//
// Es idempotente: si la colección ya existe, la salta.
// Crea también los usuarios iniciales y los vendedores semilla
// (editar USUARIOS/VENDEDORES abajo o pasar --no-seed).

import PocketBase from 'pocketbase';

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) =>
    a.startsWith('--') ? [a.slice(2), arr[i + 1]?.startsWith('--') ? true : arr[i + 1] ?? true] : null,
  ).filter(Boolean),
);

const PB_URL = args.url || process.env.PB_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = args.admin || process.env.PB_ADMIN || 'admin@pyp.local';
const ADMIN_PASS = args.pass || process.env.PB_PASS;

if (!ADMIN_PASS) {
  console.error('Falta la contraseña del superuser: --pass <password> o env PB_PASS');
  process.exit(1);
}

// Usuarios iniciales del panel (cambiar emails/passwords a gusto).
const USUARIOS = [
  { email: 'recepcion@pyp.local', password: 'cambiar-recepcion-123', name: 'Barriga, Franco', rol: 'recepcion' },
  { email: 'ventas@pyp.local', password: 'cambiar-ventas-123', name: 'Mena, Franco', rol: 'coordinador' },
  { email: 'escobar@pyp.local', password: 'cambiar-escobar-123', name: 'Escobar, Walter', rol: 'vendedor' },
  { email: 'salek@pyp.local', password: 'cambiar-salek-123', name: 'Salek, Facundo', rol: 'vendedor' },
];

// Vendedores asignables; `email` vincula el registro con la cuenta de login.
const VENDEDORES = [
  { nombre: 'Escobar, Walter', email: 'escobar@pyp.local' },
  { nombre: 'Salek, Facundo', email: 'salek@pyp.local' },
];

const AUTH = '@request.auth.id != ""';
const AMBOS = '@request.auth.rol = "recepcion" || @request.auth.rol = "coordinador"';
const COORD = '@request.auth.rol = "coordinador"';
// El vendedor solo ve/toca cotizaciones asignadas a su registro de vendedor.
const VEND_PROPIO = '(@request.auth.rol = "vendedor" && asignado_a.user = @request.auth.id)';

const pb = new PocketBase(PB_URL);

// PB no agrega created/updated automáticamente al crear colecciones vía API.
const TIMESTAMPS = [
  { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
  { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
];

async function exists(name) {
  try {
    await pb.collections.getOne(name);
    return true;
  } catch {
    return false;
  }
}

async function createCollection(spec) {
  if (await exists(spec.name)) {
    const col = await pb.collections.getOne(spec.name);
    const fields = [...col.fields];
    let changed = false;
    for (const f of spec.fields ?? []) {
      const i = fields.findIndex((x) => x.name === f.name);
      if (i === -1) {
        fields.push(f);
        changed = true;
      } else if (JSON.stringify({ ...fields[i], id: undefined }) !== JSON.stringify({ ...f, id: undefined })) {
        fields[i] = { ...fields[i], ...f };
        changed = true;
      }
    }
    const updated = await pb.collections.update(spec.name, {
      fields,
      listRule: spec.listRule,
      viewRule: spec.viewRule,
      createRule: spec.createRule,
      updateRule: spec.updateRule,
      deleteRule: spec.deleteRule,
    });
    console.log(`  · ${spec.name} ya existe, se sincronizan campos/reglas${changed ? ' (campos actualizados)' : ''}`);
    return updated;
  }
  const c = await pb.collections.create(spec);
  console.log(`  + ${spec.name} creada`);
  return c;
}

console.log(`Conectando a ${PB_URL} como ${ADMIN_EMAIL}…`);
await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
console.log('OK. Creando colecciones…');

// --- users: agregar campo rol + permitir listar a autenticados (para expand) ---
const users = await pb.collections.getOne('users');
const rolField = users.fields.find((f) => f.name === 'rol');
const ROLES = ['recepcion', 'coordinador', 'vendedor'];
await pb.collections.update('users', {
  fields: rolField
    ? users.fields.map((f) =>
        f.name === 'rol' ? { ...f, values: [...new Set([...(f.values ?? []), ...ROLES])] } : f,
      )
    : [...users.fields, { name: 'rol', type: 'select', values: ROLES, maxSelect: 1 }],
  listRule: AUTH,
  viewRule: AUTH,
});
console.log('  + users: campo rol listo');

const clientes = await createCollection({
  name: 'clientes',
  type: 'base',
  fields: [{ name: 'nombre', type: 'text', required: true }, ...TIMESTAMPS],
  listRule: AUTH, viewRule: AUTH, createRule: AMBOS, updateRule: AMBOS, deleteRule: null,
});

const vendedores = await createCollection({
  name: 'vendedores',
  type: 'base',
  fields: [
    { name: 'nombre', type: 'text', required: true },
    { name: 'activo', type: 'bool' },
    { name: 'telefono', type: 'text' },
    { name: 'user', type: 'relation', collectionId: users.id, maxSelect: 1 },
    ...TIMESTAMPS,
  ],
  listRule: AUTH, viewRule: AUTH, createRule: AMBOS, updateRule: AMBOS, deleteRule: null,
});

const ADJUNTOS_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
];

const cotizaciones = await createCollection({
  name: 'cotizaciones',
  type: 'base',
  fields: [
    { name: 'numero', type: 'number', required: true },
    { name: 'cliente', type: 'relation', collectionId: clientes.id, maxSelect: 1, required: true },
    { name: 'comprador', type: 'text' },
    { name: 'referencia', type: 'text' },
    { name: 'canal', type: 'text' },
    { name: 'detalle', type: 'text' },
    { name: 'notas', type: 'text' },
    {
      name: 'estado', type: 'select', required: true, maxSelect: 1,
      values: ['pendiente', 'asignada', 'en_proceso', 'por_revisar', 'cotizada', 'enviada', 'descartada'],
    },
    {
      name: 'captura', type: 'file', maxSelect: 5, maxSize: 8 * 1024 * 1024,
      mimeTypes: ADJUNTOS_MIME,
    },
    {
      name: 'cotizacion_pdf', type: 'file', maxSelect: 1, maxSize: 8 * 1024 * 1024,
      mimeTypes: ['application/pdf'],
    },
    { name: 'creado_por', type: 'relation', collectionId: users.id, maxSelect: 1 },
    { name: 'asignado_a', type: 'relation', collectionId: vendedores.id, maxSelect: 1 },
    ...TIMESTAMPS,
  ],
  listRule: `${AMBOS} || ${VEND_PROPIO}`,
  viewRule: `${AMBOS} || ${VEND_PROPIO}`,
  createRule: AMBOS,
  updateRule: `${COORD} || ${VEND_PROPIO} || (@request.auth.rol = "recepcion" && ((creado_por = @request.auth.id && estado = "pendiente") || estado = "cotizada"))`,
  deleteRule: null,
});

await createCollection({
  name: 'cotizacion_items',
  type: 'base',
  fields: [
    { name: 'cotizacion', type: 'relation', collectionId: cotizaciones.id, maxSelect: 1, required: true, cascadeDelete: true },
    { name: 'descripcion', type: 'text', required: true },
    { name: 'cantidad', type: 'number' },
    { name: 'unidad', type: 'text' },
    { name: 'producto_slug', type: 'text' },
    { name: 'orden', type: 'number' },
    ...TIMESTAMPS,
  ],
  listRule: AUTH, viewRule: AUTH, createRule: AMBOS, updateRule: AMBOS, deleteRule: null,
});

await createCollection({
  name: 'cotizacion_eventos',
  type: 'base',
  fields: [
    { name: 'cotizacion', type: 'relation', collectionId: cotizaciones.id, maxSelect: 1, required: true, cascadeDelete: true },
    { name: 'actor', type: 'relation', collectionId: users.id, maxSelect: 1 },
    {
      name: 'tipo', type: 'select', required: true, maxSelect: 1,
      values: ['creada', 'asignada', 'estado', 'comentario', 'editada'],
    },
    { name: 'detalle', type: 'text' },
    ...TIMESTAMPS,
  ],
  listRule: `${AMBOS} || (@request.auth.rol = "vendedor" && cotizacion.asignado_a.user = @request.auth.id)`,
  viewRule: `${AMBOS} || (@request.auth.rol = "vendedor" && cotizacion.asignado_a.user = @request.auth.id)`,
  createRule: AUTH,
  updateRule: null,
  deleteRule: null,
});

if (!args['no-seed']) {
  console.log('Creando usuarios iniciales…');
  for (const u of USUARIOS) {
    try {
      await pb.collection('users').create({
        email: u.email,
        password: u.password,
        passwordConfirm: u.password,
        name: u.name,
        rol: u.rol,
      });
      console.log(`  + ${u.email} (${u.rol})`);
    } catch (e) {
      console.log(`  · ${u.email} ya existe o falló (${e.status ?? e})`);
    }
  }
  for (const v of VENDEDORES) {
    const userId = await pb
      .collection('users')
      .getFirstListItem(`email="${v.email}"`)
      .then((u) => u.id)
      .catch(() => null);
    let vend;
    try {
      vend = await pb.collection('vendedores').getFirstListItem(`nombre="${v.nombre}"`);
    } catch {
      vend = await pb.collection('vendedores').create({ nombre: v.nombre, activo: true });
      console.log(`  + vendedor ${v.nombre}`);
    }
    if (userId && vend.user !== userId) {
      await pb.collection('vendedores').update(vend.id, { user: userId });
      console.log(`  + ${v.nombre} vinculado a ${v.email}`);
    }
  }
}

console.log('\nListo. Panel disponible en: ' + PB_URL + '/web/panel/ (si servís dist/ en pb_public)');
console.log('Panel admin de PocketBase: ' + PB_URL + '/_/');
