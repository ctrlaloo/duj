const firebaseConfig = window.firebaseConfig, configurado = window.configurado;
const $ = (id) => document.getElementById(id);
if (!configurado) { $("eLogin").textContent = "Falta configurar firebase-config.js."; throw new Error("Firebase sin configurar"); }
const B = "https://www.gstatic.com/firebasejs/10.12.2/";
const [{ initializeApp }, A, F] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
const app = initializeApp(firebaseConfig), auth = A.getAuth(app), db = F.getFirestore(app);
let filas = [], unsub = null, editId = null, delId = null;

$("fLogin").onsubmit = async (e) => {
  e.preventDefault(); $("eLogin").textContent = "";
  try { await A.signInWithEmailAndPassword(auth, $("email").value.trim(), $("pass").value); }
  catch { $("eLogin").textContent = "Correo o contraseña incorrectos."; }
};
$("salir").onclick = () => A.signOut(auth);
A.onAuthStateChanged(auth, (u) => {
  if (unsub) unsub();
  const dentro = u && !u.isAnonymous; $("vLogin").hidden = !!dentro; $("vPanel").hidden = !dentro; $("pass").value = "";
  if (!dentro) return;
  unsub = F.onSnapshot(F.collection(db, "rsvps"), (s) => { filas = s.docs.map((d) => ({ id: d.id, ...d.data() })); pinta(); },
    () => { $("vacio").hidden = false; $("vacio").textContent = "Esta cuenta no tiene permiso para ver las respuestas."; });
});
const ms = (t) => (t && t.toMillis ? t.toMillis() : 0);
const fmt = (t) => (ms(t) ? new Date(ms(t)).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function pinta() {
  const conf = filas.filter((r) => r.status === "confirmado");
  $("sPersonas").textContent = conf.reduce((a, r) => a + (r.total || 0), 0);
  $("sConf").textContent = conf.length; $("sNo").textContent = filas.length - conf.length; $("sRes").textContent = filas.length;
  const q = $("q").value.trim().toLowerCase(), f = $("fil").value, [campo, dir] = $("ord").value.split("-");
  const vis = filas.filter((r) => (!f || r.status === f) && r.name.toLowerCase().includes(q))
    .sort((a, b) => (campo === "nombre" ? a.name.localeCompare(b.name, "es") : ms(a.createdAt) - ms(b.createdAt)) * (dir === "asc" ? 1 : -1));
  $("tb").innerHTML = vis.map((r) => `<tr><td>${esc(r.name)}</td><td><span class="pill ${r.status === "confirmado" ? "ok" : "no"}">${r.status === "confirmado" ? "Confirmado" : "No asistirá"}</span></td><td>${r.total}</td><td>${fmt(r.createdAt)}</td>
   <td><button class="btn sm" data-e="${r.id}">Corregir</button><button class="btn sm" data-d="${r.id}">Eliminar</button></td></tr>`).join("");
  $("vacio").hidden = !!vis.length;
  $("vacio").textContent = filas.length ? "Ninguna respuesta coincide con tu búsqueda." : "Aún no hay respuestas. Cuando alguien confirme, aparecerá aquí 💗";
}
["q", "fil", "ord"].forEach((i) => $(i).addEventListener("input", pinta));
$("tb").onclick = (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.e) { const r = filas.find((x) => x.id === b.dataset.e); editId = r.id; $("eN").value = r.name; $("eS").value = r.status; $("eT").value = r.total; $("eErr").textContent = ""; $("dEdit").showModal(); }
  if (b.dataset.d) { const r = filas.find((x) => x.id === b.dataset.d); delId = r.id; $("dDelT").textContent = `¿Eliminar la respuesta de ${r.name}? No se puede deshacer.`; $("dDel").showModal(); }
};
$("eS").onchange = () => { if ($("eS").value === "no_asistira") $("eT").value = 0; else if (+$("eT").value < 1) $("eT").value = 1; };
$("eOk").onclick = async () => {
  const name = $("eN").value.trim().replace(/\s+/g, " "), status = $("eS").value, total = Number($("eT").value);
  if (name.length < 2) return ($("eErr").textContent = "Escribe un nombre válido.");
  if (!Number.isInteger(total) || (status === "confirmado" ? total < 1 : total !== 0)) return ($("eErr").textContent = status === "confirmado" ? "Indica al menos 1 persona." : "Si no asiste, el total debe ser 0.");
  try { await F.updateDoc(F.doc(db, "rsvps", editId), { name, status, total, updatedAt: F.serverTimestamp() }); $("dEdit").close(); }
  catch { $("eErr").textContent = "No se pudo guardar el cambio."; }
};
$("dNo").onclick = () => $("dDel").close();
$("dSi").onclick = async () => { try { await F.deleteDoc(F.doc(db, "rsvps", delId)); } finally { $("dDel").close(); } };
$("csv").onclick = () => {
  const c = (v) => `"${String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
  const rows = [["Nombre", "Estado", "Personas", "Registro", "Última modificación"], ...filas.map((r) => [r.name, r.status === "confirmado" ? "Confirmado" : "No asistirá", r.total, fmt(r.createdAt), fmt(r.updatedAt)])];
  const url = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.map(c).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
  Object.assign(document.createElement("a"), { href: url, download: "confirmaciones.csv" }).click(); URL.revokeObjectURL(url);
};
