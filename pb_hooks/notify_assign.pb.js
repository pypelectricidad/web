/// <reference path="../pb_data/types.d.ts" />
// Aviso de nueva cotización asignada por WhatsApp.
// Copiar esta carpeta `pb_hooks/` junto al ejecutable de PocketBase en el servidor.
//
// Se activa cuando un pedido cambia `asignado_a` (asignación de vendedor).
// Dos destinos posibles, configurables por variables de entorno del proceso:
//
//   WA_NOTIFY_URL  → webhook genérico (Make/Zapier/n8n/propio). Recibe POST JSON:
//                    { numero, cliente, vendedor, telefono, referencia, detalle }
//                    Recomendado mientras no haya integración directa con Meta.
//
//   WA_TOKEN + WA_PHONE_ID → WhatsApp Cloud API de Meta. Requiere:
//     - app de Meta for Developers + WhatsApp Business API configurada
//     - template aprobado cuyo nombre va en WA_TEMPLATE (default 'aviso_cotizacion')
//       con 2 parámetros de cuerpo: {{1}} vendedor, {{2}} "pedido #n — cliente"
//     - el vendedor debe tener `telefono` cargado en formato internacional (54911…)
//
// Si ninguna variable está definida, el hook no hace nada.

onRecordAfterUpdateSuccess((e) => {
  const rec = e.record;
  const prev = rec.original().get('asignado_a');
  const next = rec.get('asignado_a');
  if (!next || prev === next) return;

  let vend;
  try {
    vend = $app.findRecordById('vendedores', next);
  } catch {
    return;
  }
  let cliente = '';
  try {
    cliente = $app.findRecordById('clientes', rec.get('cliente')).getString('nombre');
  } catch { /* cliente opcional */ }

  const payload = {
    numero: rec.get('numero'),
    cliente,
    vendedor: vend.getString('nombre'),
    telefono: vend.getString('telefono'),
    referencia: rec.getString('referencia'),
    detalle: rec.getString('detalle').slice(0, 500),
  };

  const hookUrl = process.env.WA_NOTIFY_URL || '';
  if (hookUrl) {
    try {
      $http.send({
        url: hookUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 10,
      });
    } catch (err) {
      $app.logger().error('WA_NOTIFY_URL fallo', 'error', err);
    }
  }

  const token = process.env.WA_TOKEN;
  const phoneId = process.env.WA_PHONE_ID;
  if (!token || !phoneId || !payload.telefono) return;

  const template = process.env.WA_TEMPLATE || 'aviso_cotizacion';
  try {
    $http.send({
      url: `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: payload.telefono,
        type: 'template',
        template: {
          name: template,
          language: { code: 'es_AR' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: payload.vendedor },
                { type: 'text', text: `#${payload.numero} — ${payload.cliente}` },
              ],
            },
          ],
        },
      }),
    });
  } catch (err) {
    $app.logger().error('WhatsApp Cloud API fallo', 'error', err);
  }
}, 'cotizaciones');
