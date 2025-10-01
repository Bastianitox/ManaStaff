// Datos de usuarios de prueba (mismos que en administrar_usuarios.js)
const usersData = [
  {
    id: 1,
    name: "Ana García López",
    email: "ana.garcia@empresa.com",
    position: "Gerente de Ventas",
    createdDate: "15 Enero, 2024",
    rut: "12.345.678-9",
    celular: "+56 9 8765 4321",
    direccion: "Av. Providencia 1234, Santiago",
    nombres: "Ana",
    apellidos: "García López",
  },
  {
    id: 2,
    name: "Carlos Rodríguez Martín",
    email: "carlos.rodriguez@empresa.com",
    position: "Desarrollador Senior",
    createdDate: "22 Febrero, 2024",
    rut: "11.222.333-4",
    celular: "+56 9 7654 3210",
    direccion: "Calle Los Leones 567, Las Condes",
    nombres: "Carlos",
    apellidos: "Rodríguez Martín",
  },
  {
    id: 3,
    name: "María Fernández Silva",
    email: "maria.fernandez@empresa.com",
    position: "Diseñadora UX/UI",
    createdDate: "08 Marzo, 2024",
    rut: "15.678.901-2",
    celular: "+56 9 6543 2109",
    direccion: "Pasaje San Martín 890, Ñuñoa",
    nombres: "María",
    apellidos: "Fernández Silva",
  },
  {
    id: 4,
    name: "José Luis Pérez",
    email: "jose.perez@empresa.com",
    position: "Contador",
    createdDate: "14 Abril, 2024",
    rut: "18.765.432-1",
    celular: "+56 9 5432 1098",
    direccion: "Av. Libertador 456, Santiago Centro",
    nombres: "José Luis",
    apellidos: "Pérez",
  },
  {
    id: 5,
    name: "Laura Sánchez Ruiz",
    email: "laura.sanchez@empresa.com",
    position: "Marketing Manager",
    createdDate: "03 Mayo, 2024",
    rut: "16.543.210-9",
    celular: "+56 9 4321 0987",
    direccion: "Calle Moneda 789, Santiago",
    nombres: "Laura",
    apellidos: "Sánchez Ruiz",
  },
]

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
function validateRUT(rut) {
  if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rut)) return false

  const tmp = rut.split("-")
  let digv = tmp[1]
  const rut_num = tmp[0]

  if (digv == "K") digv = "k"

  return dv(rut_num) == digv
}

function dv(T) {
  let M = 0,
    S = 1
  for (; T; T = Math.floor(T / 10)) {
    S = (S + (T % 10) * (9 - (M++ % 6))) % 11
  }
  return S ? S - 1 : "k"
}

// Función para formatear RUT
function formatRUT(rut) {
  const value = rut.replace(/[^0-9kK]/g, "")
  if (value.length <= 1) return value

  const body = value.slice(0, -1)
  const dv = value.slice(-1)

  let formattedBody = ""
  for (let i = 0; i < body.length; i++) {
    if (i > 0 && (body.length - i) % 3 === 0) {
      formattedBody += "."
    }
    formattedBody += body[i]
  }

  return formattedBody + "-" + dv
}

// Función para validar email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Función para cargar datos del usuario
async function loadUserData() {
  const currentUserId = getUrlParameter("id"); 
  if (!currentUserId) {
    alert("ID de usuario no especificado");
    window.location.href = "/administrar_usuarios";
    return;
  }

  try {
    const response = await fetch("/obtener_usuarios");
    if (!response.ok) throw new Error("Error al obtener usuarios");

    const data = await response.json();
    const usuarios = data.usuarios || [];
    
    const currentUser = usuarios.find(u => u.rut === currentUserId || u.rut_normal === currentUserId);
    if (!currentUser) {
      alert("Usuario no encontrado");
      window.location.href = "/administrar_usuarios";
      return;
    }

    // Rellenar los campos con los datos
    document.getElementById("nombres").value = currentUser.name.split(" ")[0] || "";
    document.getElementById("apellidos").value = currentUser.name.split(" ").slice(1).join(" ") || "";
    document.getElementById("rut").value = currentUser.rut;
    document.getElementById("celular").value = currentUser.celular || "";
    document.getElementById("direccion").value = currentUser.direccion || "";
    document.getElementById("email").value = currentUser.email || "";
    document.getElementById("cargo").value = currentUser.position || "";

  } catch (error) {
    console.error(error);
    alert("Error al cargar los datos del usuario");
    window.location.href = "/administrar_usuarios";
  }
}

// Función para limpiar errores
function clearErrors() {
  const errorMessages = document.querySelectorAll(".error-message")
  const inputs = document.querySelectorAll("input, select")

  errorMessages.forEach((error) => {
    error.classList.remove("show")
    error.textContent = ""
  })

  inputs.forEach((input) => {
    input.classList.remove("error")
  })
}

// Función para mostrar error
function showError(fieldId, message) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")

  field.classList.add("error")
  errorElement.textContent = message
  errorElement.classList.add("show")
}

// Función para validar formulario
function validateForm() {
  clearErrors()
  let isValid = true

  // Validar nombres
  const nombres = document.getElementById("nombres").value.trim()
  if (!nombres) {
    showError("nombres", "Los nombres son obligatorios")
    isValid = false
  }

  // Validar apellidos
  const apellidos = document.getElementById("apellidos").value.trim()
  if (!apellidos) {
    showError("apellidos", "Los apellidos son obligatorios")
    isValid = false
  }

  // Validar RUT
  const rut = document.getElementById("rut").value.trim()
  if (!rut) {
    showError("rut", "El RUT es obligatorio")
    isValid = false
  } else if (!validateRUT(rut)) {
    showError("rut", "El RUT ingresado no es válido")
    isValid = false
  }

  // Validar celular
  const celular = document.getElementById("celular").value.trim()
  if (!celular) {
    showError("celular", "El número de celular es obligatorio")
    isValid = false
  }

  // Validar dirección
  const direccion = document.getElementById("direccion").value.trim()
  if (!direccion) {
    showError("direccion", "La dirección es obligatoria")
    isValid = false
  }

  // Validar email
  const email = document.getElementById("email").value.trim()
  if (!email) {
    showError("email", "El correo electrónico es obligatorio")
    isValid = false
  } else if (!validateEmail(email)) {
    showError("email", "El formato del correo electrónico no es válido")
    isValid = false
  }

  // Validar cargo
  const cargo = document.getElementById("cargo").value
  if (!cargo) {
    showError("cargo", "Debe seleccionar un cargo")
    isValid = false
  }

  // Validar contraseña (opcional)
  const password = document.getElementById("password").value
  if (password && password.length < 6) {
    showError("password", "La contraseña debe tener al menos 6 caracteres")
    isValid = false
  }

  return isValid
}

// Función para mostrar mensaje de éxito
function showSuccessMessage() {
  const successMessage = document.getElementById("successMessage")
  successMessage.classList.add("show")

  setTimeout(() => {
    successMessage.classList.remove("show")
    // Redirigir después de 1 segundo
    setTimeout(() => {
      window.location.href = "/administrar_usuarios"
    }, 300)
  }, 1000)
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos del usuario
  loadUserData()

  // Formateo automático del RUT
  const rutInput = document.getElementById("rut")
  rutInput.addEventListener("input", function () {
    const formatted = formatRUT(this.value)
    this.value = formatted
  })

  // Formulario
  const form = document.getElementById("editUserForm")
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Aquí iría la lógica para actualizar el usuario
      console.log("Usuario modificado:", {
        id: currentUserId,
        nombres: document.getElementById("nombres").value,
        apellidos: document.getElementById("apellidos").value,
        rut: document.getElementById("rut").value,
        celular: document.getElementById("celular").value,
        direccion: document.getElementById("direccion").value,
        email: document.getElementById("email").value,
        cargo: document.getElementById("cargo").value,
        password: document.getElementById("password").value || "sin cambios",
      })

      showSuccessMessage()
    }
  })

  // Botón cancelar
  const cancelBtn = document.getElementById("cancelBtn")
  cancelBtn.addEventListener("click", () => {
    window.location.href = "/administrar_usuarios"
  })
})
