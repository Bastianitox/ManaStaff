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

// Mostrar error
function mostrarError(fieldId, mensaje) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")
  field.classList.add("error")
  errorElement.textContent = mensaje
  errorElement.classList.add("show")
}

// Limpiar error
function limpiarError(fieldId) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")
  field.classList.remove("error")
  errorElement.textContent = ""
  errorElement.classList.remove("show")
}

// Validar imagen
function validarImagen(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return false
  const file = fileInput.files[0]
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"]
  const maxSize = 2 * 1024 * 1024 // 2MB
  return validTypes.includes(file.type) && file.size <= maxSize
}

// Validar PIN (solo números, 4 a 6 dígitos)
function validarPIN(pin) {
  const regex = /^[0-9]{4,4}$/
  return regex.test(pin)
}


// Limpiar todos los errores
function limpiarTodosLosErrores() {
  const campos = [
    "nombre",
    "Segundo_nombre",
    "apellido_paterno",
    "apellidos_materno",
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
  campos.forEach((campo) => limpiarError(campo))
}

// Validar formulario
function validarFormulario() {
  let esValido = true
  limpiarTodosLosErrores()

  // Validar nombre
  const nombre = document.getElementById("nombre").value.trim()
  if (!nombre) {
    mostrarError("nombre", "El primer nombre es obligatorio")
    esValido = false
  } else if (nombre.length < 2) {
    mostrarError("nombre", "El nombre debe tener al menos 2 caracteres")
    esValido = false
  }

  // Validar segundo nombre
  const segundoNombre = document.getElementById("Segundo_nombre").value.trim()
  if (!segundoNombre) {
    mostrarError("Segundo_nombre", "El segundo nombre es obligatorio")
    esValido = false
  } else if (segundoNombre.length < 2) {
    mostrarError("Segundo_nombre", "El segundo nombre debe tener al menos 2 caracteres")
    esValido = false
  }

  // Validar apellido paterno
  const apellidoPaterno = document.getElementById("apellido_paterno").value.trim()
  if (!apellidoPaterno) {
    mostrarError("apellido_paterno", "El apellido paterno es obligatorio")
    esValido = false
  } else if (apellidoPaterno.length < 2) {
    mostrarError("apellido_paterno", "El apellido paterno debe tener al menos 2 caracteres")
    esValido = false
  }

  // Validar apellido materno
  const apellidoMaterno = document.getElementById("apellidos_materno").value.trim()
  if (!apellidoMaterno) {
    mostrarError("apellidos_materno", "El apellido materno es obligatorio")
    esValido = false
  } else if (apellidoMaterno.length < 2) {
    mostrarError("apellidos_materno", "El apellido materno debe tener al menos 2 caracteres")
    esValido = false
  }

  // Validar RUT
  const rut = document.getElementById("rut").value.trim()
  if (!rut) {
    mostrarError("rut", "El RUT es obligatorio")
    esValido = false
  } else if (!validarRUT(rut)) {
    mostrarError("rut", "El RUT ingresado no es válido")
    esValido = false
  }

  // Validar celular
  const celular = document.getElementById("celular").value.trim()
  if (!celular) {
    mostrarError("celular", "El número de celular es obligatorio")
    esValido = false
  } else if (!validarCelular(celular)) {
    mostrarError("celular", "Formato inválido (ej: +56 9 1234 5678)")
    esValido = false
  }

  // Validar dirección
  const direccion = document.getElementById("direccion").value.trim()
  if (!direccion) {
    mostrarError("direccion", "La dirección es obligatoria")
    esValido = false
  }

  // Validar email
  const email = document.getElementById("email").value.trim()
  if (!email) {
    mostrarError("email", "El correo electrónico es obligatorio")
    esValido = false
  } else if (!validarEmail(email)) {
    mostrarError("email", "El formato del correo electrónico no es válido")
    esValido = false
  }

  // Validar cargo
  const cargo = document.getElementById("cargo").value
  if (!cargo) {
    mostrarError("cargo", "Debe seleccionar un cargo")
    esValido = false
  }

  // Validar contraseña
  const password = document.getElementById("password").value
  if (!password) {
    mostrarError("password", "La contraseña es obligatoria")
    esValido = false
  } else if (password.length < 6) {
    mostrarError("password", "La contraseña debe tener al menos 6 caracteres")
    esValido = false
  }

  // Validar imagen
  const imagenInput = document.getElementById("imagen")
  if (!validarImagen(imagenInput)) {
    mostrarError("imagen", "Debe subir una imagen válida (JPG, PNG, GIF, máx 2MB)")
    esValido = false
  }

  // Validar rol
  const rol = document.getElementById("rol").value
  if (!rol) {
    mostrarError("rol", "Debe seleccionar un rol")
    esValido = false
  }

  // Validar PIN
  const pin = document.getElementById("pin").value.trim()
  if (!pin) {
    mostrarError("pin", "El PIN es obligatorio")
    esValido = false
  } else if (!validarPIN(pin)) {
    mostrarError("pin", "El PIN debe ser numérico y tener 4 dígitos")
    esValido = false
  }



  return esValido
}

// Mensaje de éxito
function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage")
  mensaje.classList.add("show")

  setTimeout(() => {
    mensaje.classList.remove("show")
    setTimeout(() => {
      window.location.href = redirectUrl
    }, 300)
  }, 1000)
}

// Eventos
document.addEventListener("DOMContentLoaded", () => {
  // Formatear RUT
  document.getElementById("rut").addEventListener("input", function () {
    this.value = formatearRUT(this.value)
  })

  // Formatear celular
  document.getElementById("celular").addEventListener("input", function () {
    let valor = this.value.replace(/[^\d]/g, "")
    if (valor.length > 0) {
      if (valor.startsWith("56")) {
        valor = valor.substring(2)
      }
      if (valor.length >= 1) {
        valor =
          "+56 " +
          valor.substring(0, 1) +
          " " +
          valor.substring(1, 5) +
          " " +
          valor.substring(5, 9)
      }
    }
    this.value = valor.trim()
  })

  // Envío del formulario
  const form = document.getElementById("createUserForm")
  form.addEventListener("submit", (e) => {
    if (validarFormulario()) {
      console.log("Formulario válido, creando usuario...")
      mostrarMensajeExito()
    }
  })

  // Botón cancelar
  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = redirectUrl
  })
})
