const usuarios = [
  { id: 1, nombre: "Juan Carlos Pérez González", rut: "12.345.678-9" },
  { id: 2, nombre: "María Fernanda López Martínez", rut: "23.456.789-0" },
  { id: 3, nombre: "Pedro Antonio Ramírez Silva", rut: "34.567.890-1" },
  { id: 4, nombre: "Ana Sofía Torres Vargas", rut: "45.678.901-2" },
  { id: 5, nombre: "Carlos Eduardo Morales Castro", rut: "56.789.012-3" },
  { id: 6, nombre: "Valentina Isabel Rojas Muñoz", rut: "67.890.123-4" },
  { id: 7, nombre: "Diego Alejandro Soto Herrera", rut: "78.901.234-5" },
  { id: 8, nombre: "Camila Andrea Vega Flores", rut: "89.012.345-6" },
  { id: 9, nombre: "Sebastián Ignacio Díaz Ponce", rut: "90.123.456-7" },
  { id: 10, nombre: "Francisca Belén Núñez Ortiz", rut: "01.234.567-8" },
]

let selectedUser = null

const userSearchInput = document.getElementById("userSearch")
const userDropdown = document.getElementById("userDropdown")
const selectedUserDisplay = document.getElementById("selectedUserDisplay")
const selectedUserIdInput = document.getElementById("selectedUserId")
const documentFileInput = document.getElementById("documentFile")
const fileNameSpan = document.getElementById("fileName")
const createDocumentForm = document.getElementById("createDocumentForm")
const successMessage = document.getElementById("successMessage")
const statusActivo = document.getElementById("statusActivo")
const statusPendiente = document.getElementById("statusPendiente")
const fileRequired = document.getElementById("fileRequired")
const fileOptional = document.getElementById("fileOptional")

userSearchInput.addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase().trim()

  if (searchTerm.length === 0) {
    userDropdown.classList.remove("show")
    return
  }

  const filteredUsers = usuarios.filter(
    (user) => user.nombre.toLowerCase().includes(searchTerm) || user.rut.includes(searchTerm),
  )

  if (filteredUsers.length > 0) {
    userDropdown.innerHTML = filteredUsers
      .map(
        (user) => `
            <div class="user-option" data-user-id="${user.id}" data-user-name="${user.nombre}" data-user-rut="${user.rut}">
                <div class="user-option-name">${user.nombre}</div>
                <div class="user-option-rut">${user.rut}</div>
            </div>
        `,
      )
      .join("")
    userDropdown.classList.add("show")
  } else {
    userDropdown.innerHTML = '<div class="no-results">No se encontraron usuarios</div>'
    userDropdown.classList.add("show")
  }
})

userDropdown.addEventListener("click", (e) => {
  const userOption = e.target.closest(".user-option")
  if (userOption) {
    const userId = userOption.dataset.userId
    const userName = userOption.dataset.userName
    const userRut = userOption.dataset.userRut

    selectedUser = { id: userId, nombre: userName, rut: userRut }

    userSearchInput.value = ""
    selectedUserIdInput.value = userId
    userDropdown.classList.remove("show")

    selectedUserDisplay.innerHTML = `
            <div class="selected-user-info">
                <div class="selected-user-name">${userName}</div>
                <div class="selected-user-rut">${userRut}</div>
            </div>
            <button type="button" class="remove-user" onclick="removeSelectedUser()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `
    selectedUserDisplay.classList.add("show")

    document.getElementById("userSearchError").classList.remove("show")
    userSearchInput.classList.remove("error")
  }
})

function removeSelectedUser() {
  selectedUser = null
  selectedUserIdInput.value = ""
  selectedUserDisplay.classList.remove("show")
  selectedUserDisplay.innerHTML = ""
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    userDropdown.classList.remove("show")
  }
})

documentFileInput.addEventListener("change", function () {
  if (this.files.length > 0) {
    const fileName = this.files[0].name
    fileNameSpan.textContent = fileName

    document.getElementById("documentFileError").classList.remove("show")
    this.classList.remove("error")
  } else {
    fileNameSpan.textContent = "Seleccionar archivo"
  }
})

function updateFileRequirement() {
  if (statusPendiente.checked) {
    fileRequired.style.display = "none"
    fileOptional.style.display = "inline"
  } else {
    fileRequired.style.display = "inline"
    fileOptional.style.display = "none"
  }
}

statusActivo.addEventListener("change", updateFileRequirement)
statusPendiente.addEventListener("change", updateFileRequirement)

updateFileRequirement()

createDocumentForm.addEventListener("submit", function (e) {
  e.preventDefault()

  let isValid = true

  const documentName = document.getElementById("documentName")
  const documentNameError = document.getElementById("documentNameError")
  if (documentName.value.trim() === "") {
    documentNameError.textContent = "El nombre del documento es obligatorio"
    documentNameError.classList.add("show")
    documentName.classList.add("error")
    isValid = false
  } else {
    documentNameError.classList.remove("show")
    documentName.classList.remove("error")
  }

  const documentFileError = document.getElementById("documentFileError")
  const documentStatus = document.querySelector('input[name="documentStatus"]:checked').value

  if (documentStatus === "activo") {
    if (documentFileInput.files.length === 0) {
      documentFileError.textContent = "Debe seleccionar un archivo para documentos activos"
      documentFileError.classList.add("show")
      isValid = false
    } else {

      const fileSize = documentFileInput.files[0].size / 1024 / 1024 
      if (fileSize > 10) {
        documentFileError.textContent = "El archivo no debe superar los 10MB"
        documentFileError.classList.add("show")
        isValid = false
      } else {
        documentFileError.classList.remove("show")
      }
    }
  } else {

    if (documentFileInput.files.length > 0) {
      const fileSize = documentFileInput.files[0].size / 1024 / 1024
      if (fileSize > 10) {
        documentFileError.textContent = "El archivo no debe superar los 10MB"
        documentFileError.classList.add("show")
        isValid = false
      } else {
        documentFileError.classList.remove("show")
      }
    } else {
      documentFileError.classList.remove("show")
    }
  }

  const userSearchError = document.getElementById("userSearchError")
  const selectedUserId = document.getElementById("selectedUserId").value
  if (!selectedUserId || selectedUserId.trim() === "") {
    userSearchError.textContent = "Debe seleccionar un usuario"
    userSearchError.classList.add("show")
    userSearchInput.classList.add("error")
    isValid = false
  } else {
    userSearchError.classList.remove("show")
    userSearchInput.classList.remove("error")
  }

  if (isValid) {
    successMessage.classList.add("show")

    const submitButton = this.querySelector(".btn-submit")
    submitButton.disabled = true
    submitButton.textContent = "Creando..."

    setTimeout(() => {
      console.log("[v0] Documento creado:", {
        nombre: documentName.value,
        estado: documentStatus,
        archivo: documentFileInput.files.length > 0 ? documentFileInput.files[0].name : "Sin archivo",
        usuario: selectedUser,
        fechaVencimiento: document.getElementById("expirationDate").value,
      })

      window.location.href = document.querySelector(".back-button").href
    }, 1500)
  }
})
