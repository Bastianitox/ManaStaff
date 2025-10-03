// Variables globales
let currentFilter = "todos"

// Datos falsos del usuario
const usuarioFalso = {
  nombre: "Juan Carlos",
  apellido: "Pérez González",
  rut: "12.345.678-9",
}

// Datos falsos de documentos
const documentosFalsos = [
  {
    id: 1,
    nombre: "Contrato de Trabajo",
    estado: "activo",
    fecha_subida: "15/01/2024",
  },
  {
    id: 2,
    nombre: "Certificado de Antecedentes",
    estado: "pendiente",
    fecha_subida: "10/01/2024",
  },
  {
    id: 3,
    nombre: "Examen Médico Ocupacional",
    estado: "caducado",
    fecha_subida: "05/12/2023",
  },
  {
    id: 4,
    nombre: "Certificado de Estudios",
    estado: "activo",
    fecha_subida: "20/01/2024",
  },
  {
    id: 5,
    nombre: "Licencia de Conducir",
    estado: "activo",
    fecha_subida: "18/01/2024",
  },
  {
    id: 6,
    nombre: "Certificado de Capacitación",
    estado: "pendiente",
    fecha_subida: "12/01/2024",
  },
  {
    id: 7,
    nombre: "Seguro de Vida",
    estado: "caducado",
    fecha_subida: "01/11/2023",
  },
  {
    id: 8,
    nombre: "Finiquito Anterior",
    estado: "activo",
    fecha_subida: "22/01/2024",
  },
  {
    id: 9,
    nombre: "Certificado AFP",
    estado: "pendiente",
    fecha_subida: "08/01/2024",
  },
  {
    id: 10,
    nombre: "Declaración Jurada",
    estado: "activo",
    fecha_subida: "25/01/2024",
  },
]

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  renderUserInfo()
  renderDocuments()
  initializeFilters()
  initializeSearch()
})

function renderUserInfo() {
  const employeeName = document.getElementById("employeeName")
  const employeeRut = document.getElementById("employeeRut")

  if (employeeName) {
    employeeName.textContent = `${usuarioFalso.nombre} ${usuarioFalso.apellido}`
  }
  if (employeeRut) {
    employeeRut.textContent = usuarioFalso.rut
  }
}

function renderDocuments() {
  const documentsGrid = document.getElementById("documentsGrid")

  if (!documentsGrid) return

  documentsGrid.innerHTML = ""

  if (documentosFalsos.length === 0) {
    documentsGrid.innerHTML = `
      <div class="no-documents">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>No hay documentos disponibles para este usuario</p>
      </div>
    `
    return
  }

  documentosFalsos.forEach((documento) => {
    const card = document.createElement("div")
    card.className = "document-card"
    card.setAttribute("data-status", documento.estado.toLowerCase())
    card.setAttribute("data-nombre", documento.nombre.toLowerCase())

    card.innerHTML = `
      <div class="document-header">
        <h3 class="document-name">${documento.nombre}</h3>
        <span class="status-badge status-${documento.estado.toLowerCase()}">
          ${documento.estado.charAt(0).toUpperCase() + documento.estado.slice(1)}
        </span>
      </div>
      
      <div class="document-info">
        <div class="info-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>Subido: ${documento.fecha_subida}</span>
        </div>
      </div>

      <div class="document-actions">
        <button class="action-btn btn-view" onclick="verDocumento(${documento.id})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Ver
        </button>
        <button class="action-btn btn-upload" onclick="subirDocumento(${documento.id})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          Subir
        </button>
        <button class="action-btn btn-edit" onclick="modificarDocumento(${documento.id})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Modificar
        </button>
        <button class="action-btn btn-delete" onclick="eliminarDocumento(${documento.id})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>
    `

    documentsGrid.appendChild(card)
  })
}

// Inicializar filtros de estado
function initializeFilters() {
  const filterButtons = document.querySelectorAll(".status-tab")

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const status = this.getAttribute("data-status")

      // Toggle: si el filtro ya está activo, desactivarlo
      if (currentFilter === status) {
        currentFilter = "todos"
        filterButtons.forEach((btn) => btn.classList.remove("active"))
      } else {
        currentFilter = status
        filterButtons.forEach((btn) => btn.classList.remove("active"))
        this.classList.add("active")
      }

      applyFilters()
    })
  })
}

// Inicializar búsqueda
function initializeSearch() {
  const searchInput = document.getElementById("searchInput")

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilters()
    })
  }
}

// Aplicar filtros combinados (búsqueda + estado)
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  const documentCards = document.querySelectorAll(".document-card")

  documentCards.forEach((card) => {
    const documentName = card.getAttribute("data-nombre")
    const documentStatus = card.getAttribute("data-status")

    // Verificar si coincide con la búsqueda
    const matchesSearch = documentName.includes(searchTerm)

    // Verificar si coincide con el filtro de estado
    const matchesFilter = currentFilter === "todos" || documentStatus === currentFilter

    // Mostrar solo si coincide con ambos criterios
    if (matchesSearch && matchesFilter) {
      card.classList.remove("hidden")
    } else {
      card.classList.add("hidden")
    }
  })
}

// Funciones para las acciones de documentos
function verDocumento(documentoId) {
  console.log("[v0] Ver documento:", documentoId)
  // Aquí va la lógica para ver el documento
  // Por ejemplo: window.location.href = `/documentos/ver/${documentoId}/`;
}

function subirDocumento(documentoId) {
  console.log("[v0] Subir documento:", documentoId)
  // Aquí va la lógica para subir/actualizar el documento
  // Por ejemplo: window.location.href = `/documentos/subir/${documentoId}/`;
}

function modificarDocumento(documentoId) {
  console.log("[v0] Modificar documento:", documentoId)
  // Aquí va la lógica para modificar el documento
  // Por ejemplo: window.location.href = `/documentos/modificar/${documentoId}/`;
}

function eliminarDocumento(documentoId) {
  console.log("[v0] Eliminar documento:", documentoId)
  // Aquí va la lógica para eliminar el documento
  if (confirm("¿Estás seguro de que deseas eliminar este documento?")) {
    // Por ejemplo: realizar una petición AJAX para eliminar
    // fetch(`/documentos/eliminar/${documentoId}/`, { method: 'DELETE' })
  }
}
