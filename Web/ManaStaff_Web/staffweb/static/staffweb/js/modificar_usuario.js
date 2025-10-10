// Variables globales
let currentUserId = null
let currentUser = null

// Función para obtener parámetros de la URL
function getUrlParameter(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  const results = regex.exec(location.search)
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

// Función para validar RUT chileno
function validarRUT(rut) {
  const rutLimpio = rut.replace(/\./g, "").replace("-", "")
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1).toLowerCase()

  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number.parseInt(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = suma % 11
  const dvCalculado = resto === 0 ? "0" : resto === 1 ? "k" : (11 - resto).toString()
  return dv === dvCalculado
}

// Formatear RUT
function formatearRUT(rut) {
  const rutLimpio = rut.replace(/[^0-9kK]/g, "").toLowerCase()
  if (rutLimpio.length <= 1) return rutLimpio

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  let cuerpoFormateado = ""
  for (let i = 0; i < cuerpo.length; i++) {
    if (i > 0 && (cuerpo.length - i) % 3 === 0) {
      cuerpoFormateado += "."
    }
    cuerpoFormateado += cuerpo[i]
  }

  return cuerpoFormateado + "-" + dv
}

// Validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Validar celular chileno
function validarCelular(celular) {
  const regex = /^(\+56\s?)?9\s?\d{4}\s?\d{4}$/
  return regex.test(celular)
}

// Validar PIN (solo números, 4 dígitos)
function validarPIN(pin) {
  const regex = /^[0-9]{4,4}$/
  return regex.test(pin)
}

// Validar imagen (opcional)
function validarImagen(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return true // opcional
  const file = fileInput.files[0]
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"]
  const maxSize = 2 * 1024 * 1024
  return validTypes.includes(file.type) && file.size <= maxSize
}

// Limpiar errores
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
    "pin"
  ]
  campos.forEach(campo => {
    document.getElementById(campo).classList.remove("error")
    document.getElementById(campo + "-error").textContent = ""
    document.getElementById(campo + "-error").classList.remove("show")
  })
}

// Mostrar error
function mostrarError(fieldId, mensaje) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")
  field.classList.add("error")
  errorElement.textContent = mensaje
  errorElement.classList.add("show")
}

// Validar formulario
function validarFormulario() {
  limpiarTodosLosErrores()
  let esValido = true

  // Validar nombre
  const nombre = document.getElementById("nombre").value.trim()
  if (!nombre) {
    mostrarError("nombre", "El primer nombre es obligatorio")
    esValido = false
  } else if (nombre.length < 2) {
    mostrarError("nombre", "El nombre debe tener al menos 2 caracteres")
    esValido = false
  }

  // Segundo nombre
  const segundoNombre = document.getElementById("Segundo_nombre").value.trim()
  if (!segundoNombre) {
    mostrarError("Segundo_nombre", "El segundo nombre es obligatorio")
    esValido = false
  } else if (segundoNombre.length < 2) {
    mostrarError("Segundo_nombre", "El segundo nombre debe tener al menos 2 caracteres")
    esValido = false
  }

  // Apellido paterno
  const apellidoPaterno = document.getElementById("apellido_paterno").value.trim()
  if (!apellidoPaterno) {
    mostrarError("apellido_paterno", "El apellido paterno es obligatorio")
    esValido = false
  } else if (apellidoPaterno.length < 2) {
    mostrarError("apellido_paterno", "El apellido paterno debe tener al menos 2 caracteres")
    esValido = false
  }

  // Apellido materno
  const apellidoMaterno = document.getElementById("apellido_materno").value.trim()
  if (!apellidoMaterno) {
    mostrarError("apellido_materno", "El apellido materno es obligatorio")
    esValido = false
  } else if (apellidoMaterno.length < 2) {
    mostrarError("apellido_materno", "El apellido materno debe tener al menos 2 caracteres")
    esValido = false
  }

  // RUT
  const rut = document.getElementById("rut").value.trim()
  if (!rut) {
    mostrarError("rut", "El RUT es obligatorio")
    esValido = false
  } else if (!validarRUT(rut)) {
    mostrarError("rut", "El RUT ingresado no es válido")
    esValido = false
  }

  // Celular
  const celular = document.getElementById("celular").value.trim()
  if (!celular) {
    mostrarError("celular", "El número de celular es obligatorio")
    esValido = false
  } else if (!validarCelular(celular)) {
    mostrarError("celular", "Formato inválido (ej: +56 9 1234 5678)")
    esValido = false
  }

  // Dirección
  const direccion = document.getElementById("direccion").value.trim()
  if (!direccion) {
    mostrarError("direccion", "La dirección es obligatoria")
    esValido = false
  }

  // Email
  const email = document.getElementById("email").value.trim()
  if (!email) {
    mostrarError("email", "El correo electrónico es obligatorio")
    esValido = false
  } else if (!validarEmail(email)) {
    mostrarError("email", "El formato del correo electrónico no es válido")
    esValido = false
  }

  // Cargo
  const cargo = document.getElementById("cargo").value
  if (!cargo) {
    mostrarError("cargo", "Debe seleccionar un cargo")
    esValido = false
  }

  // Rol
  const rol = document.getElementById("rol").value
  if (!rol) {
    mostrarError("rol", "Debe seleccionar un rol")
    esValido = false
  }

  // PIN
  const pin = document.getElementById("pin").value.trim()
  if (!pin) {
    mostrarError("pin", "El PIN es obligatorio")
    esValido = false
  } else if (!validarPIN(pin)) {
    mostrarError("pin", "El PIN debe ser numérico y tener 4 dígitos")
    esValido = false
  }

  // Contraseña (opcional)
  const password = document.getElementById("password").value
  if (password && password.length < 6) {
    mostrarError("password", "La contraseña debe tener al menos 6 caracteres")
    esValido = false
  }

  // Imagen (opcional)
  const imagenInput = document.getElementById("imagen")
  if (!validarImagen(imagenInput)) {
    mostrarError("imagen", "Debe subir una imagen válida (JPG, PNG, GIF, máx 2MB)")
    esValido = false
  }

  return esValido
}

// Mostrar mensaje de éxito
function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage")
  mensaje.classList.add("show")
  setTimeout(() => {
    setTimeout(() => {
      window.location.href = "/administrar_usuarios"
    }, 150)
  }, 300)
}

// Función para cargar datos del usuario
async function loadUserData() {
  const urlParams = new URLSearchParams(window.location.search)
  const userId = urlParams.get("id")
  if (!userId) {
    alert("RUT de usuario no especificado")
    window.location.href = "/administrar_usuarios"
    return
  }

  try {
    const response = await fetch(`/obtener_usuario?id=${userId}`)
    const data = await response.json()
    if (data.status !== "success") {
      alert(data.message)
      window.location.href = "/administrar_usuarios"
      return
    }

    const user = data.usuario


    document.getElementById("nombre").value = user.Nombre || ""
    document.getElementById("Segundo_nombre").value = user.Segundo_nombre || ""
    document.getElementById("apellido_paterno").value = user.ApellidoPaterno || ""
    document.getElementById("apellido_materno").value = user.ApellidoMaterno || ""
    document.getElementById("rut").value = user.rut_normal || ""
    document.getElementById("celular").value = user.Telefono || ""
    document.getElementById("direccion").value = user.Direccion || ""
    document.getElementById("email").value = user.correo || ""
    document.getElementById("cargo").value = user.Cargo || ""
    document.getElementById("rol").value = user.rol || ""
    document.getElementById("pin").value = user.PIN || ""
    
    // Imagen actual si existe
    if (user.imagen) {
      const imgPreview = document.getElementById("imagenPreview")
      if (imgPreview) {
        imgPreview.src = user.imagen
        imgPreview.classList.remove("hidden")
      }
    }

  } catch (error) {
    console.error(error)
    alert("Error al cargar los datos del usuario")
    window.location.href = "/administrar_usuarios"
  }
}



// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos del usuario
  loadUserData()

  const camposMaximos = {
    nombre: 25,
    Segundo_nombre: 25,
    apellido_paterno: 50,
    apellido_materno: 50,
    email: 100,
    direccion: 150,
    rut: 12
  };

  Object.keys(camposMaximos).forEach(fieldId => {
      const field = document.getElementById(fieldId);
      field.addEventListener("input", function () {
          if (this.value.length > camposMaximos[fieldId]) {
              this.value = this.value.slice(0, camposMaximos[fieldId]);
          }
      });
  });

  // Cambiar imagen al cambiar el archivo
  const imagenForm = document.getElementById("imagen");
  const imagenPreview = document.getElementById("imagenPreview");

  imagenForm.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
      // No hay archivo seleccionado
      imagenPreview.src = "";
      imagenPreview.classList.add("hidden");
      return;
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      alert("El archivo debe ser una imagen (JPG, PNG, GIF)");
      this.value = ""; // limpiar input
      imagenPreview.src = "";
      imagenPreview.classList.add("hidden");
      return;
    }

    if (file.size > maxSize) {
      alert("La imagen no debe superar los 2MB");
      this.value = ""; // limpiar input
      imagenPreview.src = "";
      imagenPreview.classList.add("hidden");
      return;
    }

    // Si pasa la validación, mostrar preview
    const reader = new FileReader();
    reader.onload = function (e) {
      imagenPreview.src = e.target.result;
      imagenPreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  // Formatear RUT
  document.getElementById("rut").addEventListener("input", function () {
    this.value = formatearRUT(this.value)
  })

  // Formatear celular
  document.getElementById("celular").addEventListener("input", function () {
    let valor = this.value.replace(/[^\d]/g, "")
    if (valor.length > 0) {
      if (valor.startsWith("56")) valor = valor.substring(2)
      if (valor.length >= 1) {
        valor = "+56 " + valor.substring(0, 1) + " " + valor.substring(1, 5) + " " + valor.substring(5, 9)
      }
    }
    this.value = valor.trim()
  })

  //FORMULARIO
  const form = document.getElementById("editUserForm");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    // Mostrar overlay y deshabilitar botón
    loadingOverlay.classList.remove("hidden");
    submitBtn.disabled = true;

    // Forzar redraw para asegurar que la animación se muestre
    await new Promise(requestAnimationFrame);

    const rut = document.getElementById("rut").value.replace(/\./g, "").replace("-", "");
    const url = `/modificar_usuario_funcion/${rut}`;
    const formData = new FormData(form);

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        },
      });

      const result = await response.json();

      // Ocultar overlay y habilitar botón
      loadingOverlay.classList.add("hidden");
      submitBtn.disabled = false;

      if (result.status === "success") {
        mostrarMensajeExito();
      } else {
        alert(result.message || "Error al modificar usuario");
      }
    } catch (error) {
      loadingOverlay.classList.add("hidden");
      submitBtn.disabled = false;
      console.error(error);
      alert("Error al enviar el formulario");
    }
  });


  // Botón cancelar
  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = "/administrar_usuarios"
  })
})