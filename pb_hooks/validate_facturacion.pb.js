/// <reference path="../pb_data/types.d.ts" />
// Regla de facturación: consumidor_final lo cierra el vendedor;
// factura_a la cierra el coordinador.
// Las reglas de colección no comparan valor nuevo vs anterior, así que
// esta restricción se aplica acá, server-side, sobre cualquier cliente.

onRecordUpdateRequest((e) => {
  const auth = e.requestInfo()?.auth;
  if (!auth || auth.get('rol') !== 'vendedor') {
    e.next();
    return;
  }

  const rec = e.record;
  const prev = rec.original();
  const fact = rec.get('facturacion') || 'consumidor_final';

  // El vendedor no puede cambiar la condición de facturación.
  if (rec.get('facturacion') !== prev.get('facturacion')) {
    throw new ForbiddenError('La condición de facturación solo la cambia recepción o el coordinador.');
  }

  // Factura A: facturar/remitir es del coordinador.
  if (fact === 'factura_a' && ['facturada', 'remitida'].includes(rec.get('estado'))) {
    throw new ForbiddenError('Las ventas con Factura A las confirma el coordinador.');
  }

  e.next();
}, 'cotizaciones');
