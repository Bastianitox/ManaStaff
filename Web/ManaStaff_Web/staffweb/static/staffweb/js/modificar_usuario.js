// =====Utilidades de contraseña=====
function validarRequisitosPassword(password) {
  return {
    length: password.length >= 8 && password.length <= 30,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}
function actualizarRequisitosVisuales(password) {
  const req = validarRequisitosPassword(password);
  const map = {
    "req-length": req.length,
    "req-uppercase": req.uppercase,
    "req-lowercase": req.lowercase,
    "req-number": req.number,
    "req-special": req.special,
  };
  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("met",   !!map[id]);
    el.classList.toggle("unmet", !map[id]);
  });
}
function passwordCumpleTodosRequisitos(password) {
  const r = validarRequisitosPassword(password);
  return r.length && r.uppercase && r.lowercase && r.number && r.special;
}

// ===== Validaciones base =====
function validarRUT(rut) {
  const rutLimpio = rut.replace(/\./g, "").replace("-", "");
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();
  let suma = 0, mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number.parseInt(cuerpo[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const resto = suma % 11;
  const dvOk = resto === 0 ? "0" : resto === 1 ? "k" : (11 - resto).toString();
  return dv === dvOk;
}
function formatearRUT(rut) {
  const lim = rut.replace(/[^0-9kK]/g, "").toLowerCase();
  if (lim.length <= 1) return lim;
  const cuerpo = lim.slice(0, -1);
  const dv = lim.slice(-1);
  let cf = "";
  for (let i = 0; i < cuerpo.length; i++) {
    if (i > 0 && (cuerpo.length - i) % 3 === 0) cf += ".";
    cf += cuerpo[i];
  }
  return cf + "-" + dv;
}
const validarEmail   = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validarCelular = (c) => /^(\+56\s?)?9\s?\d{4}\s?\d{4}$/.test(c);
// Imagen OPCIONAL aquí
function validarImagen(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return true;
  const f = fileInput.files[0];
  const okType = ["image/jpeg","image/png","image/jpg","image/gif"].includes(f.type);
  const okSize = f.size <= 2 * 1024 * 1024;
  return okType && okSize;
}
// PIN exactamente 4 números
function validarPIN(pin) { return /^[0-9]{4}$/.test(pin); }

// ===== Errores UI =====
function mostrarError(id, msg) {
  const field = document.getElementById(id);
  const err   = document.getElementById(id + "-error");
  field.classList.add("error");
  err.textContent = msg;
  err.classList.add("show");
}
function limpiarTodosLosErrores() {
  [
    "nombre","Segundo_nombre","apellido_paterno","apellido_materno","rut",
    "celular","direccion","email","cargo","password","imagen","rol","pin"
  ].forEach((id) => {
    const field = document.getElementById(id);
    const err   = document.getElementById(id + "-error");
    if (field) field.classList.remove("error");
    if (err)   { err.textContent = ""; err.classList.remove("show"); }
  });
}

// ===== Validación del formulario =====
function validarFormulario() {
  limpiarTodosLosErrores();
  let ok = true;

  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) { mostrarError("nombre","El primer nombre es obligatorio"); ok = false; }
  else if (nombre.length < 2) { mostrarError("nombre","Mínimo 2 caracteres"); ok = false; }

  const segundo = document.getElementById("Segundo_nombre").value.trim();
  if (!segundo) { mostrarError("Segundo_nombre","El segundo nombre es obligatorio"); ok = false; }
  else if (segundo.length < 2) { mostrarError("Segundo_nombre","Mínimo 2 caracteres"); ok = false; }

  const apPat = document.getElementById("apellido_paterno").value.trim();
  if (!apPat) { mostrarError("apellido_paterno","El apellido paterno es obligatorio"); ok = false; }
  else if (apPat.length < 2) { mostrarError("apellido_paterno","Mínimo 2 caracteres"); ok = false; }

  const apMat = document.getElementById("apellido_materno").value.trim();
  if (!apMat) { mostrarError("apellido_materno","El apellido materno es obligatorio"); ok = false; }
  else if (apMat.length < 2) { mostrarError("apellido_materno","Mínimo 2 caracteres"); ok = false; }

  const rut = document.getElementById("rut").value.trim();
  if (!rut) { mostrarError("rut","El RUT es obligatorio"); ok = false; }
  else if (!validarRUT(rut)) { mostrarError("rut","El RUT no es válido"); ok = false; }

  const cel = document.getElementById("celular").value.trim();
  if (!cel) { mostrarError("celular","El número de celular es obligatorio"); ok = false; }
  else if (!validarCelular(cel)) { mostrarError("celular","Formato inválido (ej: +56 9 1234 5678)"); ok = false; }

  const dir = document.getElementById("direccion").value.trim();
  if (!dir) { mostrarError("direccion","La dirección es obligatoria"); ok = false; }

  const email = document.getElementById("email").value.trim();
  if (!email) { mostrarError("email","El correo electrónico es obligatorio"); ok = false; }
  else if (!validarEmail(email)) { mostrarError("email","Formato de correo inválido"); ok = false; }

  const cargo = document.getElementById("cargo").value;
  if (!cargo) { mostrarError("cargo","Debe seleccionar un cargo"); ok = false; }

  const rol = document.getElementById("rol").value;
  if (!rol) { mostrarError("rol","Debe seleccionar un rol"); ok = false; }

  const pin = document.getElementById("pin").value.trim();
  if (!pin) { mostrarError("pin","El PIN es obligatorio"); ok = false; }
  else if (!validarPIN(pin)) { mostrarError("pin","El PIN debe ser numérico y de 4 dígitos"); ok = false; }

  // Password OPCIONAL: solo valida si hay algo escrito
  const pass = document.getElementById("password").value;
  if (pass && !passwordCumpleTodosRequisitos(pass)) {
    mostrarError("password","La contraseña no cumple los requisitos de seguridad");
    ok = false;
  }

  // Imagen OPCIONAL
  const imgInput = document.getElementById("imagen");
  if (!validarImagen(imgInput)) {
    mostrarError("imagen","Imagen inválida (JPG/PNG/GIF, máx 2MB)");
    ok = false;
  }

  return ok;
}

// ===== Cargar datos del usuario =====
async function loadUserData() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (!id) {
    alert("RUT de usuario no especificado");
    window.location.href = window.REDIRECT_URL || "/administrar_usuarios";
    return;
  }

  try {
    const resp = await fetch(`/obtener_usuario?id=${id}`);
    const data = await resp.json();
    if (data.status !== "success") throw new Error(data.message || "No se pudo cargar el usuario");

    const u = data.usuario;
    document.getElementById("nombre").value            = u.Nombre || "";
    document.getElementById("Segundo_nombre").value    = u.Segundo_nombre || "";
    document.getElementById("apellido_paterno").value  = u.ApellidoPaterno || "";
    document.getElementById("apellido_materno").value  = u.ApellidoMaterno || "";
    document.getElementById("rut").value               = u.rut_normal || "";
    document.getElementById("celular").value           = u.Telefono || "";
    document.getElementById("direccion").value         = u.Direccion || "";
    document.getElementById("email").value             = u.correo || "";
    document.getElementById("cargo").value             = u.Cargo || "";
    document.getElementById("rol").value               = u.rol || "";
    document.getElementById("pin").value               = u.PIN || "";

    // Imagen existente
    if (u.imagen) {
      const imgPrev = document.getElementById("imagePreview");
      const placeholder = document.querySelector(".image-placeholder");
      imgPrev.src = u.imagen;
      imgPrev.classList.add("show");
      placeholder.classList.add("hide");
    }
  } catch (err) {
    console.error(err);
    alert("Error al cargar los datos del usuario");
    window.location.href = window.REDIRECT_URL || "/administrar_usuarios";
  }
}

// ===== Mensaje de éxito + redirect =====
function mostrarMensajeExito() {
  const m = document.getElementById("successMessage");
  const REDIRECT_URL = window.REDIRECT_URL || "/administrar_usuarios";
  m.classList.add("show");
  setTimeout(() => { window.location.href = REDIRECT_URL; }, 900);
}

// ===== Listeners =====
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();

  // Validador visual: actualiza solo si hay algo escrito
  const passInput = document.getElementById("password");
  actualizarRequisitosVisuales(""); // estado inicial
  passInput.addEventListener("input", (e) => {
    actualizarRequisitosVisuales(e.target.value || "");
    if (!e.target.value) {
      actualizarRequisitosVisuales("");
    }
  });

  // Previsualización de imagen
  const imagenInput = document.getElementById("imagen");
  const imgPrev = document.getElementById("imagePreview");
  const placeholder = document.querySelector(".image-placeholder");
  imagenInput.addEventListener("change", function () {
    if (!this.files || !this.files[0]) return;
    const file = this.files[0];
    if (!validarImagen({ files: [file] })) {
      alert("Imagen inválida (JPG/PNG/GIF, máx 2MB)");
      this.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imgPrev.src = e.target.result;
      imgPrev.classList.add("show");
      placeholder.classList.add("hide");
    };
    reader.readAsDataURL(file);
  });

  // Formato RUT y celular
  document.getElementById("rut").addEventListener("input", function () {
    this.value = formatearRUT(this.value);
  });
  document.getElementById("celular").addEventListener("input", function () {
    let v = this.value.replace(/[^\d]/g, "");
    if (v.startsWith("56")) v = v.substring(2);
    if (v.length >= 1) v = "+56 " + v.substring(0,1) + " " + v.substring(1,5) + " " + v.substring(5,9);
    this.value = v.trim();
  });

  // PIN: bloquear letras/pegado y limitar a 4
  const pinInput = document.getElementById("pin");
  pinInput.setAttribute("inputmode", "numeric");
  pinInput.setAttribute("pattern", "\\d{4}");
  pinInput.addEventListener("keydown", (e) => {
    const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Home","End"];
    if (allowed.includes(e.key)) return;
    if ((e.ctrlKey||e.metaKey) && ["a","c","v","x","A","C","V","X"].includes(e.key)) return;
    if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
    const selStart = e.target.selectionStart ?? 0;
    const selEnd   = e.target.selectionEnd ?? 0;
    const willReplace = selEnd > selStart;
    if (!willReplace && e.target.value.replace(/\D/g,"").length >= 4) e.preventDefault();
  });
  pinInput.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g,"").slice(0,4);
    if (e.target.value !== digits) e.target.value = digits;
  });
  pinInput.addEventListener("paste", (e) => {
    e.preventDefault();
    const clip = (e.clipboardData || window.clipboardData).getData("text") || "";
    const digits = clip.replace(/\D/g,"");
    const input = e.target;
    const before = input.value.slice(0, input.selectionStart);
    const after  = input.value.slice(input.selectionEnd);
    const next = (before + digits + after).replace(/\D/g,"").slice(0,4);
    input.value = next;
    const caret = Math.min((before + digits).length, 4);
    input.setSelectionRange(caret, caret);
  });

  // Límites de longitud de campos
  const max = { nombre:25, Segundo_nombre:25, apellido_paterno:50, apellido_materno:50, email:100, direccion:150, rut:12 };
  Object.keys(max).forEach((id) => {
    const f = document.getElementById(id);
    if (!f) return;
    f.addEventListener("input", function () {
      if (this.value.length > max[id]) this.value = this.value.slice(0, max[id]);
    });
  });

  // Submit
  const form = document.getElementById("editUserForm");
  const overlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    overlay.classList.add("show");
    submitBtn.disabled = true;
    await new Promise(requestAnimationFrame);

    const rut = document.getElementById("rut").value.replace(/\./g,"").replace("-","");
    const url = `/modificar_usuario_funcion/${rut}`;
    const formData = new FormData(form); 

    try {
      const resp = await fetch(url, {
        method: "POST",
        body: formData,
        headers: { "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value }
      });
      const result = await resp.json();
      if (result.status === "success") {
        mostrarMensajeExito();
      } else {
        alert(result.message || "Error al modificar usuario");
      }
    } catch (err) {
      console.error(err);
      alert("Error al enviar el formulario");
    } finally {
      overlay.classList.remove("show");
      submitBtn.disabled = false;
    }
  });

  // Cancelar
  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = window.REDIRECT_URL || "/administrar_usuarios";
  });
});