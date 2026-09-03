// ===============================
// NICK REYNA DJ - SCRIPT
// ===============================


// ===============================
// SUPABASE / CRM
// ===============================
const SUPABASE_URL = "https://fmupremfenpregsliwqh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_yXXFHj6caCNXGJDorifV2w_IeAHpLMC";
const SUPABASE_COTIZACIONES_ENDPOINT = `${SUPABASE_URL}/rest/v1/cotizaciones`;

const cotizacionesRegistradas = new Set();

async function registrarCotizacionCRM(datos, codigo) {
    if (cotizacionesRegistradas.has(codigo)) return true;

    const payload = {
        codigo,
        cliente: cotNombre.value.trim(),
        whatsapp: cotWhatsapp.value.trim(),
        acepta_contacto: cotConsentimiento.checked,
        fecha_evento: cotFecha.value || null,
        tipo_evento: cotTipo.value,
        lugar: cotLugar.value.trim() || null,
        plan: datos.plan,
        extra_led: datos.led,
        extra_parlante: datos.parlante,
        extra_laser: datos.laser,
        total: Number(datos.total.toFixed(2)),
        estado: "Nueva"
    };

    const respuesta = await fetch(SUPABASE_COTIZACIONES_ENDPOINT, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        console.error("No se pudo registrar la cotización en el CRM:", respuesta.status, detalle);
        return false;
    }

    cotizacionesRegistradas.add(codigo);
    return true;
}

// Animación suave al hacer clic en los enlaces del menú
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            e.preventDefault();

            target.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});


// ===============================
// ANIMACIÓN DE SECCIONES
// ===============================

const sections = document.querySelectorAll(".section");

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {

            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }

        });
    },
    {
        threshold: 0.15
    }
);

sections.forEach(section => {
    observer.observe(section);
});

// ===============================
// COTIZADOR
// ===============================
const cotPlan = document.getElementById('cot-plan');
const cotNombre = document.getElementById('cot-nombre');
const cotWhatsapp = document.getElementById('cot-whatsapp');
const cotConsentimiento = document.getElementById('cot-consentimiento');
const cotFecha = document.getElementById('cot-fecha');
const cotTipo = document.getElementById('cot-tipo');
const cotLugar = document.getElementById('cot-lugar');
const extraLed = document.getElementById('extra-led');
const extraParlante = document.getElementById('extra-parlante');
const extraLaser = document.getElementById('extra-laser');
const extraBurbujas = document.getElementById('extra-burbujas');

let codigoCotizacionActual = '';

function generarCodigoCotizacion() {
    const ahora = new Date();
    const fecha = [
        String(ahora.getFullYear()).slice(-2),
        String(ahora.getMonth() + 1).padStart(2, '0'),
        String(ahora.getDate()).padStart(2, '0')
    ].join('');
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    return `NR-${fecha}-${aleatorio}`;
}

function obtenerCodigoCotizacion() {
    if (!codigoCotizacionActual) codigoCotizacionActual = generarCodigoCotizacion();
    return codigoCotizacionActual;
}


function datosCotizacion() {
    const opt = cotPlan.options[cotPlan.selectedIndex];
    const plan = opt.dataset.nombre;
    const base = Number(cotPlan.value);
    const laser = Math.min(1, Math.max(0, Number(extraLaser.value) || 0));
    const burbujas = Math.min(1, Math.max(0, Number(extraBurbujas.value) || 0));
    const led = Math.min(2, Math.max(0, Number(extraLed.value) || 0));
    const parlante = Math.min(2, Math.max(0, Number(extraParlante.value) || 0));
    const total = base + led * 20 + parlante * 60 + laser * 20 + burbujas * 25;
    return { plan, base, led, parlante, laser, burbujas, total };
}


function datosMinimosCompletos() {
    const telefono = (cotWhatsapp.value || "").replace(/\D/g, "");
    return Boolean(
        cotNombre.value.trim() &&
        cotFecha.value &&
        telefono.length >= 9 &&
        cotConsentimiento.checked
    );
}

function actualizarCotizador() {
    const d = datosCotizacion();
    document.getElementById('resumen-plan').textContent = `Plan ${d.plan}`;
    document.getElementById('cot-total').textContent = `S/${d.total.toFixed(2)}`;

    const filas = [`<div class="resumen-linea"><span>Plan ${d.plan}</span><strong>S/${d.base.toFixed(2)}</strong></div>`];
    if (d.led) filas.push(`<div class="resumen-linea"><span>${d.led} × PAR LED</span><strong>S/${(d.led*20).toFixed(2)}</strong></div>`);
    if (d.parlante) filas.push(`<div class="resumen-linea"><span>${d.parlante} × JBL EON 615</span><strong>S/${(d.parlante*60).toFixed(2)}</strong></div>`);
    if (d.laser) filas.push(`<div class="resumen-linea"><span>${d.laser} × Láser</span><strong>S/${(d.laser*20).toFixed(2)}</strong></div>`);
    if (d.burbujas) filas.push(`<div class="resumen-linea"><span>Máquina de Burbujas</span><strong>S/${(d.burbujas*25).toFixed(2)}</strong></div>`);
    document.getElementById('resumen-detalle').innerHTML = filas.join('');

    const codigo = obtenerCodigoCotizacion();

    const mensajeConsulta = `Hola Nick 👋, hice una cotización en tu web.

🧾 Código: ${codigo}
👤 Cliente: ${cotNombre.value || 'Por completar'}
📱 WhatsApp: ${cotWhatsapp.value || 'Por completar'}
📅 Fecha: ${cotFecha.value || 'Por confirmar'}
🎉 Evento: ${cotTipo.value}
📍 Lugar: ${cotLugar.value || 'Por confirmar'}
🎧 Plan: ${d.plan} (S/${d.base})
💡 PAR LED: ${d.led}
🔊 JBL EON 615 adicionales: ${d.parlante}
🔴 Láser: ${d.laser}
🫧 Máquina de Burbujas: ${d.burbujas}

💰 Total referencial: S/${d.total.toFixed(2)}

Quisiera confirmar disponibilidad.`;

    const mensajeSeparacion = `Hola Nick 👋, quisiera solicitar la separación de mi fecha.

🧾 Cotización: ${codigo}
👤 Cliente: ${cotNombre.value || 'Por completar'}
📅 Fecha: ${cotFecha.value || 'Por confirmar'}
🎉 Evento: ${cotTipo.value}
📍 Lugar: ${cotLugar.value || 'Por confirmar'}
🎧 Plan: ${d.plan}
💰 Total referencial: S/${d.total.toFixed(2)}

🔒 Entiendo que primero debo confirmar disponibilidad contigo antes de realizar cualquier pago.`;

    document.getElementById('btn-whatsapp-cot').href =
        `https://api.whatsapp.com/send/?phone=51969179145&text=${encodeURIComponent(mensajeConsulta)}`;

    const btnSeparar = document.getElementById('btn-separar-fecha');
    btnSeparar.href =
        `https://api.whatsapp.com/send/?phone=51969179145&text=${encodeURIComponent(mensajeSeparacion)}`;

    const listo = datosMinimosCompletos();
    btnSeparar.classList.toggle('cot-btn-deshabilitado', !listo);
    btnSeparar.setAttribute('aria-disabled', listo ? 'false' : 'true');
    btnSeparar.tabIndex = listo ? 0 : -1;
}

[cotPlan, cotNombre, cotWhatsapp, cotFecha, cotTipo, cotLugar, extraLed, extraParlante, extraLaser, extraBurbujas].forEach(el => {
    if (el) el.addEventListener('input', actualizarCotizador);
});
if (cotConsentimiento) cotConsentimiento.addEventListener('change', actualizarCotizador);

document.getElementById('btn-separar-fecha')?.addEventListener('click', function (e) {
    if (!datosMinimosCompletos()) {
        e.preventDefault();
        alert('Completa tu nombre, WhatsApp y fecha, y acepta el contacto antes de solicitar la separación.');
    }
});

function escaparHtml(texto='') {
    return texto.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

document.getElementById('btn-pdf')?.addEventListener('click', async () => {
    const telefonoLimpio = cotWhatsapp.value.replace(/\D/g, '');
    if (!cotNombre.value || !cotFecha.value || !cotWhatsapp.value) {
        alert('Completa tu nombre, WhatsApp y la fecha del evento para generar la cotización.');
        return;
    }
    if (telefonoLimpio.length < 9) {
        alert('Revisa el número de WhatsApp. Debe tener al menos 9 dígitos.');
        cotWhatsapp.focus();
        return;
    }
    if (!cotConsentimiento.checked) {
        alert('Marca la casilla de autorización para poder contactarte sobre tu cotización.');
        cotConsentimiento.focus();
        return;
    }
    const d = datosCotizacion();
    const fechaEvento = new Date(cotFecha.value + 'T00:00:00').toLocaleDateString('es-PE');
    const adicionales = [
        d.led ? `${d.led} × PAR LED — S/${(d.led*20).toFixed(2)}` : '',
        d.parlante ? `${d.parlante} × JBL EON 615 — S/${(d.parlante*60).toFixed(2)}` : '',
        d.laser ? `${d.laser} × Láser — S/${(d.laser*20).toFixed(2)}` : '',
        d.burbujas ? `1 × Máquina de Burbujas — S/${(d.burbujas*25).toFixed(2)}` : ''
    ].filter(Boolean);
    const numero = obtenerCodigoCotizacion();
    const inclusionesPlan = {
        "Básico": ["3 horas de show", "DJ profesional", "Todos los géneros musicales", "1 micrófono", "Movilidad incluida"],
        "Estándar": ["5 horas de show", "DJ profesional", "1 parlante JBL EON 615", "Todos los géneros musicales", "1 micrófono", "Movilidad incluida"],
"Plus": ["5 horas de show", "DJ profesional", "Todos los géneros musicales", "2 micrófonos", "2 parlantes JBL EON 615", "Paquete de iluminación: 4 PAR LED + 1 efecto Derby", "Movilidad incluida"]    };

    const igv = d.total / 1.18 * 0.18;
    const valorVenta = d.total - igv;
    const fechaEmision = new Date().toLocaleDateString("es-PE", {day:"2-digit", month:"2-digit", year:"numeric"});
    const extrasHtml = adicionales.length
        ? adicionales.map(x => {
            const partes = x.split(" — ");
            return `<tr><td>${partes[0]}</td><td class="precio-tabla">${partes[1]}</td></tr>`;
          }).join("")
        : `<tr><td class="muted">Sin adicionales</td><td class="precio-tabla">S/0.00</td></tr>`;

    const htmlCotizacion = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cotización ${numero}</title>
<style>
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;background:#ededed;color:#171717;margin:0;padding:28px}
.hoja{max-width:820px;margin:auto;background:#fff;box-shadow:0 8px 35px rgba(0,0,0,.12)}
.cabecera{background:#0b0b0b;color:#fff;padding:30px 36px;display:flex;justify-content:space-between;align-items:center;border-bottom:5px solid #ff1744}
.marca{font-size:30px;font-weight:900;letter-spacing:-1px}.marca span{color:#ff1744}.marca-sub{font-size:11px;letter-spacing:2px;color:#bdbdbd;margin-top:4px;font-weight:700}
.doc{text-align:right}.doc h1{font-size:23px;margin:0 0 5px;letter-spacing:1px}.doc div{font-size:12px;color:#cfcfcf;line-height:1.6}
.contenido{padding:34px 36px}
.saludo{margin:0 0 25px;color:#555;line-height:1.65;font-size:14px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:30px}
.box{border:1px solid #e2e2e2;border-radius:10px;padding:17px 18px;background:#fafafa}
.label{font-size:10px;color:#ff1744;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:7px}
.box strong{display:block;font-size:16px;margin-bottom:5px}.box p{margin:2px 0;color:#626262;font-size:13px}
.titulo{font-size:16px;margin:28px 0 12px;padding-bottom:9px;border-bottom:2px solid #171717}
.plan-destacado{display:flex;justify-content:space-between;align-items:center;background:#111;color:#fff;border-radius:10px;padding:18px 20px;margin-bottom:13px;border-left:5px solid #ff1744}
.plan-destacado small{display:block;color:#aaa;font-size:10px;letter-spacing:1px;margin-bottom:3px}.plan-destacado strong{font-size:18px}.plan-precio{font-size:22px;font-weight:900;color:#ff1744}
.incluye{display:grid;grid-template-columns:1fr 1fr;gap:7px 18px;padding:16px 18px;border:1px solid #e4e4e4;border-radius:10px}
.item{font-size:12px;color:#444}.item:before{content:"✓";color:#ff1744;font-weight:900;margin-right:7px}
table{width:100%;border-collapse:collapse;font-size:13px}td{padding:11px 4px;border-bottom:1px solid #e5e5e5}.precio-tabla{text-align:right;font-weight:700}.muted{color:#999}
.totales{width:310px;margin:18px 0 0 auto}.total-linea{display:flex;justify-content:space-between;padding:5px 0;color:#555;font-size:12px}.gran-total{display:flex;justify-content:space-between;margin-top:8px;padding-top:12px;border-top:2px solid #171717;font-size:21px;font-weight:900}.gran-total span:last-child{color:#ff1744}
.condiciones{margin-top:30px;padding:18px;background:#f7f7f7;border-radius:9px;border-left:3px solid #ff1744}.condiciones h3{font-size:13px;margin:0 0 9px}.condiciones ul{padding-left:18px;margin:0;color:#666;font-size:11px;line-height:1.7}
.gracias{text-align:center;padding:27px 20px 5px;font-size:14px;font-weight:700}
.pie{text-align:center;margin-top:25px;padding-top:18px;border-top:1px solid #e4e4e4;color:#777;font-size:11px;line-height:1.7}.pie strong{color:#171717}
.acciones{text-align:center;padding:0 0 30px}.acciones button{border:0;border-radius:7px;padding:13px 24px;background:#ff1744;color:#fff;font-weight:800;cursor:pointer}
@media(max-width:650px){body{padding:0}.hoja{box-shadow:none}.cabecera{padding:24px 20px;align-items:flex-start}.marca{font-size:23px}.doc h1{font-size:17px}.contenido{padding:25px 20px}.meta{grid-template-columns:1fr}.incluye{grid-template-columns:1fr}.totales{width:100%}}
@media print{body{background:#fff;padding:0}.hoja{box-shadow:none;max-width:none}.acciones{display:none}.contenido{padding:25px 32px}.cabecera{-webkit-print-color-adjust:exact;print-color-adjust:exact}.plan-destacado{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="hoja">
<header class="cabecera">
<div><div class="marca">NICK REYNA <span>DJ</span></div><div class="marca-sub">DJ · EVENTOS · EXPERIENCIAS</div></div>
<div class="doc"><h1>COTIZACIÓN</h1><div>${numero}<br>Emisión: ${fechaEmision}</div></div>
</header>
<main class="contenido">
<p class="saludo">Gracias por considerar a <strong>Nick Reyna DJ</strong> para ser parte de tu evento. A continuación encontrarás el detalle del servicio seleccionado y el presupuesto correspondiente.</p>

<div class="meta">
<div class="box"><div class="label">Cliente</div><strong>${escaparHtml(cotNombre.value)}</strong><p>${escaparHtml(cotTipo.value)}</p><p>📱 ${escaparHtml(cotWhatsapp.value)}</p></div>
<div class="box"><div class="label">Evento</div><strong>${fechaEvento}</strong><p>📍 ${escaparHtml(cotLugar.value || "Lugar por confirmar")}</p></div>
</div>

<h2 class="titulo">Servicio seleccionado</h2>
<div class="plan-destacado"><div><small>PLAN</small><strong>${d.plan.toUpperCase()}</strong></div><div class="plan-precio">S/${d.base.toFixed(2)}</div></div>
<div class="incluye">${inclusionesPlan[d.plan].map(i=>`<div class="item">${i}</div>`).join("")}</div>

<h2 class="titulo">Adicionales</h2>
<table><tbody>${extrasHtml}</tbody></table>

<div class="totales">
<div class="total-linea"><span>Valor de venta</span><span>S/${valorVenta.toFixed(2)}</span></div>
<div class="total-linea"><span>IGV (18%)</span><span>S/${igv.toFixed(2)}</span></div>
<div class="gran-total"><span>TOTAL</span><span>S/${d.total.toFixed(2)}</span></div>
</div>

<div class="condiciones">
<h3>Condiciones de la cotización</h3>
<ul>
<li>Servicio sujeto a disponibilidad de la fecha del evento.</li>
<li>Precios indicados incluyen IGV.</li>
<li>Precios válidos para Trujillo y alrededores.</li>
<li>Eventos fuera de la zona de cobertura pueden requerir un costo adicional de movilidad.</li>
<li>La reserva de la fecha se confirma según las condiciones acordadas con Nick Reyna DJ.</li>
</ul>
</div>

<div class="gracias">Gracias por confiar la música de tu celebración a Nick Reyna DJ. 🎧</div>
<footer class="pie"><strong>Nick Reyna DJ</strong><br>nickreyna.com · WhatsApp: +51 969 179 145<br>DJ para cumpleaños, quinceañeros, matrimonios, eventos corporativos y privados.</footer>
</main>
<div class="acciones"><button onclick="window.print()">Guardar / imprimir PDF</button></div>
</div>
</body>
</html>`;

    const blob = new Blob([htmlCotizacion], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const ventana = window.open(url, '_blank');

    if (!ventana) {
        URL.revokeObjectURL(url);
        alert('Tu navegador bloqueó la ventana de la cotización. Permite ventanas emergentes para esta página e inténtalo otra vez.');
        return;
    }

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    const guardadoCRM = await registrarCotizacionCRM(d, numero);

    const exito = document.getElementById('cot-exito');
    const codigoVisible = document.getElementById('cot-codigo-visible');
    if (codigoVisible) {
        codigoVisible.textContent = guardadoCRM
            ? `Código: ${numero} · Registrada ✅`
            : `Código: ${numero} · PDF creado, registro pendiente ⚠️`;
    }
    if (exito) exito.hidden = false;
});


actualizarCotizador();

// CONTROLES + / - DE AGREGADOS
document.querySelectorAll('.extra-mas, .extra-menos').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const min = Number(input.min || 0);
        const max = Number(input.max || 99);
        let valor = Number(input.value || 0);
        valor += btn.classList.contains('extra-mas') ? 1 : -1;
        input.value = Math.max(min, Math.min(max, valor));
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
});
