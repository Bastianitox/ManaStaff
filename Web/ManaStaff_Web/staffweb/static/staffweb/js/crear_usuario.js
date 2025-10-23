// Función para validar RUT chileno
function validarRUT(rut) {
  const rutLimpio = rut.replace(/\./g, "").replace("-", "");
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number.parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const dvCalculado = resto === 0 ? "0" : resto === 1 ? "k" : (11 - resto).toString();
  return dv === dvCalculado;
}

// Formatear RUT
function formatearRUT(rut) {
  const rutLimpio = rut.replace(/[^0-9kK]/g, "").toLowerCase();
  if (rutLimpio.length <= 1) return rutLimpio;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  let cuerpoFormateado = "";
  for (let i = 0; i < cuerpo.length; i++) {
    if (i > 0 && (cuerpo.length - i) % 3 === 0) {
      cuerpoFormateado += ".";
    }
    cuerpoFormateado += cuerpo[i];
  }

  return cuerpoFormateado + "-" + dv;
}

// Validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validar celular chileno
function validarCelular(celular) {
  const regex = /^(\+56\s?)?9\s?\d{4}\s?\d{4}$/;
  return regex.test(celular);
}

// Mostrar error
function mostrarError(fieldId, mensaje) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "-error");
  field.classList.add("error");
  errorElement.textContent = mensaje;
  errorElement.classList.add("show");
}

// Limpiar error
function limpiarError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "-error");
  field.classList.remove("error");
  errorElement.textContent = "";
  errorElement.classList.remove("show");
}

// Validar imagen
function validarImagen(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return false;
  const file = fileInput.files[0];
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  const maxSize = 2 * 1024 * 1024; // 2MB
  return validTypes.includes(file.type) && file.size <= maxSize;
}

// Validar PIN
function validarPIN(pin) {
  const regex = /^[0-9]{4}$/;
  return regex.test(pin);
}

// Limpiar todos los errores
function limpiarTodosLosErrores() {
  const campos = [
    "nombre",
    "Segundo_nombre",
    "apellido_paterno",
    "apellido_materno",
    "rut",
    "celular",
    "direccion",
    "email",
    "cargo",
    "password",
    "imagen",
    "rol",
    "pin",
  ];
  campos.forEach((campo) => limpiarError(campo));
}

// --- Reglas de contraseña ---
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
  const requisitos = validarRequisitosPassword(password);
  const elementos = {
    "req-length": requisitos.length,
    "req-uppercase": requisitos.uppercase,
    "req-lowercase": requisitos.lowercase,
    "req-number": requisitos.number,
    "req-special": requisitos.special,
  };

  Object.keys(elementos).forEach((id) => {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    if (elementos[id]) {
      elemento.classList.add("met");
      elemento.classList.remove("unmet");
    } else {
      elemento.classList.add("unmet");
      elemento.classList.remove("met");
    }
  });
}

function passwordCumpleTodosRequisitos(password) {
  const requisitos = validarRequisitosPassword(password);
  return (
    requisitos.length &&
    requisitos.uppercase &&
    requisitos.lowercase &&
    requisitos.number &&
    requisitos.special
  );
}

// Validar formulario
function validarFormulario() {
  let esValido = true;
  limpiarTodosLosErrores();

  // Validaciones de campos de texto
  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) {
    mostrarError("nombre", "El primer nombre es obligatorio");
    esValido = false;
  } else if (nombre.length < 2) {
    mostrarError("nombre", "El nombre debe tener al menos 2 caracteres");
    esValido = false;
  }

  const segundoNombre = document.getElementById("Segundo_nombre").value.trim();
  if (!segundoNombre) {
    mostrarError("Segundo_nombre", "El segundo nombre es obligatorio");
    esValido = false;
  } else if (segundoNombre.length < 2) {
    mostrarError("Segundo_nombre", "El segundo nombre debe tener al menos 2 caracteres");
    esValido = false;
  }

  const apellidoPaterno = document.getElementById("apellido_paterno").value.trim();
  if (!apellidoPaterno) {
    mostrarError("apellido_paterno", "El apellido paterno es obligatorio");
    esValido = false;
  } else if (apellidoPaterno.length < 2) {
    mostrarError("apellido_paterno", "El apellido paterno debe tener al menos 2 caracteres");
    esValido = false;
  }

  const apellidoMaterno = document.getElementById("apellido_materno").value.trim();
  if (!apellidoMaterno) {
    mostrarError("apellido_materno", "El apellido materno es obligatorio");
    esValido = false;
  } else if (apellidoMaterno.length < 2) {
    mostrarError("apellido_materno", "El apellido materno debe tener al menos 2 caracteres");
    esValido = false;
  }

  const rut = document.getElementById("rut").value.trim();
  if (!rut) {
    mostrarError("rut", "El RUT es obligatorio");
    esValido = false;
  } else if (!validarRUT(rut)) {
    mostrarError("rut", "El RUT ingresado no es válido");
    esValido = false;
  }

  const celular = document.getElementById("celular").value.trim();
  if (!celular) {
    mostrarError("celular", "El número de celular es obligatorio");
    esValido = false;
  } else if (!validarCelular(celular)) {
    mostrarError("celular", "Formato inválido (ej: +56 9 1234 5678)");
    esValido = false;
  }

  const direccion = document.getElementById("direccion").value.trim();
  if (!direccion) {
    mostrarError("direccion", "La dirección es obligatoria");
    esValido = false;
  }

  const email = document.getElementById("email").value.trim();
  if (!email) {
    mostrarError("email", "El correo electrónico es obligatorio");
    esValido = false;
  } else if (!validarEmail(email)) {
    mostrarError("email", "El formato del correo electrónico no es válido");
    esValido = false;
  }

  const cargo = document.getElementById("cargo").value;
  if (!cargo) {
    mostrarError("cargo", "Debe seleccionar un cargo");
    esValido = false;
  }

  const imagenInput = document.getElementById("imagen");
  if (!validarImagen(imagenInput)) {
    mostrarError("imagen", "Debe subir una imagen válida (JPG, PNG, GIF, máx 2MB)");
    esValido = false;
  }

  const rol = document.getElementById("rol").value;
  if (!rol) {
    mostrarError("rol", "Debe seleccionar un rol");
    esValido = false;
  }

  // Validar PIN
  const pin = document.getElementById("pin").value.trim();
  if (!pin) {
    mostrarError("pin", "El PIN es obligatorio");
    esValido = false;
  } else if (!validarPIN(pin)) {
    mostrarError("pin", "El PIN debe ser numérico y tener 4 dígitos");
    esValido = false;
  }

  // Validar contraseña
  const password = document.getElementById("password").value.trim();
  if (!password) {
    mostrarError("password", "La contraseña es obligatoria");
    esValido = false;
  } else if (!passwordCumpleTodosRequisitos(password)) {
    mostrarError("password", "La contraseña no cumple con los requisitos de seguridad");
    esValido = false;
  }

  return esValido;
}

// Mensaje de éxito
function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage");
  mensaje.classList.add("show");
  setTimeout(() => {
    mensaje.classList.remove("show");
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 300);
  }, 1000);
}

// --- EVENTOS ---
document.addEventListener("DOMContentLoaded", () => {
  //Validación dinámica de contraseña
  const passwordInput = document.getElementById("password");
  passwordInput.addEventListener("input", (e) => {
    const password = e.target.value;
    actualizarRequisitosVisuales(password);
    if (password && passwordCumpleTodosRequisitos(password)) {
      limpiarError("password");
    }
  });
  actualizarRequisitosVisuales("");

  // Formatear RUT
  document.getElementById("rut").addEventListener("input", function () {
    this.value = formatearRUT(this.value);
  });

  // Formatear celular
  document.getElementById("celular").addEventListener("input", function () {
    let valor = this.value.replace(/[^\d]/g, "");
    if (valor.length > 0) {
      if (valor.startsWith("56")) valor = valor.substring(2);
      if (valor.length >= 1) {
        valor = "+56 " + valor.substring(0, 1) + " " + valor.substring(1, 5) + " " + valor.substring(5, 9);
      }
    }
    this.value = valor.trim();
  });

  // PIN: solo números y máximo 4 dígitos
  const pinInput = document.getElementById("pin");
  pinInput.setAttribute("inputmode", "numeric");
  pinInput.setAttribute("pattern", "\\d{4}");

  pinInput.addEventListener("keydown", (e) => {
    const allowed = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Tab", "Home", "End"
    ];
    if (allowed.includes(e.key)) return;

    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x", "A", "C", "V", "X"].includes(e.key)) return;

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    const selStart = e.target.selectionStart ?? 0;
    const selEnd = e.target.selectionEnd ?? 0;
    const willReplace = selEnd > selStart;
    if (!willReplace && e.target.value.replace(/\D/g, "").length >= 4) {
      e.preventDefault();
    }
  });

  pinInput.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (e.target.value !== digits) e.target.value = digits;
  });

  pinInput.addEventListener("paste", (e) => {
    e.preventDefault();
    const clip = (e.clipboardData || window.clipboardData).getData("text") || "";
    const digits = clip.replace(/\D/g, "");
    const input = e.target;
    const before = input.value.slice(0, input.selectionStart);
    const after = input.value.slice(input.selectionEnd);
    const next = (before + digits + after).replace(/\D/g, "").slice(0, 4);
    input.value = next;
    const caret = Math.min((before + digits).length, 4);
    input.setSelectionRange(caret, caret);
  });

  // Limitar longitud de campos
  const camposMaximos = {
    nombre: 25,
    Segundo_nombre: 25,
    apellido_paterno: 50,
    apellido_materno: 50,
    email: 100,
    direccion: 150,
    rut: 12,
  };

  Object.keys(camposMaximos).forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    field.addEventListener("input", function () {
      if (this.value.length > camposMaximos[fieldId]) {
        this.value = this.value.slice(0, camposMaximos[fieldId]);
      }
    });
  });

  const form = document.getElementById("createUserForm");
  const loadingOverlay = document.getElementById("loadingOverlay");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    loadingOverlay.classList.add("show");

    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      segundo_nombre: document.getElementById("Segundo_nombre").value.trim(),
      apellido_paterno: document.getElementById("apellido_paterno").value.trim(),
      apellido_materno: document.getElementById("apellido_materno").value.trim(),
      rut: document.getElementById("rut").value.trim(),
      celular: document.getElementById("celular").value.trim(),
      direccion: document.getElementById("direccion").value.trim(),
      email: document.getElementById("email").value.trim(),
      cargo: document.getElementById("cargo").value,
      password: document.getElementById("password").value,
      rol: document.getElementById("rol").value,
      pin: document.getElementById("pin").value.replace(/\D/g, "").slice(0, 4),
    };

    async function enviar() {
      try {
        const response = await fetch("/crear_usuario_funcion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        loadingOverlay.classList.remove("show");

        if (result.status === "success") {
          mostrarMensajeExito();
        } else {
          alert(result.message || "Error al crear usuario");
        }
      } catch (error) {
        console.error(error);
        loadingOverlay.classList.remove("show");
        alert("Error al enviar los datos");
      }
    }

    const imagenInput = document.getElementById("imagen");
    if (imagenInput.files.length > 0) {
      const file = imagenInput.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        data.imagen = reader.result;
        await enviar();
      };
      reader.readAsDataURL(file);
    } else {
      await enviar();
    }
  });

  // Botón cancelar
  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = redirectUrl;
  });
});