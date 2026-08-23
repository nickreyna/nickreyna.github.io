
const URL_BASE = "https://fmupremfenpregsliwqh.supabase.co";
const KEY = "sb_publishable_yXXFHj6caCNXGJDorifV2w_IeAHpLMC";
const API = `${URL_BASE}/rest/v1/cotizaciones`;
const API_PAGOS = `${URL_BASE}/rest/v1/pagos`;
const AUTH = `${URL_BASE}/auth/v1`;

let accessToken = sessionStorage.getItem("nr_access_token") || "";
let cotizaciones = [];
let pagos = [];
let fichaActual = null;
let fechaCalendario = new Date();

const $ = id => document.getElementById(id);
const headers = (extra={}) => ({ apikey: KEY, Authorization: `Bearer ${accessToken}`, ...extra });

async function login(email,password){
  const r=await fetch(`${AUTH}/token?grant_type=password`,{
    method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email,password})
  });
  if(!r.ok) throw new Error("Correo o contraseña incorrectos.");
  const d=await r.json(); accessToken=d.access_token;
  sessionStorage.setItem("nr_access_token",accessToken);
}

async function cargar(){
  const [rc,rp]=await Promise.all([
    fetch(`${API}?select=*&order=created_at.desc`,{headers:headers()}),
    fetch(`${API_PAGOS}?select=*&order=fecha_pago.desc,created_at.desc`,{headers:headers()})
  ]);
  if(rc.status===401||rp.status===401) return salir();
  if(!rc.ok) throw new Error("No se pudieron cargar las cotizaciones.");
  if(!rp.ok) throw new Error("No se pudieron cargar los pagos.");
  cotizaciones=await rc.json();
  pagos=await rp.json();
  pintar();
}

function estadoClase(estado=""){
  return "badge-" + estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function normalizarTelefono(v=""){
  let n=String(v).replace(/\D/g,"");
  if(n.length===9) n="51"+n;
  return n;
}

function mensajeContacto(c){
  return encodeURIComponent(`Hola ${c.cliente || ""}, soy Nick Reyna DJ 🎧. Vi tu cotización ${c.codigo} para ${c.tipo_evento || "tu evento"}${c.fecha_evento ? " del "+c.fecha_evento : ""}. Quería ayudarte a confirmar disponibilidad y resolver cualquier duda.`);
}

function pagosDe(id){return pagos.filter(p=>String(p.cotizacion_id)===String(id));}
function totalPagado(c){return pagosDe(c.id).reduce((a,p)=>a+Number(p.monto||0),0)+Number(c.adelanto||0);}
function precioFinal(c){return c.precio_acordado==null?Number(c.total||0):Number(c.precio_acordado||0);}
function saldoDe(c){return Math.max(0,precioFinal(c)-totalPagado(c));}
function fechaLocal(s){return s?new Date(s+"T00:00:00").toLocaleDateString("es-PE"):"";}
function isoHoy(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}

function extrasResumen(c){
  const extras=[];
  const led=Number(c.extra_led||0), parlante=Number(c.extra_parlante||0), laser=Number(c.extra_laser||0);
  if(led>0) extras.push(`LED${led>1?" ×"+led:""}`);
  if(parlante>0) extras.push(`Parlante${parlante>1?" ×"+parlante:""}`);
  if(laser>0) extras.push(`Láser${laser>1?" ×"+laser:""}`);
  return extras.length?extras.join(" + "):"Sin adicionales";
}

function pintarProximos(){
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const proximos = cotizaciones
    .filter(c=>c.fecha_evento && c.estado==="Separado")
    .map(c=>({...c,_f:new Date(c.fecha_evento+"T00:00:00")}))
    .filter(c=>c._f>=hoy)
    .sort((a,b)=>a._f-b._f)
    .slice(0,6);
  $("proximos-count").textContent=proximos.length;
  $("proximos-lista").innerHTML=proximos.length ? proximos.map(c=>`
    <div class="prox" data-ficha="${c.id}">
      <strong>${esc(c.cliente)} · ${esc(c.tipo_evento||"Evento")}</strong>
      <span>📅 ${c._f.toLocaleDateString("es-PE")}</span>
      <span>🎧 ${esc(c.plan||"Sin plan")} · ${extrasResumen(c)}</span>
      <span>💰 ${dinero(precioFinal(c))} · Pagado ${dinero(totalPagado(c))}</span>
      <span class="${saldoDe(c)<=0?"prox-pagado":"prox-pendiente"}">${saldoDe(c)<=0?"🟢 PAGADO ✓":"🟠 Falta "+dinero(saldoDe(c))}</span>
    </div>
  `).join("") : `<div class="vacio" style="grid-column:1/-1;padding:18px">No hay eventos próximos.</div>`;
}

function pintarCalendario(){
  const y=fechaCalendario.getFullYear(),m=fechaCalendario.getMonth();
  $("cal-titulo").textContent=new Intl.DateTimeFormat("es-PE",{month:"long",year:"numeric"}).format(fechaCalendario).replace(/^./,x=>x.toUpperCase());
  const first=new Date(y,m,1),offset=(first.getDay()+6)%7,start=new Date(y,m,1-offset),hoy=new Date();hoy.setHours(0,0,0,0);
  const dias=[];
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const eventos=cotizaciones.filter(c=>c.fecha_evento===iso);
    dias.push(`<div class="cal-dia ${d.getMonth()!==m?"otro-mes":""} ${d.getTime()===hoy.getTime()?"hoy":""}"><div class="cal-num">${d.getDate()}</div><div class="cal-eventos">${eventos.map(c=>`<button type="button" class="cal-evento ${(c.estado||"Nueva").toLowerCase()}" data-ficha="${c.id}">${esc(c.cliente)}</button>`).join("")}</div></div>`);
  }
  $("cal-grid").innerHTML=dias.join("");
  document.querySelectorAll("#cal-grid [data-ficha]").forEach(b=>b.addEventListener("click",()=>abrirFicha(b.dataset.ficha)));
}

function pintar(){
  const q=$("buscar").value.trim().toLowerCase(), f=$("filtro").value, fp=$("filtro-plan").value;
  const rows=cotizaciones.filter(c=>{
    const texto=[c.codigo,c.cliente,c.tipo_evento,c.lugar,c.plan,c.whatsapp].join(" ").toLowerCase();
    return (!q||texto.includes(q))&&(!f||c.estado===f)&&(!fp||c.plan===fp);
  });
  $("stat-total").textContent=cotizaciones.length;
  $("stat-nuevas").textContent=cotizaciones.filter(c=>c.estado==="Nueva").length;
  $("stat-separadas").textContent=cotizaciones.filter(c=>c.estado==="Separado").length;
  $("stat-potencial").textContent="S/"+cotizaciones.filter(c=>!["Cancelado","Realizado"].includes(c.estado)).reduce((a,c)=>a+Number(c.total||0),0).toFixed(2);
  $("stat-cobrar").textContent="S/"+cotizaciones.filter(c=>c.estado!=="Cancelado").reduce((a,c)=>a+saldoDe(c),0).toFixed(2);
  $("stat-cobrado").textContent="S/"+cotizaciones.filter(c=>c.estado!=="Cancelado").reduce((a,c)=>a+totalPagado(c),0).toFixed(2);
  $("stat-confirmado").textContent="S/"+cotizaciones.filter(c=>c.estado==="Separado").reduce((a,c)=>a+precioFinal(c),0).toFixed(2);
  pintarProximos();
  pintarCalendario();

  $("lista").innerHTML=rows.length?rows.map(c=>{
    const tel = normalizarTelefono(c.whatsapp||"");
    const puedeContactar = Boolean(tel && c.acepta_contacto);
    const badge = estadoClase(c.estado||"Nueva");
    return `
    <article class="cot">
      <div>
        <div class="codigo">${esc(c.codigo)}</div>
        <h3>${esc(c.cliente)}</h3>
        <div class="detalle">${esc(c.tipo_evento)} · ${esc(c.lugar||"Lugar por confirmar")}<br>Plan ${esc(c.plan)}</div>
        <div class="contacto">
          ${c.whatsapp ? `<span class="tel">📱 ${esc(c.whatsapp)}</span>` : `<span class="no-contacto">Sin WhatsApp registrado</span>`}
          ${puedeContactar ? `<a class="whatsapp-btn" href="https://wa.me/${tel}?text=${mensajeContacto(c)}" target="_blank" rel="noopener noreferrer">💬 CONTACTAR</a>` : `<span class="no-contacto">${c.whatsapp ? "Sin autorización de contacto" : ""}</span>`}
        </div>
        <div class="cot-acciones"><button class="ver-ficha" type="button" data-ficha="${c.id}">👁 VER FICHA</button></div>
      </div>
      <div>
        <div class="fecha">📅 ${esc(c.fecha_evento||"Por confirmar")}</div>
        <div class="detalle">Creada: ${new Date(c.created_at).toLocaleString("es-PE")}</div>
      </div>
      <div class="monto">S/${Number(c.total||0).toFixed(2)}</div>
      <div class="estado">
        <span class="badge ${badge}">${esc(c.estado||"Nueva")}</span>
        <select data-id="${c.id}">${["Nueva","Contactado","Separado","Realizado","Cancelado"].map(e=>`<option ${c.estado===e?"selected":""}>${e}</option>`).join("")}</select>
      </div>
    </article>`;
  }).join(""):`<div class="vacio">No hay cotizaciones con esos filtros.</div>`;

  document.querySelectorAll(".estado select").forEach(s=>s.addEventListener("change",()=>actualizar(s.dataset.id,s.value,s)));
  document.querySelectorAll("[data-ficha]").forEach(b=>b.addEventListener("click",()=>abrirFicha(b.dataset.ficha)));
}


function dinero(v){return "S/"+Number(v||0).toFixed(2)}

function actualizarResumenFicha(){
  if(!fichaActual)return;
  const precioRaw=$("ficha-precio").value;
  const precio=precioRaw===""?null:Number(precioRaw);
  const acuerdo=precio===null?Number(fichaActual.total||0):precio;
  const temp={...fichaActual,precio_acordado:precio};
  const pagado=totalPagado(temp),saldo=Math.max(0,acuerdo-pagado);
  $("ficha-acordado-vista").textContent=precio===null?"—":dinero(precio);
  $("ficha-adelanto-vista").textContent=dinero(pagado);
  $("ficha-saldo").textContent=dinero(saldo);
  let txt="PENDIENTE",cl="pago-pendiente";if(pagado>0&&pagado<acuerdo){txt="PAGO PARCIAL";cl="pago-parcial"}else if(pagado>=acuerdo&&acuerdo>0){txt="PAGADO";cl="pago-pagado"}
  $("ficha-pago-badge").className=cl;$("ficha-pago-badge").textContent=txt;$("pagos-total-pill").textContent=dinero(pagado);
}

function abrirFicha(id){
  const c=cotizaciones.find(x=>String(x.id)===String(id)); if(!c)return;
  fichaActual=c;
  $("ficha-titulo").textContent=c.cliente||"Cliente";
  $("ficha-subtitulo").textContent=`${c.codigo||""} · ${c.tipo_evento||"Evento"} · ${c.fecha_evento||"Fecha por confirmar"}`;
  $("ficha-estado").className=`badge ${estadoClase(c.estado||"Nueva")}`;
  $("ficha-estado").textContent=c.estado||"Nueva";
  $("ficha-cotizado").textContent=dinero(c.total);
  $("ficha-hora").value=c.hora_evento ? String(c.hora_evento).slice(0,5) : "";
  $("ficha-direccion").value=c.direccion_evento||"";
  $("ficha-precio").value=c.precio_acordado??"";
  $("ficha-adelanto").value=c.adelanto??0;
  $("ficha-notas").value=c.notas||"";
  $("ficha-gestion").value=c.ultima_gestion||"";
  $("ficha-whatsapp").textContent=c.whatsapp?`📱 ${c.whatsapp}${c.acepta_contacto?" · Contacto autorizado":" · Sin autorización"}`:"📱 Sin WhatsApp registrado";
  const tel=normalizarTelefono(c.whatsapp||""), wa=$("ficha-wa-btn");
  if(tel&&c.acepta_contacto){wa.hidden=false;wa.href=`https://wa.me/${tel}?text=${mensajeContacto(c)}`}else{wa.hidden=true;wa.removeAttribute("href")}
  $("ficha-guardado").textContent="";
  $("pago-monto").value="";$("pago-metodo").value="";$("pago-nota").value="";$("pago-fecha").value=isoHoy();$("pago-msg").textContent="";
  pintarPagosFicha();actualizarResumenFicha();
  $("ficha-modal").hidden=false;
  document.body.style.overflow="hidden";
}

function cerrarFicha(){
  $("ficha-modal").hidden=true;document.body.style.overflow="";fichaActual=null;
}

function pintarPagosFicha(){
  if(!fichaActual)return;
  let h="";
  if(Number(fichaActual.adelanto||0)>0)h+=`<div class="pago-row legacy"><span class="pago-fecha">Anterior</span><span class="pago-metodo">Adelanto previo</span><span class="pago-nota">Registrado antes del historial</span><strong class="pago-monto">${dinero(fichaActual.adelanto)}</strong><span></span></div>`;
  h+=pagosDe(fichaActual.id).map(p=>`<div class="pago-row"><span class="pago-fecha">${fechaLocal(p.fecha_pago)}</span><span class="pago-metodo">${esc(p.metodo||"Otro")}</span><span class="pago-nota">${esc(p.nota||"Sin nota")}</span><strong class="pago-monto">${dinero(p.monto)}</strong><button type="button" class="pago-borrar" data-pago="${p.id}">Eliminar</button></div>`).join("");
  $("pagos-lista").innerHTML=h||`<div class="sin-pagos">Todavía no hay pagos registrados.</div>`;
  document.querySelectorAll("[data-pago]").forEach(b=>b.addEventListener("click",()=>borrarPago(b.dataset.pago)));
}
async function registrarPago(){
  if(!fichaActual)return;const monto=Number($("pago-monto").value||0);if(monto<=0){$("pago-msg").textContent="Ingresa un monto válido.";return}
  const payload={cotizacion_id:fichaActual.id,monto,metodo:$("pago-metodo").value,nota:$("pago-nota").value.trim()||null,fecha_pago:$("pago-fecha").value||isoHoy()};
  $("pago-msg").textContent="Guardando...";
  const r=await fetch(API_PAGOS,{method:"POST",headers:headers({"Content-Type":"application/json","Prefer":"return=representation"}),body:JSON.stringify(payload)});
  if(!r.ok){$("pago-msg").textContent="❌ No se pudo registrar";return}
  pagos.unshift((await r.json())[0]);
  $("pago-msg").textContent="✓ Pago registrado";
  $("pago-monto").value="";
  $("pago-nota").value="";
  pintarPagosFicha();
  actualizarResumenFicha();
  pintar();
  setTimeout(()=>{ if($("pago-msg")) $("pago-msg").textContent=""; },2500);
}
async function borrarPago(id){
  if(!confirm("¿Eliminar este pago del historial?"))return;
  const r=await fetch(`${API_PAGOS}?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:headers({"Prefer":"return=minimal"})});
  if(!r.ok){alert("No se pudo eliminar el pago.");return}
  pagos=pagos.filter(p=>String(p.id)!==String(id));pintarPagosFicha();actualizarResumenFicha();pintar();
}

async function guardarFicha(e){
  e.preventDefault(); if(!fichaActual)return;
  const precio=$("ficha-precio").value===""?null:Number($("ficha-precio").value);
  const payload={
    hora_evento:$("ficha-hora").value||null,
    direccion_evento:$("ficha-direccion").value.trim()||null,
    precio_acordado:precio,
    notas:$("ficha-notas").value.trim()||null,
    ultima_gestion:$("ficha-gestion").value.trim()||null
  };
  $("ficha-guardado").textContent="Guardando...";
  const btnGuardar=$("btn-guardar-ficha");
  if(btnGuardar){btnGuardar.disabled=true;btnGuardar.textContent="Guardando...";}
  const r=await fetch(`${API}?id=eq.${encodeURIComponent(fichaActual.id)}`,{
    method:"PATCH",headers:headers({"Content-Type":"application/json","Prefer":"return=minimal"}),
    body:JSON.stringify(payload)
  });
  if(!r.ok){
    $("ficha-guardado").textContent="❌ No se pudo guardar";
    if(btnGuardar){btnGuardar.disabled=false;btnGuardar.textContent="💾 Guardar ficha";}
    return;
  }
  Object.assign(fichaActual,payload);
  $("ficha-guardado").textContent="✓ Guardado";
  if(btnGuardar){btnGuardar.disabled=false;btnGuardar.textContent="💾 Guardar ficha";}
  actualizarResumenFicha();
  pintar();
  setTimeout(()=>{ if($("ficha-guardado")) $("ficha-guardado").textContent=""; },2500);
}

async function actualizar(id,estado,select){
  select.disabled=true;
  const r=await fetch(`${API}?id=eq.${encodeURIComponent(id)}`,{
    method:"PATCH",headers:headers({"Content-Type":"application/json","Prefer":"return=minimal"}),
    body:JSON.stringify({estado})
  });
  select.disabled=false;
  if(!r.ok){ alert("No se pudo actualizar el estado."); return cargar(); }
  const c=cotizaciones.find(x=>String(x.id)===String(id)); if(c)c.estado=estado; pintar();
}

function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function mostrarCRM(){$("login").hidden=true;$("crm").hidden=false;cargar().catch(e=>$("crm-msg").textContent=e.message);}
function salir(){accessToken="";sessionStorage.removeItem("nr_access_token");$("crm").hidden=true;$("login").hidden=false;}

$("login-form").addEventListener("submit",async e=>{e.preventDefault();$("login-msg").textContent="Entrando...";
 try{await login($("email").value,$("password").value);$("login-msg").textContent="";mostrarCRM();}
 catch(err){$("login-msg").textContent=err.message;}
});
$("logout").addEventListener("click",salir);
$("buscar").addEventListener("input",pintar);$("filtro").addEventListener("change",pintar);$("filtro-plan").addEventListener("change",pintar);
$("cerrar-ficha").addEventListener("click",cerrarFicha);
document.querySelector(".modal-backdrop").addEventListener("click",cerrarFicha);
$("ficha-form").addEventListener("submit",guardarFicha);
$("btn-registrar-pago").addEventListener("click",registrarPago);
$("ficha-precio").addEventListener("input",actualizarResumenFicha);
$("cal-prev").addEventListener("click",()=>{fechaCalendario=new Date(fechaCalendario.getFullYear(),fechaCalendario.getMonth()-1,1);pintarCalendario()});
$("cal-next").addEventListener("click",()=>{fechaCalendario=new Date(fechaCalendario.getFullYear(),fechaCalendario.getMonth()+1,1);pintarCalendario()});
$("cal-hoy").addEventListener("click",()=>{fechaCalendario=new Date();pintarCalendario()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("ficha-modal").hidden)cerrarFicha()});
if(accessToken) mostrarCRM();
