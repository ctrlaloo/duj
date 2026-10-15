const C = window.CONFIG, firebaseConfig = window.firebaseConfig || {apiKey:"REEMPLAZA"}, configurado = !!window.configurado;
const $ = (id) => document.getElementById(id);

if (C) {
/* ---------- Contenido desde config.js ---------- */
document.title = C.titulo;
$("fechaPortada").textContent = `${C.fecha}\n${C.hora}`;
$("dcTitulo").textContent = C.dresscode.titulo;
$("dcFrase").textContent = C.dresscode.frase;
$("evFecha").textContent = C.fechaLarga; $("evHora").textContent = C.hora; $("evDir").textContent = C.direccion;
$("btnMapa").href = C.mapsUrl; $("mapa").href = C.mapsUrl; $("mapa").querySelector("img").src = C.imagenes.mapa;
[["imgPortada", C.imagenes.portada], ["imgO1", C.imagenes.outfit1], ["imgO2", C.imagenes.outfit2]].forEach(([id, src]) => {
  const img = $(id), fig = img.closest("figure");
  img.onerror = () => fig.classList.add("sin-img");
  img.src = src;
});

}

/* ---------- Papel rasgado: bordes irregulares ---------- */
function rand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
document.querySelectorAll("[data-tear]").forEach((el, k) => {
  const r = rand(97 + k * 31), pts = [], n = 28, j = () => r() * 1.3;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${j()}%`);
  for (let i = 1; i <= n * 1.5; i++) pts.push(`${100 - j()}% ${(i / (n * 1.5)) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - j()}%`);
  for (let i = n * 1.5; i >= 1; i--) pts.push(`${j()}% ${(i / (n * 1.5)) * 100}%`);
  el.style.clipPath = `polygon(${pts.join(",")})`;
});

/* ---------- Aparición al desplazarse ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("vis"), io.unobserve(e.target))), { threshold: .15 });
document.querySelectorAll(".reveal").forEach((n) => io.observe(n));

/* ---------- Música opcional (solo con clic) ---------- */
if (C && C.imagenes.musica) {
  const a = new Audio(C.imagenes.musica); a.loop = true; const b = $("musica"); b.hidden = false;
  b.onclick = () => { a.paused ? a.play() : a.pause(); b.style.opacity = a.paused ? .6 : 1; };
}

/* ---------- Formulario ---------- */
const form = $("form"), total = $("total"), aviso = $("aviso");
const estado = () => form.asiste.value;
function sincroniza() {
  const no = estado() === "no_asistira";
  $("campoTotal").classList.toggle("off", no);
  total.disabled = $("mas").disabled = $("menos").disabled = no;
  if (no) total.value = 0; else if (!(+total.value >= 1)) total.value = 1;
}
form.addEventListener("change", sincroniza);
$("mas").onclick = () => (total.value = Math.max(1, (parseInt(total.value) || 0) + 1));
$("menos").onclick = () => (total.value = Math.max(1, (parseInt(total.value) || 2) - 1));

function valida() {
  let ok = true; const nombre = $("nombre").value.trim().replace(/\s+/g, " ");
  const set = (id, m) => { $(id).textContent = m; if (m) ok = false; };
  set("eNombre", nombre.length < 2 ? "Escribe tu nombre completo." : nombre.length > 80 ? "El nombre es demasiado largo." : "");
  set("eAsiste", estado() ? "" : "Elige una opción para continuar.");
  const n = Number(total.value);
  set("eTotal", estado() === "confirmado" && (!Number.isInteger(n) || n < 1) ? "Indica al menos 1 persona (contándote a ti)." : "");
  return ok ? { name: nombre, status: estado(), total: estado() === "confirmado" ? n : 0 } : null;
}

let db, uid, fb, yaRespondio = false;
async function iniciaFirebase() {
  if (!configurado) { aviso.textContent = "La invitación aún no está conectada a Firebase (falta firebase-config.js)."; return; }
  try {
    const V = "10.12.2", base = `https://www.gstatic.com/firebasejs/${V}/`;
    const [{ initializeApp }, auth, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
    const app = initializeApp(firebaseConfig); const au = auth.getAuth(app); db = fs.getFirestore(app); fb = fs;
    uid = (au.currentUser || (await auth.signInAnonymously(au)).user).uid;
    const snap = await fs.getDoc(fs.doc(db, "rsvps", uid));
    if (snap.exists()) { yaRespondio = true; const d = snap.data(); prellena(d); muestraExito(d, true); }
  } catch (e) { console.error(e); aviso.textContent = "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."; }
}
function prellena(d) {
  $("nombre").value = d.name; form.asiste.value = d.status; total.value = d.total || 1; sincroniza();
  $("enviar").textContent = "Actualizar mi respuesta";
}
function muestraExito(d, previa) {
  form.hidden = true; $("exito").hidden = false;
  $("exitoT").textContent = d.status === "confirmado"
    ? (previa ? "Ya tengo tu respuesta guardada: ¡nos vemos ahí! 💗" : "¡Tu respuesta quedó registrada! Gracias por avisarme. 💗")
    : (previa ? "Ya tengo tu respuesta guardada. ¡Te voy a extrañar! 💗" : "Tu respuesta quedó registrada. Lamento que no puedas venir, ¡gracias por avisarme! 💗");
}
$("editar").onclick = () => { $("exito").hidden = true; form.hidden = false; };

form.addEventListener("submit", async (ev) => {
  ev.preventDefault(); aviso.textContent = "";
  const datos = valida(); if (!datos) return;
  if (!db) { aviso.textContent = configurado ? "Aún conectando… intenta de nuevo en un momento." : "Falta configurar Firebase: tu respuesta no se puede guardar todavía."; return; }
  const btn = $("enviar"); if (btn.disabled) return; btn.disabled = true; const t = btn.textContent; btn.textContent = "Guardando…";
  try {
    const ref = fb.doc(db, "rsvps", uid);
    if (yaRespondio) await fb.updateDoc(ref, { ...datos, updatedAt: fb.serverTimestamp() });
    else await fb.setDoc(ref, { ...datos, createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp() });
    yaRespondio = true; btn.textContent = "Actualizar mi respuesta"; muestraExito(datos, false);
  } catch (e) { console.error(e); btn.textContent = t; aviso.textContent = "No se pudo guardar tu respuesta. Inténtalo otra vez en unos segundos."; }
  finally { btn.disabled = false; }
});
iniciaFirebase();
