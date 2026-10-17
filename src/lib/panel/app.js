import Alpine from 'alpinejs';
import { createBackend, ESTADO_LABEL } from './backend';

const COLUMNAS = [
  { id: 'pendiente', label: 'Pendiente', hint: 'recién cargados' },
  { id: 'asignada', label: 'Asignada', hint: 'con vendedor' },
  { id: 'en_proceso', label: 'En proceso', hint: 'cotizándose' },
  { id: 'por_revisar', label: 'Por revisar', hint: 'espera supervisor' },
  { id: 'cotizada', label: 'Cotizada', hint: 'aprobada' },
  { id: 'enviada', label: 'Enviada', hint: 'al cliente' },
];

const ESTILO_ESTADO = {
  pendiente: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  asignada: 'bg-brand-500/15 text-brand-200 border-brand-400/30',
  en_proceso: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  por_revisar: 'bg-orange-400/15 text-orange-300 border-orange-400/30',
  cotizada: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  enviada: 'bg-teal-400/15 text-teal-300 border-teal-400/30',
  descartada: 'bg-steel-400/15 text-steel-300 border-steel-400/30',
};

Alpine.data('panel', () => ({
  backend: null,
  ready: false,
  mode: 'demo',
  user: null,

  // login
  loginEmail: '',
  loginPass: '',
  loginError: '',
  loginBusy: false,

  // datos
  tickets: [],
  vendedores: [],
  clientes: [],

  // ui
  columnas: COLUMNAS,
  estilos: ESTILO_ESTADO,
  labels: ESTADO_LABEL,
  q: '',
  filtroVendedor: '',
  showDescartadas: false,
  cotizadasVerTodo: false,
  sel: null,
  selEventos: [],
  selAdjuntos: [],
  selCotizacionUrl: null,
  cotizFile: null,
  assignSel: '',
  comentario: '',
  newVend: '',
  showNew: false,
  showVend: false,
  saving: false,
  errorMsg: '',
  toastMsg: '',
  toastKind: 'ok',
  dragId: null,
  dragOver: null,
  unread: 0,
  aviso: null,

  form: {
    cliente: '',
    comprador: '',
    referencia: '',
    detalle: '',
    notas: '',
    adjuntos: [],
  },

  async init() {
    this.backend = await createBackend();
    this.mode = this.backend.mode;
    try {
      const s = await this.backend.getSession();
      if (s?.user) {
        this.user = s.user;
        await this.refresh();
      }
    } catch (e) {
      this.errorMsg = 'No se pudo conectar con el servidor.';
    }
    this.ready = true;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.user) {
        // Si el SSE quedó muerto (reinicio del server, suspensión de la PC),
        // al volver el foco se re-suscribe desde cero.
        if (this._subscribed) {
          this._unsub?.();
          this._unsub = null;
          this._subscribed = false;
        }
        this.refresh();
      }
    });
  },

  // ---------- sesión ----------

  async login() {
    if (!this.loginEmail || !this.loginPass) return;
    this.loginBusy = true;
    this.loginError = '';
    const { error } = await this.backend.signIn(this.loginEmail, this.loginPass);
    if (error) {
      this.loginError = error;
    } else {
      this.pedirPermisoNotify();
      const s = await this.backend.getSession();
      this.user = s?.user ?? null;
      if (this.user) await this.refresh();
    }
    this.loginBusy = false;
  },

  async demoLogin(rol) {
    this.pedirPermisoNotify();
    const { user } = await this.backend.signInDemo(rol);
    this.user = user;
    await this.refresh();
  },

  async logout() {
    await this.backend.signOut();
    this.user = null;
    this.sel = null;
    this.unread = 0;
    this.aviso = null;
    this._baseline = false;
    this._subscribed = false;
    document.title = 'Panel de cotizaciones — PyP Electricidad';
  },

  // ---------- datos ----------

  async refresh() {
    try {
      this.errorMsg = '';
      const [t, v, c] = await Promise.all([
        this.backend.listTickets(),
        this.backend.listVendedores(),
        this.backend.listClientes(),
      ]);
      const prev = this.tickets;
      this.tickets = t;
      this.vendedores = v;
      this.clientes = c;
      if (this.sel) {
        const actual = this.tickets.find((x) => x.id === this.sel.id);
        if (actual) this.sel = actual;
      }
      this.detectAsignadas(prev);
      this.updateUnread();
      this.ensureSubscribed();
    } catch (e) {
      this.errorMsg = 'Error al cargar los pedidos. Reintentá.';
    }
  },

  // ---------- realtime + no leídos ----------

  ensureSubscribed() {
    if (this._subscribed || !this.backend.subscribe) return;
    this._subscribed = true;
    this.backend.subscribe(() => this.refresh()).then((u) => (this._unsub = u));
  },

  seenKey() {
    return `pyp-panel-seen-${this.user?.id ?? 'anon'}`;
  },

  lastSeen() {
    return Number(localStorage.getItem(this.seenKey()) || 0);
  },

  updateUnread() {
    if (document.hidden) {
      const seen = this.lastSeen();
      this.unread = this.tickets.filter((t) => new Date(t.updated_at).getTime() > seen).length;
    } else {
      this.unread = 0;
      localStorage.setItem(this.seenKey(), String(Date.now()));
    }
    document.title = this.unread > 0
      ? `(${this.unread}) Cotizaciones — PyP`
      : 'Panel de cotizaciones — PyP Electricidad';
  },

  // ---------- aviso de asignación ----------

  pedirPermisoNotify() {
    // En LAN por HTTP (http://192.168.x.x) Notification no existe: el aviso
    // en pestaña + sonido es el canal principal; la nativa queda para
    // localhost/HTTPS futuro.
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  },

  // El vendedor solo ve sus asignadas: un id nuevo en su lista = recién asignado.
  // La primera carga marca la línea base y no avisa.
  detectAsignadas(prev) {
    const myId = this.user?.vendedorId;
    if (!this.esVendedor || !myId) return;
    const antes = new Set(prev.map((t) => t.id));
    const nuevas = this._baseline
      ? this.tickets.filter((t) => !antes.has(t.id) && String(t.asignado_a) === String(myId))
      : [];
    this._baseline = true;
    if (nuevas.length) this.notifyAsignacion(nuevas[0]);
  },

  notifyAsignacion(t) {
    this.beep();
    this.aviso = t;
    clearTimeout(this._avisoT);
    this._avisoT = setTimeout(() => (this.aviso = null), 15000);
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(`Pedido #${t.numero} asignado — ${t.cliente}`, {
        body: [t.referencia ? `Ref/OC: ${t.referencia}` : null, t.detalle?.slice(0, 140)]
          .filter(Boolean)
          .join('\n'),
        icon: `${import.meta.env.BASE_URL}images/logo-pyp.png`,
        tag: `pyp-pedido-${t.id}`,
      });
      n.onclick = () => {
        window.focus();
        this.openTicket(t);
      };
    }
  },

  verAviso() {
    const t = this.aviso;
    this.aviso = null;
    if (t) this.openTicket(t);
  },

  beep() {
    try {
      this._ac = this._ac ?? new (window.AudioContext ?? window.webkitAudioContext)();
      if (this._ac.state === 'suspended') this._ac.resume();
      const t0 = this._ac.currentTime;
      for (const [freq, at] of [[880, 0], [1318.5, 0.13]]) {
        const o = this._ac.createOscillator();
        const g = this._ac.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(this._ac.destination);
        g.gain.setValueAtTime(0.0001, t0 + at);
        g.gain.exponentialRampToValueAtTime(0.18, t0 + at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.4);
        o.start(t0 + at);
        o.stop(t0 + at + 0.45);
      }
    } catch { /* sin audio disponible */ }
  },

  match(t) {
    if (this.filtroVendedor && String(t.asignado_a) !== this.filtroVendedor) return false;
    const q = this.q.trim().toLowerCase();
    if (!q) return true;
    return [t.cliente, t.comprador, t.referencia, String(t.numero ?? t.id)]
      .filter(Boolean)
      .some((f) => String(f).toLowerCase().includes(q));
  },

  ticketsEn(estado) {
    const list = this.tickets.filter((t) => t.estado === estado && this.match(t));
    if (estado === 'cotizada' && !this.cotizadasVerTodo) return list.slice(0, 8);
    return list;
  },

  cotizadasOcultas() {
    const total = this.tickets.filter((t) => t.estado === 'cotizada' && this.match(t)).length;
    return Math.max(0, total - 8);
  },

  count(estado) {
    return this.tickets.filter((t) => t.estado === estado && this.match(t)).length;
  },

  descartadas() {
    return this.tickets.filter((t) => t.estado === 'descartada' && this.match(t));
  },

  // ---------- edad / demora ----------

  edadHoras(t) {
    return (Date.now() - new Date(t.updated_at).getTime()) / 3600000;
  },

  edadLabel(t) {
    const h = this.edadHoras(t);
    if (h < 1) return `hace ${Math.max(1, Math.round(h * 60))}min`;
    if (h < 24) return `hace ${Math.round(h)}h`;
    return `hace ${Math.floor(h / 24)}d`;
  },

  lamp(t) {
    if (['cotizada', 'enviada', 'descartada'].includes(t.estado)) return '';
    const h = this.edadHoras(t);
    if (h >= 24) return 'bg-red-500';
    if (h >= 8) return 'bg-amber-400';
    return '';
  },

  // ---------- detalle ----------

  async openTicket(t) {
    this.sel = t;
    this.selEventos = [];
    this.selAdjuntos = [];
    this.selCotizacionUrl = null;
    this.cotizFile = null;
    this.assignSel = t.asignado_a ? String(t.asignado_a) : '';
    this.comentario = '';
    const [ev, adjs, cotUrl] = await Promise.all([
      this.backend.getEventos(t.id),
      this.backend.adjuntosDe(t),
      this.backend.cotizacionUrl(t),
    ]);
    this.selEventos = ev;
    this.selAdjuntos = adjs;
    this.selCotizacionUrl = cotUrl;
  },

  closeDetail() {
    this.sel = null;
    this.selEventos = [];
  },

  get esVendedor() {
    return this.user?.rol === 'vendedor';
  },

  esMio(t) {
    return this.esVendedor && t && String(t.asignado_a) === String(this.user?.vendedorId);
  },

  canAssign(t) {
    if (!t) return false;
    if (this.user?.rol === 'coordinador') return true;
    return this.user?.rol === 'recepcion' && t.creado_por === this.user?.id && t.estado === 'pendiente';
  },

  canEdit(t) {
    return this.canAssign(t);
  },

  // El vendedor opera solo sus asignadas; el coordinador revisa las entregas.
  vendorCan(t, accion) {
    if (!this.esMio(t)) return false;
    if (accion === 'trabajar' || accion === 'devolver') return ['asignada', 'en_proceso'].includes(t.estado);
    if (accion === 'entregar') return t.estado === 'en_proceso';
    return false;
  },

  coordRevisa(t) {
    return this.user?.rol === 'coordinador' && t?.estado === 'por_revisar';
  },

  async doAssign() {
    if (!this.sel || !this.assignSel) return;
    const vend = this.vendedores.find((v) => String(v.id) === this.assignSel);
    if (!vend) return;
    this.saving = true;
    try {
      await this.backend.assign(this.sel.id, vend.id, vend.nombre);
      await this.refresh();
      await this.openTicket(this.tickets.find((x) => x.id === this.sel.id) ?? this.sel);
      this.toast(`Asignado a ${vend.nombre}`);
    } catch (e) {
      this.toast('No se pudo asignar', 'err');
    }
    this.saving = false;
  },

  async setEstado(t, estado) {
    this.saving = true;
    try {
      const extra = estado === 'pendiente' ? { asignado_a: null } : {};
      await this.backend.setEstado(t.id, estado, extra);
      await this.refresh();
      if (this.sel?.id === t.id) await this.openTicket(this.tickets.find((x) => x.id === t.id) ?? t);
      this.toast(`Pedido #${t.numero} → ${this.labels[estado]}`);
    } catch (e) {
      this.toast('No se pudo cambiar el estado', 'err');
    }
    this.saving = false;
  },

  async descartar(t) {
    if (!window.confirm(`¿Descartar el pedido #${t.numero} de ${t.cliente}?`)) return;
    await this.setEstado(t, 'descartada');
  },

  onCotizFile(ev) {
    this.cotizFile = ev.target.files?.[0] ?? null;
  },

  async entregar() {
    if (!this.sel || !this.cotizFile || this.saving) return;
    this.saving = true;
    try {
      await this.backend.entregarCotizacion(this.sel.id, this.cotizFile);
      this.cotizFile = null;
      await this.refresh();
      await this.openTicket(this.tickets.find((x) => x.id === this.sel.id) ?? this.sel);
      this.toast('Cotización entregada para revisión');
    } catch (e) {
      this.toast('No se pudo entregar la cotización', 'err');
    }
    this.saving = false;
  },

  async addComentario() {
    const txt = this.comentario.trim();
    if (!txt || !this.sel) return;
    await this.backend.addComentario(this.sel.id, txt);
    this.comentario = '';
    this.selEventos = await this.backend.getEventos(this.sel.id);
  },

  // ---------- drag & drop ----------

  onDragStart(t, ev) {
    this.dragId = t.id;
    ev.dataTransfer.effectAllowed = 'move';
  },

  async onDrop(col) {
    this.dragOver = null;
    const t = this.tickets.find((x) => x.id === this.dragId);
    this.dragId = null;
    if (!t || t.estado === col) return;
    if (this.esVendedor) return; // el vendedor usa los botones del detalle
    if (col === 'asignada' && !t.asignado_a) {
      await this.openTicket(t);
      this.toast('Elegí un vendedor para asignar');
      return;
    }
    if (col === 'en_proceso' && t.estado === 'pendiente') {
      this.toast('Primero hay que asignarla a un vendedor');
      return;
    }
    if (col === 'por_revisar') {
      this.toast('Pasa a revisión cuando el vendedor sube el PDF');
      return;
    }
    if (col === 'cotizada' && !['por_revisar', 'en_proceso'].includes(t.estado)) {
      this.toast('Primero tiene que cotizarla un vendedor');
      return;
    }
    if (col === 'enviada' && t.estado !== 'cotizada') {
      this.toast('Solo se marcan enviadas las cotizadas');
      return;
    }
    await this.setEstado(t, col);
  },

  // ---------- nuevo pedido ----------

  openNew() {
    this.form = {
      cliente: '',
      comprador: '',
      referencia: '',
      detalle: '',
      notas: '',
      adjuntos: [],
    };
    this.showNew = true;
  },

  adjDrag: false,

  onAdjuntos(ev) {
    const files = [...(ev.target.files ?? [])];
    this.form.adjuntos.push(...files);
    ev.target.value = '';
  },

  onDropAdjunto(ev) {
    this.adjDrag = false;
    const files = [...(ev.dataTransfer?.files ?? [])];
    this.form.adjuntos.push(...files);
    if (files.length) this.toast(`${files.length} archivo(s) adjuntado(s)`);
  },

  onPasteAdjunto(ev) {
    const items = [...(ev.clipboardData?.items ?? [])];
    const imgs = items.filter((i) => i.kind === 'file' && i.type.startsWith('image/'));
    for (const it of imgs) {
      const f = it.getAsFile();
      if (!f) continue;
      const ext = f.type.split('/')[1] || 'png';
      this.form.adjuntos.push(new File([f], `captura-${Date.now()}.${ext}`, { type: f.type }));
    }
    if (imgs.length) {
      ev.preventDefault();
      this.toast('Captura pegada desde el portapapeles');
    }
  },

  removeAdjunto(i) {
    this.form.adjuntos.splice(i, 1);
  },

  get formValido() {
    return this.form.cliente.trim() && (this.form.detalle.trim() || this.form.adjuntos.length);
  },

  async crear() {
    if (!this.formValido || this.saving) return;
    this.saving = true;
    try {
      await this.backend.createTicket(this.form);
      this.showNew = false;
      await this.refresh();
      this.toast('Pedido cargado');
    } catch (e) {
      this.toast('No se pudo crear el pedido', 'err');
    }
    this.saving = false;
  },

  // ---------- vendedores ----------

  async addVend() {
    const nombre = this.newVend?.trim();
    if (!nombre) return;
    await this.backend.addVendedor(nombre);
    this.newVend = '';
    this.vendedores = await this.backend.listVendedores();
  },

  async toggleVend(v) {
    await this.backend.toggleVendedor(v);
    this.vendedores = await this.backend.listVendedores();
  },

  async saveVend(v) {
    await this.backend.updateVendedor(v);
    this.toast(`Teléfono de ${v.nombre} guardado`);
  },

  // ---------- whatsapp / misc ----------

  copyWA(t) {
    const lineas = [
      `*Pedido #${t.numero} — ${t.cliente}*`,
      t.comprador ? `Comprador: ${t.comprador}` : null,
      t.referencia ? `Ref/OC: ${t.referencia}` : null,
      t.detalle ? `\n${t.detalle}` : null,
      ...(t.items ?? []).map((i) => `• ${i.cantidad ? i.cantidad + (i.unidad || 'u') + ' × ' : ''}${i.descripcion}`),
      t.adjuntos?.length ? `\nAdjuntos: ${t.adjuntos.length} archivo(s) (ver panel)` : null,
      t.notas ? `\nNotas: ${t.notas}` : null,
    ].filter((l) => l !== null && l !== '');
    navigator.clipboard.writeText(lineas.join('\n')).then(
      () => this.toast('Resumen copiado para WhatsApp'),
      () => this.toast('No se pudo copiar', 'err'),
    );
  },

  fechaHora(iso) {
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  },

  toast(msg, kind = 'ok') {
    this.toastMsg = msg;
    this.toastKind = kind;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => (this.toastMsg = ''), 2600);
  },
}));

Alpine.start();
