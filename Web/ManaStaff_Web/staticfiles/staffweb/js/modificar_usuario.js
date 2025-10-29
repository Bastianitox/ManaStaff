// ===== Helpers comunes =====
function validarRequisitosPassword(p) {
  return {
    length: p.length >= 8 && p.length <= 30,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  };
}
function passwordCumpleTodosRequisitos(p) {
  const r = validarRequisitosPassword(p);
  return r.length && r.uppercase && r.lowercase && r.number && r.special;
}
function actualizarRequisitosVisuales(p) {
  const req = validarRequisitosPassword(p);
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
    el.classList.toggle("met", !!map[id]);
    el.classList.toggle("unmet", !map[id]);
  });
}

// ===== Validaciones básicas =====
function validarRUT(r) {
  const clean = r.replace(/\./g, "").replace("-", "");
  if (clean.length < 8 || clean.length > 9) return false;
  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1).toLowerCase();
  let suma = 0, mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number.parseInt(cuerpo[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const resto = suma % 11;
  const dvOk = resto === 0 ? "0" : resto === 1 ? "k" : (11 - resto).toString();
  return dv === dvOk;
}
function formatearRUT(r) {
  const lim = r.replace(/[^0-9kK]/g, "").toLowerCase();
  if (lim.length <= 1) return lim;
  const c = lim.slice(0, -1);
  const d = lim.slice(-1);
  let cf = "";
  for (let i = 0; i < c.length; i++) {
    if (i > 0 && (c.length - i) % 3 === 0) cf += ".";
    cf += c[i];
  }
  return cf + "-" + d;
}
const validarEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validarCelular = (c) => /^(\+56\s?)?9\s?\d{4}\s?\d{4}$/.test(c);
function validarImagen(f) {
  if (!f.files || f.files.length === 0) return true;
  const file = f.files[0];
  const valid = ["image/jpeg","image/png","image/jpg","image/gif"].includes(file.type);
  return valid && file.size <= 2 * 1024 * 1024;
}
function validarPIN(pin) { return /^[0-9]{4}$/.test(pin); }

// ===== Alertas flotantes =====
function showAlert(type, message) {
  const successEl = document.getElementById("successAlert");
  const errorEl = document.getElementById("errorAlert");
  [successEl, errorEl].forEach((el) => {
    if (!el) return;
    el.classList.add("hide");
    el.style.display = "none";
  });

  const alertEl = type === "success" ? successEl : errorEl;
  const messageEl =
    type === "success"
      ? document.getElementById("successMessageAlert")
      : document.getElementById("errorMessageAlert");

  messageEl.textContent = message;
  alertEl.style.display = "flex";
  alertEl.classList.remove("hide");

  setTimeout(() => {
    alertEl.classList.add("hide");
    setTimeout(() => (alertEl.style.display = "none"), 400);
  }, 5000);
}

// ===== Validaciones de formulario =====
function mostrarError(id, msg) {
  const field = document.getElementById(id);
  const err = document.getElementById(id + "-error");
  if (field) field.classList.add("error");
  if (err) {
    err.textContent = msg;
    err.classList.add("show");
  }
}
function limpiarTodosLosErrores() {
  [
    "nombre","Segundo_nombre","apellido_paterno","apellido_materno","rut","celular",
    "direccion","email","cargo","password","imagen","rol","pin"
  ].forEach((id) => {
    const f = document.getElementById(id);
    const e = document.getElementById(id + "-error");
    if (f) f.classList.remove("error");
    if (e) { e.textContent = ""; e.classList.remove("show"); }
  });
}
function validarFormulario() {
  limpiarTodosLosErrores();
  let ok = true;
  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) { mostrarError("nombre","El primer nombre es obligatorio"); ok = false; }
  const segundo = document.getElementById("Segundo_nombre").value.trim();
  if (!segundo) { mostrarError("Segundo_nombre","El segundo nombre es obligatorio"); ok = false; }
  const apPat = document.getElementById("apellido_paterno").value.trim();
  if (!apPat) { mostrarError("apellido_paterno","El apellido paterno es obligatorio"); ok = false; }
  const apMat = document.getElementById("apellido_materno").value.trim();
  if (!apMat) { mostrarError("apellido_materno","El apellido materno es obligatorio"); ok = false; }
  const rut = document.getElementById("rut").value.trim();
  if (!rut || !validarRUT(rut)) { mostrarError("rut","El RUT no es válido"); ok = false; }
  const cel = document.getElementById("celular").value.trim();
  if (!cel || !validarCelular(cel)) { mostrarError("celular","Formato de celular inválido"); ok = false; }
  const dir = document.getElementById("direccion").value.trim();
  if (!dir) { mostrarError("direccion","La dirección es obligatoria"); ok = false; }
  const email = document.getElementById("email").value.trim();
  if (!email || !validarEmail(email)) { mostrarError("email","Correo inválido"); ok = false; }
  const cargo = document.getElementById("cargo").value;
  if (!cargo) { mostrarError("cargo","Debe seleccionar un cargo"); ok = false; }
  const rol = document.getElementById("rol").value;
  if (!rol) { mostrarError("rol","Debe seleccionar un rol"); ok = false; }
  const pin = document.getElementById("pin").value.trim();
  if (!validarPIN(pin)) { mostrarError("pin","El PIN debe tener 4 dígitos numéricos"); ok = false; }
  const pass = document.getElementById("password").value;
  if (pass && !passwordCumpleTodosRequisitos(pass)) {
    mostrarError("password","La nueva contraseña no cumple los requisitos"); ok = false;
  }
  const imgInput = document.getElementById("imagen");
  if (!validarImagen(imgInput)) {
    mostrarError("imagen","Imagen inválida (JPG, PNG, GIF máx 2MB)");
    ok = false;
  }
  return ok;
}

// ===== Cargar datos =====
async function loadUserData() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    showAlert("error","No se especificó el usuario a modificar");
    setTimeout(()=>window.location.href=window.REDIRECT_URL||"/administrar_usuarios",2000);
    return;
  }
  try {
    const resp = await fetch(`/obtener_usuario?id=${id}`);
    const data = await resp.json();
    if (data.status !== "success") throw new Error(data.message);
    const u = data.usuario;
    document.getElementById("nombre").value = u.Nombre || "";
    document.getElementById("Segundo_nombre").value = u.Segundo_nombre || "";
    document.getElementById("apellido_paterno").value = u.ApellidoPaterno || "";
    document.getElementById("apellido_materno").value = u.ApellidoMaterno || "";
    document.getElementById("rut").value = u.rut_normal || "";
    document.getElementById("celular").value = u.Telefono || "";
    document.getElementById("direccion").value = u.Direccion || "";
    document.getElementById("email").value = u.correo || "";
    document.getElementById("cargo").value = u.Cargo || "";
    document.getElementById("rol").value = u.rol || "";
    document.getElementById("pin").value = u.PIN || "";
    if (u.imagen) {
      const img = document.getElementById("imagePreview");
      const ph = document.querySelector(".image-placeholder");
      img.src = u.imagen;
      img.classList.add("show");
      ph.classList.add("hide");
    }
  } catch (err) {
    console.error(err);
    showAlert("error","Error al cargar los datos del usuario");
  }
}

// ===== Éxito =====
function mostrarMensajeExito() {
  const REDIRECT_URL = window.REDIRECT_URL || "/administrar_usuarios";
  showAlert("success","Usuario modificado con éxito");
  setTimeout(() => (window.location.href = REDIRECT_URL), 2000);
}

// ===== Listeners =====
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  const passInput = document.getElementById("password");
  actualizarRequisitosVisuales("");
  passInput.addEventListener("input", (e) =>
    actualizarRequisitosVisuales(e.target.value || "")
  );

  const imgInput = document.getElementById("imagen");
  const imgPrev = document.getElementById("imagePreview");
  const placeholder = document.querySelector(".image-placeholder");
  imgInput.addEventListener("change", function () {
    if (!this.files || !this.files[0]) return;
    if (!validarImagen(this)) {
      showAlert("error","Imagen inválida (JPG, PNG, GIF máx 2MB)");
      this.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imgPrev.src = e.target.result;
      imgPrev.classList.add("show");
      placeholder.classList.add("hide");
    };
    reader.readAsDataURL(this.files[0]);
  });

  // rut y cel format
  document.getElementById("rut").addEventListener("input", function () {
    this.value = formatearRUT(this.value);
  });
  document.getElementById("celular").addEventListener("input", function () {
    let v = this.value.replace(/[^\d]/g, "");
    if (v.startsWith("56")) v = v.substring(2);
    if (v.length >= 1)
      v = "+56 " + v.substring(0, 1) + " " + v.substring(1, 5) + " " + v.substring(5, 9);
    this.value = v.trim();
  });

  // pin solo números
  const pinInput = document.getElementById("pin");
  pinInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });

  // enviar
  const form = document.getElementById("editUserForm");
  const overlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    overlay.classList.add("show");
    submitBtn.disabled = true;
    const rut = document.getElementById("rut").value.replace(/\./g, "").replace("-", "");
    const url = `/modificar_usuario_funcion/${rut}`;
    const formData = new FormData(form);
    const imagenFile = document.getElementById("imagen").files[0];
    if (imagenFile) formData.set("imagen", imagenFile);
    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        headers: { "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value },
      });
      const result = await res.json();
      if (result.status === "success") mostrarMensajeExito();
      else showAlert("error", result.message || "Error al modificar usuario");
    } catch (err) {
      console.error(err);
      showAlert("error","Error al enviar los datos");
    } finally {
      overlay.classList.remove("show");
      submitBtn.disabled = false;
    }
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = window.REDIRECT_URL || "/administrar_usuarios";
  });
});