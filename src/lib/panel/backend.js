// Capa de datos del panel de cotizaciones.
// Tres implementaciones con la misma interfaz:
//   - PocketBase (servidor propio): si PUBLIC_PB_URL está seteada o el panel
//     se sirve desde el mismo origen que la API (/api/health responde).
//   - Supabase: si hay PUBLIC_SUPABASE_URL/ANON_KEY.
//   - Demo sobre localStorage: fallback sin configuración.
import { createClient } from '@supabase/supabase-js';
import PocketBase from 'pocketbase';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
const PB_URL = import.meta.env.PUBLIC_PB_URL || '';

export const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  asignada: 'Asignada',
  en_proceso: 'En proceso',
  por_revisar: 'Por revisar',
  cotizada: 'Cotizada',
  enviada: 'Enviada',
  descartada: 'Descartada',
};

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

export async function createBackend() {
  if (PB_URL) return makePocketBase(PB_URL);
  try {
    const r = await fetch(`${location.origin}/api/health`, {
      signal: AbortSignal.timeout(1500),
    });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j?.code === 200) return makePocketBase(location.origin);
    }
  } catch {
    /* no hay backend same-origin */
  }
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return makeSupabase();
  return makeDemo();
}

function mapRow(r) {
  return {
    id: r.id,
    numero: r.numero ?? r.id,
    cliente_id: r.cliente_id ?? r.cliente,
    cliente: r.expand?.cliente?.nombre ?? r.cliente?.nombre ?? r.cliente ?? '',
    comprador: r.comprador ?? '',
    referencia: r.referencia ?? '',
    canal: r.canal ?? 'whatsapp',
    notas: r.notas ?? '',
    detalle: r.detalle ?? '',
    estado: r.estado,
    asignado_a: r.asignado_a,
    asignado: r.asignado ?? r.expand?.asignado_a?.nombre ?? r.vendedor?.nombre ?? null,
    captura_path: r.captura_path ?? null,
    captura_url: r.captura_url ?? null,
    adjuntos: r.adjuntos ?? asArray(r.captura),
    cotizacion_pdf: r.cotizacion_pdf ?? null,
    creado_por: r.creado_por,
    creado_por_nombre:
      r.creado_por_nombre ?? r.expand?.creado_por?.name ?? r.creador?.nombre ?? '',
    _raw: r,
    items: (r.items ?? r.cotizacion_items ?? [])
      .slice()
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((i) => ({ descripcion: i.descripcion, cantidad: i.cantidad, unidad: i.unidad })),
    created_at: r.created_at ?? r.created,
    updated_at: r.updated_at ?? r.updated,
  };
}

function makeSupabase() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let profile = null;

  async function ensureCliente(nombre) {
    const limpio = nombre.trim();
    const { data: found } = await sb.from('clientes').select('id').ilike('nombre', limpio).maybeSingle();
    if (found) return found.id;
    const { data, error } = await sb.from('clientes').insert({ nombre: limpio }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async function addEvento(cotizacion_id, tipo, detalle) {
    await sb.from('cotizacion_eventos').insert({ cotizacion_id, actor: profile?.id ?? null, tipo, detalle });
  }

  return {
    mode: 'supabase',

    async getSession() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return null;
      const { data: p } = await sb.from('profiles').select('*').eq('id', data.session.user.id).maybeSingle();
      profile = p ?? { id: data.session.user.id, nombre: data.session.user.email, rol: 'recepcion' };
      return { user: { id: profile.id, nombre: profile.nombre, rol: profile.rol } };
    },

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return { error: error ? 'Email o contraseña incorrectos' : null };
    },

    async signOut() {
      await sb.auth.signOut();
      profile = null;
    },

    async subscribe() {
      return () => {};
    },

    async listTickets() {
      const { data, error } = await sb
        .from('cotizaciones')
        .select('*, cliente:clientes(nombre), vendedor:vendedores(nombre), creador:profiles!cotizaciones_creado_por_fkey(nombre), items:cotizacion_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapRow);
    },

    async getEventos(cotizacionId) {
      const { data } = await sb
        .from('cotizacion_eventos')
        .select('*, actor:profiles(nombre)')
        .eq('cotizacion_id', cotizacionId)
        .order('created_at', { ascending: false });
      return (data ?? []).map((e) => ({
        id: e.id,
        tipo: e.tipo,
        detalle: e.detalle,
        actor: e.actor?.nombre ?? '',
        created_at: e.created_at,
      }));
    },

    async createTicket({ cliente, comprador, referencia, detalle, notas, adjuntos }) {
      const clienteId = await ensureCliente(cliente);
      const { data: t, error } = await sb
        .from('cotizaciones')
        .insert({ cliente_id: clienteId, comprador, referencia, detalle, notas, creado_por: profile.id })
        .select()
        .single();
      if (error) throw error;

      const primero = (adjuntos ?? [])[0];
      if (primero) {
        const path = `${t.id}/${Date.now()}-${primero.name.replace(/[^\w.\-]/g, '_')}`;
        const { error: upErr } = await sb.storage.from('capturas').upload(path, primero);
        if (!upErr) await sb.from('cotizaciones').update({ captura_path: path }).eq('id', t.id);
      }

      await addEvento(t.id, 'creada', `Cliente: ${cliente.trim()}`);
      return t.id;
    },

    async entregarCotizacion(id, file) {
      const path = `${id}/cotizacion-${Date.now()}.pdf`;
      const { error: upErr } = await sb.storage.from('capturas').upload(path, file);
      if (upErr) throw upErr;
      await sb.from('cotizaciones').update({ estado: 'por_revisar' }).eq('id', id);
      await addEvento(id, 'estado', `→ Por revisar (cotización adjunta: ${file.name})`);
    },

    async adjuntosDe(ticket) {
      if (!ticket.captura_path) return [];
      const { data } = await sb.storage.from('capturas').createSignedUrl(ticket.captura_path, 3600);
      return data?.signedUrl
        ? [{ name: ticket.captura_path.split('/').pop(), url: data.signedUrl, esImagen: /\.(jpe?g|png|webp|gif)$/i.test(ticket.captura_path) }]
        : [];
    },

    async cotizacionUrl() {
      return null;
    },

    async setEstado(id, estado, extra = {}) {
      const { error } = await sb.from('cotizaciones').update({ estado, ...extra }).eq('id', id);
      if (error) throw error;
      await addEvento(id, 'estado', `→ ${ESTADO_LABEL[estado] ?? estado}`);
    },

    async assign(id, vendedorId, vendedorNombre) {
      const { error } = await sb
        .from('cotizaciones')
        .update({ asignado_a: vendedorId, estado: 'asignada' })
        .eq('id', id);
      if (error) throw error;
      await addEvento(id, 'asignada', `→ ${vendedorNombre}`);
    },

    async addComentario(id, texto) {
      await addEvento(id, 'comentario', texto);
    },

    async listVendedores() {
      const { data } = await sb.from('vendedores').select('*').order('nombre');
      return data ?? [];
    },

    async addVendedor(nombre) {
      await sb.from('vendedores').insert({ nombre: nombre.trim() });
    },

    async toggleVendedor(v) {
      await sb.from('vendedores').update({ activo: !v.activo }).eq('id', v.id);
    },

    async updateVendedor(v) {
      await sb.from('vendedores').update({ nombre: v.nombre, telefono: v.telefono ?? '' }).eq('id', v.id);
    },

    async listClientes() {
      const { data } = await sb.from('clientes').select('*').order('nombre');
      return data ?? [];
    },

    async capturaUrl(ticket) {
      if (!ticket.captura_path) return null;
      const { data } = await sb.storage.from('capturas').createSignedUrl(ticket.captura_path, 3600);
      return data?.signedUrl ?? null;
    },
  };
}

// ---------- PocketBase (servidor propio) ----------

function makePocketBase(baseUrl) {
  const pb = new PocketBase(baseUrl);
  pb.autoCancellation(false);

  const user = () => pb.authStore.record;

  async function addEvento(cotizacion_id, tipo, detalle) {
    await pb.collection('cotizacion_eventos').create({
      cotizacion: cotizacion_id,
      actor: user()?.id ?? null,
      tipo,
      detalle,
    });
  }

  async function nextNumero() {
    try {
      const last = await pb
        .collection('cotizaciones')
        .getFirstListItem('', { sort: '-numero', fields: 'numero' });
      return (last?.numero ?? 0) + 1;
    } catch {
      return 1;
    }
  }

  return {
    mode: 'pocketbase',

    async getSession() {
      if (!pb.authStore.isValid) return null;
      try {
        await pb.collection('users').authRefresh();
      } catch {
        pb.authStore.clear();
        return null;
      }
      const u = user();
      const session = { id: u.id, nombre: u.name || u.email, rol: u.rol };
      if (u.rol === 'vendedor') {
        session.vendedorId = await pb
          .collection('vendedores')
          .getFirstListItem(`user = "${u.id}"`)
          .then((v) => v.id)
          .catch(() => null);
      }
      return { user: session };
    },

    async signIn(email, password) {
      try {
        await pb.collection('users').authWithPassword(email, password);
        return { error: null };
      } catch {
        return { error: 'Email o contraseña incorrectos' };
      }
    },

    async signOut() {
      pb.authStore.clear();
      pb.collection('cotizaciones').unsubscribe('*').catch(() => {});
    },

    async subscribe(cb) {
      // Cotizaciones + eventos: PB no emite update a quien recién gana
      // visibilidad del registro (p. ej. asignación), pero sí el create
      // del evento asociado, que ya es visible para el vendedor.
      await Promise.all([
        pb.collection('cotizaciones').subscribe('*', () => cb()),
        pb.collection('cotizacion_eventos').subscribe('*', () => cb()),
      ]);
      return () => Promise.all([
        pb.collection('cotizaciones').unsubscribe('*'),
        pb.collection('cotizacion_eventos').unsubscribe('*'),
      ]);
    },

    async listTickets() {
      const [rows, items] = await Promise.all([
        pb.collection('cotizaciones').getFullList({
          sort: '-created',
          expand: 'cliente,asignado_a,creado_por',
        }),
        pb.collection('cotizacion_items').getFullList({ sort: 'orden' }),
      ]);
      const byTicket = new Map();
      for (const it of items) {
        const k = it.cotizacion;
        if (!byTicket.has(k)) byTicket.set(k, []);
        byTicket.get(k).push(it);
      }
      return rows.map((r) => mapRow({ ...r, items: byTicket.get(r.id) ?? [] }));
    },

    async getEventos(cotizacionId) {
      const rows = await pb.collection('cotizacion_eventos').getFullList({
        filter: `cotizacion = "${cotizacionId}"`,
        sort: '-created',
        expand: 'actor',
      });
      return rows.map((e) => ({
        id: e.id,
        tipo: e.tipo,
        detalle: e.detalle,
        actor: e.expand?.actor?.name ?? '',
        created_at: e.created,
      }));
    },

    async createTicket({ cliente, comprador, referencia, detalle, notas, adjuntos }) {
      const limpio = cliente.trim();
      let cli;
      try {
        cli = await pb
          .collection('clientes')
          .getFirstListItem(`nombre ~ "${limpio.replace(/"/g, '\\"')}"`);
      } catch {
        cli = await pb.collection('clientes').create({ nombre: limpio });
      }

      const fd = new FormData();
      fd.append('numero', String(await nextNumero()));
      fd.append('cliente', cli.id);
      fd.append('comprador', comprador ?? '');
      fd.append('referencia', referencia ?? '');
      fd.append('detalle', detalle ?? '');
      fd.append('notas', notas ?? '');
      fd.append('canal', 'whatsapp');
      fd.append('estado', 'pendiente');
      fd.append('creado_por', user().id);
      for (const f of adjuntos ?? []) fd.append('captura', f);

      const t = await pb.collection('cotizaciones').create(fd);
      await addEvento(t.id, 'creada', `Cliente: ${limpio}`);
      return t.id;
    },

    async setEstado(id, estado, extra = {}) {
      await pb.collection('cotizaciones').update(id, { estado, ...extra });
      await addEvento(id, 'estado', `→ ${ESTADO_LABEL[estado] ?? estado}`);
    },

    async entregarCotizacion(id, file) {
      const fd = new FormData();
      fd.append('cotizacion_pdf', file);
      fd.append('estado', 'por_revisar');
      await pb.collection('cotizaciones').update(id, fd);
      await addEvento(id, 'estado', `→ Por revisar (cotización adjunta: ${file.name})`);
    },

    async assign(id, vendedorId, vendedorNombre) {
      await pb
        .collection('cotizaciones')
        .update(id, { asignado_a: vendedorId, estado: 'asignada' });
      await addEvento(id, 'asignada', `→ ${vendedorNombre}`);
    },

    async addComentario(id, texto) {
      await addEvento(id, 'comentario', texto);
    },

    async listVendedores() {
      return pb.collection('vendedores').getFullList({ sort: 'nombre' });
    },

    async addVendedor(nombre) {
      await pb.collection('vendedores').create({ nombre: nombre.trim(), activo: true });
    },

    async toggleVendedor(v) {
      await pb.collection('vendedores').update(v.id, { activo: !v.activo });
    },

    async updateVendedor(v) {
      await pb.collection('vendedores').update(v.id, { nombre: v.nombre, telefono: v.telefono ?? '' });
    },

    async listClientes() {
      return pb.collection('clientes').getFullList({ sort: 'nombre' });
    },

    async capturaUrl(ticket) {
      if (!ticket.captura_path) return null;
      const token = await pb.files.getToken();
      return pb.files.getURL(ticket._raw, ticket.captura_path, { token });
    },

    async fileUrl(ticket, filename) {
      if (!filename) return null;
      const token = await pb.files.getToken();
      return pb.files.getURL(ticket._raw, filename, { token });
    },

    async adjuntosDe(ticket) {
      const token = await pb.files.getToken();
      return asArray(ticket.adjuntos).map((name) => ({
        name,
        url: pb.files.getURL(ticket._raw, name, { token }),
        esImagen: /\.(jpe?g|png|webp|gif)$/i.test(name),
      }));
    },

    async cotizacionUrl(ticket) {
      if (!ticket.cotizacion_pdf) return null;
      const token = await pb.files.getToken();
      return pb.files.getURL(ticket._raw, ticket.cotizacion_pdf, { token });
    },
  };
}

// ---------- Modo demo (localStorage) ----------

const DEMO_KEY = 'pyp-panel-demo-v1';
const DEMO_USER_KEY = 'pyp-panel-demo-user';

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function seedDemo() {
  const vendedores = [
    { id: 1, nombre: 'Marcelo', activo: true },
    { id: 2, nombre: 'Laura', activo: true },
    { id: 3, nombre: 'Diego', activo: true },
  ];
  const clientes = [
    { id: 1, nombre: 'Minera Los Cerros' },
    { id: 2, nombre: 'Electroandina S.A.' },
    { id: 3, nombre: 'Constructora Norte' },
    { id: 4, nombre: 'TecnoRed Instalaciones' },
  ];
  const mk = (id, c, comprador, estado, h, opts = {}) => ({
    id,
    numero: id,
    cliente_id: clientes.find((x) => x.nombre === c)?.id ?? null,
    cliente: c,
    comprador,
    referencia: opts.ref ?? '',
    canal: 'whatsapp',
    detalle: opts.detalle ?? '',
    notas: opts.notas ?? '',
    estado,
    asignado_a: opts.vend ?? null,
    asignado: vendedores.find((v) => v.id === opts.vend)?.nombre ?? null,
    captura_path: null,
    captura_url: null,
    adjuntos: opts.adjuntos ?? [],
    cotizacion_pdf: opts.pdf ? 'cotizacion-demo.pdf' : null,
    creado_por: 'demo',
    creado_por_nombre: 'Recepción',
    items: opts.items ?? [],
    created_at: hoursAgo(h),
    updated_at: hoursAgo(opts.upd ?? h),
  });
  return {
    seq: 100,
    vendedores,
    clientes,
    tickets: [
      mk(101, 'Minera Los Cerros', 'R. Gómez', 'pendiente', 0.4, {
        ref: 'OC-8821',
        detalle: 'Cable unipolar 2.5mm celeste x200m\nTermomagnética bipolar 32A x6',
      }),
      mk(102, 'Minera Los Cerros', 'S. Paz', 'pendiente', 0.3, {
        detalle: 'Curva rígida para caños de PVC x40',
      }),
      mk(103, 'Minera Los Cerros', 'R. Gómez', 'pendiente', 0.2, {
        ref: 'OC-8830',
        detalle: 'Tablero estanco 12 módulos x2\nCanaleta 40x40 x60m',
      }),
      mk(104, 'Electroandina S.A.', 'M. Ibáñez', 'asignada', 5, {
        vend: 1,
        upd: 3,
        ref: 'PED-2210',
        detalle: 'Disyuntor diferencial 4x40A x3',
      }),
      mk(105, 'Constructora Norte', 'P. Ledesma', 'en_proceso', 26, {
        vend: 2,
        upd: 9,
        notas: 'Urgente: obra frena el viernes.',
        detalle: 'Cable subterráneo 4x16mm x120m\nBoca octogonal chapa x50',
      }),
      mk(106, 'TecnoRed Instalaciones', 'J. Ruiz', 'por_revisar', 30, {
        vend: 3,
        upd: 4,
        pdf: true,
        detalle: 'Fusible NH00 63A x12',
      }),
      mk(107, 'Electroandina S.A.', 'M. Ibáñez', 'descartada', 50, {
        upd: 48,
        notas: 'El cliente canceló el pedido.',
        detalle: 'Reflector LED 200W x8',
      }),
    ],
    eventos: {},
  };
}

function makeDemo() {
  const load = () => {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
    const seed = seedDemo();
    localStorage.setItem(DEMO_KEY, JSON.stringify(seed));
    return seed;
  };
  const save = (db) => localStorage.setItem(DEMO_KEY, JSON.stringify(db));
  const me = () => JSON.parse(localStorage.getItem(DEMO_USER_KEY) || 'null');

  const pushEvento = (db, cotizacion_id, tipo, detalle) => {
    db.eventos[cotizacion_id] = db.eventos[cotizacion_id] ?? [];
    db.eventos[cotizacion_id].push({
      id: Date.now() + Math.random(),
      tipo,
      detalle,
      actor: me()?.nombre ?? 'Demo',
      created_at: new Date().toISOString(),
    });
  };

  return {
    mode: 'demo',

    async getSession() {
      const user = me();
      return user ? { user } : null;
    },

    async signInDemo(rol) {
      const user = {
        id: 'demo-' + rol,
        nombre:
          rol === 'coordinador'
            ? 'Coordinador Demo'
            : rol === 'vendedor'
              ? 'Vendedor Demo'
              : 'Recepción Demo',
        rol,
        vendedorId: rol === 'vendedor' ? 1 : null,
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
      return { user };
    },

    async signIn() {
      return { error: 'Modo demo: no hay auth real' };
    },

    async signOut() {
      localStorage.removeItem(DEMO_USER_KEY);
    },

    async subscribe() {
      return () => {};
    },

    async listTickets() {
      const db = load();
      let tickets = db.tickets;
      const u = me();
      if (u?.rol === 'vendedor') tickets = tickets.filter((t) => t.asignado_a === u.vendedorId);
      return tickets.map(mapRow).sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async getEventos(id) {
      return (load().eventos[id] ?? []).slice().reverse();
    },

    async createTicket({ cliente, comprador, referencia, detalle, notas, adjuntos }) {
      const db = load();
      const limpio = cliente.trim();
      let cli = db.clientes.find((c) => c.nombre.toLowerCase() === limpio.toLowerCase());
      if (!cli) {
        cli = { id: ++db.seq, nombre: limpio };
        db.clientes.push(cli);
      }
      const adjs = [];
      for (const f of adjuntos ?? []) {
        const url = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(f);
        });
        adjs.push({ name: f.name, url });
      }
      const id = ++db.seq;
      db.tickets.push({
        id,
        numero: id,
        cliente_id: cli.id,
        cliente: cli.nombre,
        comprador,
        referencia,
        canal: 'whatsapp',
        detalle,
        notas,
        estado: 'pendiente',
        asignado_a: null,
        asignado: null,
        captura_path: null,
        captura_url: null,
        adjuntos: adjs,
        cotizacion_pdf: null,
        creado_por: me()?.id,
        creado_por_nombre: me()?.nombre,
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      pushEvento(db, id, 'creada', `Cliente: ${cli.nombre}`);
      save(db);
      return id;
    },

    async setEstado(id, estado, extra = {}) {
      const db = load();
      const t = db.tickets.find((x) => x.id === id);
      if (!t) return;
      Object.assign(t, { estado, ...extra, updated_at: new Date().toISOString() });
      if ('asignado_a' in extra) {
        t.asignado = db.vendedores.find((v) => v.id === extra.asignado_a)?.nombre ?? null;
      }
      pushEvento(db, id, 'estado', `→ ${ESTADO_LABEL[estado] ?? estado}`);
      save(db);
    },

    async assign(id, vendedorId, vendedorNombre) {
      const db = load();
      const t = db.tickets.find((x) => x.id === id);
      if (!t) return;
      Object.assign(t, {
        asignado_a: vendedorId,
        asignado: vendedorNombre,
        estado: 'asignada',
        updated_at: new Date().toISOString(),
      });
      pushEvento(db, id, 'asignada', `→ ${vendedorNombre}`);
      save(db);
    },

    async addComentario(id, texto) {
      const db = load();
      pushEvento(db, id, 'comentario', texto);
      save(db);
    },

    async entregarCotizacion(id, file) {
      const db = load();
      const t = db.tickets.find((x) => x.id === id);
      if (!t) return;
      t.cotizacion_pdf = file.name;
      t.estado = 'por_revisar';
      t.updated_at = new Date().toISOString();
      pushEvento(db, id, 'estado', `→ Por revisar (cotización adjunta: ${file.name})`);
      save(db);
    },

    async adjuntosDe(ticket) {
      return (ticket.adjuntos ?? []).map((a) =>
        typeof a === 'string'
          ? { name: a, url: null, esImagen: /\.(jpe?g|png|webp|gif)$/i.test(a) }
          : { name: a.name, url: a.url, esImagen: /\.(jpe?g|png|webp|gif)$/i.test(a.name) },
      );
    },

    async cotizacionUrl(ticket) {
      return ticket.cotizacion_pdf ? '#' : null;
    },

    async listVendedores() {
      return load().vendedores;
    },

    async addVendedor(nombre) {
      const db = load();
      db.vendedores.push({ id: ++db.seq, nombre: nombre.trim(), activo: true });
      save(db);
    },

    async toggleVendedor(v) {
      const db = load();
      const t = db.vendedores.find((x) => x.id === v.id);
      if (t) t.activo = !t.activo;
      save(db);
    },

    async updateVendedor(v) {
      const db = load();
      const t = db.vendedores.find((x) => x.id === v.id);
      if (t) Object.assign(t, { nombre: v.nombre, telefono: v.telefono ?? '' });
      save(db);
    },

    async listClientes() {
      return load().clientes;
    },

    async capturaUrl(ticket) {
      return ticket.captura_url ?? null;
    },
  };
}
