// Función para validar RUT chileno
function validarRUT(rut) {
  // Remover puntos y guión
  const rutLimpio = rut.replace(/\./g, "").replace("-", "")

  if (rutLimpio.length < 8 || rutLimpio.length > 9) {
    return false
  }

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1).toLowerCase()

  // Calcular dígito verificador
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

// Función para formatear RUT
function formatearRUT(rut) {
  // Remover todo excepto números y k
  const rutLimpio = rut.replace(/[^0-9kK]/g, "").toLowerCase()

  if (rutLimpio.length <= 1) return rutLimpio

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  // Formatear con puntos
  let cuerpoFormateado = ""
  for (let i = 0; i < cuerpo.length; i++) {
    if (i > 0 && (cuerpo.length - i) % 3 === 0) {
      cuerpoFormateado += "."
    }
    cuerpoFormateado += cuerpo[i]
  }

  return cuerpoFormateado + "-" + dv
}

// Función para validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Función para validar celular chileno
function validarCelular(celular) {
  const regex = /^(\+56\s?)?9\s?\d{4}\s?\d{4}$/
  return regex.test(celular)
}

// Función para mostrar error en un campo
function mostrarError(fieldId, mensaje) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")

  field.classList.add("error")
  errorElement.textContent = mensaje
  errorElement.classList.add("show")
}

// Función para limpiar error de un campo
function limpiarError(fieldId) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")

  field.classList.remove("error")
  errorElement.textContent = ""
  errorElement.classList.remove("show")
}

// Función para limpiar todos los errores
function limpiarTodosLosErrores() {
  const campos = ["nombres", "apellidos", "rut", "celular", "direccion", "email", "cargo", "password"]
  campos.forEach((campo) => limpiarError(campo))
}

// Función para validar formulario
function validarFormulario() {
  let esValido = true
  limpiarTodosLosErrores()

  // Validar nombres
  const nombres = document.getElementById("nombres").value.trim()
  if (!nombres) {
    mostrarError("nombres", "Los nombres son obligatorios")
    esValido = false
  } else if (nombres.length < 2) {
    mostrarError("nombres", "Los nombres deben tener al menos 2 caracteres")
    esValido = false
  }

  // Validar apellidos
  const apellidos = document.getElementById("apellidos").value.trim()
  if (!apellidos) {
    mostrarError("apellidos", "Los apellidos son obligatorios")
    esValido = false
  } else if (apellidos.length < 2) {
    mostrarError("apellidos", "Los apellidos deben tener al menos 2 caracteres")
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
    mostrarError("celular", "Formato de celular inválido (ej: +56 9 1234 5678)")
    esValido = false
  }

  // Validar dirección
  const direccion = document.getElementById("direccion").value.trim()
  if (!direccion) {
    mostrarError("direccion", "La dirección es obligatoria")
    esValido = false
  } else if (direccion.length < 5) {
    mostrarError("direccion", "La dirección debe tener al menos 5 caracteres")
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

  return esValido
}

// Función para mostrar mensaje de éxito
function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage")
  mensaje.classList.add("show")

  setTimeout(() => {
    mensaje.classList.remove("show")
    // Redirigir después de ocultar el mensaje
    setTimeout(() => {
      window.location.href = redirectUrl 
    }, 300)
  }, 1000)
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Formateo automático del RUT
  const rutInput = document.getElementById("rut")
  rutInput.addEventListener("input", function () {
    this.value = formatearRUT(this.value)
  })

  // Formateo del celular
  const celularInput = document.getElementById("celular")
  celularInput.addEventListener("input", function () {
    let valor = this.value.replace(/[^\d]/g, "")
    if (valor.length > 0) {
      if (valor.startsWith("56")) {
        valor = valor.substring(2)
      }
      if (valor.length >= 1) {
        valor = "+56 " + valor.substring(0, 1) + " " + valor.substring(1, 5) + " " + valor.substring(5, 9)
      }
    }
    this.value = valor.trim()
  })

  // Envío del formulario
  const form = document.getElementById("createUserForm")
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    if (validarFormulario()) {
      // Aquí iría la lógica para enviar los datos al servidor
      console.log("Formulario válido, creando usuario...")
      mostrarMensajeExito()
    }
  })

  // Botón cancelar
  const cancelBtn = document.getElementById("cancelBtn")
  cancelBtn.addEventListener("click", () => {
    window.location.href = redirectUrl   // ✅ corregido
  })
})