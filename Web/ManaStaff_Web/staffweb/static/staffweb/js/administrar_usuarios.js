// Datos de usuarios de prueba
const usersData = [
  {
    id: 1,
    name: "Ana García López",
    email: "ana.garcia@empresa.com",
    position: "Gerente de Ventas",
    createdDate: "15 Enero, 2024",
    sortDate: new Date("2024-01-15"),
  },
  {
    id: 2,
    name: "Carlos Rodríguez Martín",
    email: "carlos.rodriguez@empresa.com",
    position: "Desarrollador Senior",
    createdDate: "22 Febrero, 2024",
    sortDate: new Date("2024-02-22"),
  },
  {
    id: 3,
    name: "María Fernández Silva",
    email: "maria.fernandez@empresa.com",
    position: "Diseñadora UX/UI",
    createdDate: "08 Marzo, 2024",
    sortDate: new Date("2024-03-08"),
  },
  {
    id: 4,
    name: "José Luis Pérez",
    email: "jose.perez@empresa.com",
    position: "Contador",
    createdDate: "14 Abril, 2024",
    sortDate: new Date("2024-04-14"),
  },
  {
    id: 5,
    name: "Laura Sánchez Ruiz",
    email: "laura.sanchez@empresa.com",
    position: "Marketing Manager",
    createdDate: "03 Mayo, 2024",
    sortDate: new Date("2024-05-03"),
  },
  {
    id: 6,
    name: "Miguel Ángel Torres",
    email: "miguel.torres@empresa.com",
    position: "Analista de Sistemas",
    createdDate: "19 Junio, 2024",
    sortDate: new Date("2024-06-19"),
  },
  {
    id: 7,
    name: "Carmen Jiménez Vega",
    email: "carmen.jimenez@empresa.com",
    position: "Recursos Humanos",
    createdDate: "25 Julio, 2024",
    sortDate: new Date("2024-07-25"),
  },
  {
    id: 8,
    name: "Francisco Morales",
    email: "francisco.morales@empresa.com",
    position: "Supervisor de Producción",
    createdDate: "11 Agosto, 2024",
    sortDate: new Date("2024-08-11"),
  },
  {
    id: 9,
    name: "Isabel Romero Castro",
    email: "isabel.romero@empresa.com",
    position: "Asistente Administrativa",
    createdDate: "07 Septiembre, 2024",
    sortDate: new Date("2024-09-07"),
  },
  {
    id: 10,
    name: "Antonio Herrera",
    email: "antonio.herrera@empresa.com",
    position: "Técnico de Soporte",
    createdDate: "16 Octubre, 2024",
    sortDate: new Date("2024-10-16"),
  },
  {
    id: 11,
    name: "Pilar Navarro Díaz",
    email: "pilar.navarro@empresa.com",
    position: "Coordinadora de Proyectos",
    createdDate: "28 Noviembre, 2024",
    sortDate: new Date("2024-11-28"),
  },
  {
    id: 12,
    name: "Rafael Guerrero",
    email: "rafael.guerrero@empresa.com",
    position: "Desarrollador Frontend",
    createdDate: "05 Diciembre, 2024",
    sortDate: new Date("2024-12-05"),
  },
  {
    id: 13,
    name: "Rocío Mendoza Luna",
    email: "rocio.mendoza@empresa.com",
    position: "Especialista en Calidad",
    createdDate: "12 Diciembre, 2024",
    sortDate: new Date("2024-12-12"),
  },
  {
    id: 14,
    name: "Javier Ortega Ramos",
    email: "javier.ortega@empresa.com",
    position: "Consultor de Negocios",
    createdDate: "18 Diciembre, 2024",
    sortDate: new Date("2024-12-18"),
  },
  {
    id: 15,
    name: "Beatriz Vargas Cruz",
    email: "beatriz.vargas@empresa.com",
    position: "Directora de Operaciones",
    createdDate: "24 Diciembre, 2024",
    sortDate: new Date("2024-12-24"),
  },
]

const sortedUsersData = [...usersData].sort((a, b) => b.sortDate - a.sortDate)

// Variables globales
let currentPage = 1
const usersPerPage = 10
let filteredUsers = [...sortedUsersData]

// Función para renderizar la tabla
function renderTable() {
  const tableBody = document.getElementById("usersTableBody")
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const usersToShow = filteredUsers.slice(startIndex, endIndex)

  tableBody.innerHTML = ""

  usersToShow.forEach((user) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.position}</td>
            <td>${user.createdDate}</td>
            <td>
                <button class="action-btn" onclick="editUser(${user.id})" title="Modificar usuario">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                    </svg>
                    Modificar
                </button>
            </td>
        `
    tableBody.appendChild(row)
  })

  updatePagination()
}

// Función para actualizar la paginación
function updatePagination() {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const pageInfo = document.getElementById("pageInfo")
  const prevBtn = document.getElementById("prevBtn")
  const nextBtn = document.getElementById("nextBtn")

  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`

  prevBtn.disabled = currentPage === 1
  nextBtn.disabled = currentPage === totalPages || totalPages === 0
}

// Función para filtrar usuarios
function filterUsers(searchTerm) {
  if (!searchTerm.trim()) {
    filteredUsers = [...sortedUsersData]
  } else {
    filteredUsers = sortedUsersData.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }
  currentPage = 1
  renderTable()
  showNoResultsMessage()
}

// Función para mostrar mensaje de sin resultados
function showNoResultsMessage() {
  const tableBody = document.getElementById("usersTableBody")
  const existingMessage = document.querySelector(".no-results-message")

  if (existingMessage) {
    existingMessage.remove()
  }

  if (filteredUsers.length === 0) {
    const searchTerm = document.getElementById("searchInput").value
    const noResultsRow = document.createElement("tr")
    noResultsRow.className = "no-results-message"
    noResultsRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
                <div>
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="M15.5,14H20.5L22,15.5V20.5L20.5,22H15.5L14,20.5V15.5L15.5,14M16,16V20H20V16H16M10.5,18H12.5V20H10.5V18M6.5,16H8.5V18H6.5V16M2.5,14H4.5V16H2.5V14M21.5,12H23.5V14H21.5V12M19.5,10H21.5V12H19.5V10M17.5,8H19.5V10H17.5V8M15.5,6H17.5V8H15.5V6M13.5,4H15.5V6H13.5V4M11.5,2H13.5V4H11.5V2M9.5,4H11.5V6H9.5V4M7.5,6H9.5V8H7.5V6M5.5,8H7.5V10H5.5V8M3.5,10H5.5V12H3.5V10M1.5,12H3.5V14H1.5V12"/>
                    </svg>
                    <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 18px;">No se encontraron usuarios</h3>
                    <p style="margin: 0; font-size: 14px;">No hay usuarios que coincidan con "${searchTerm}"</p>
                </div>
            </td>
        `
    tableBody.appendChild(noResultsRow)
  }
}

// Función para ir a la página anterior
function previousPage() {
  if (currentPage > 1) {
    currentPage--
    renderTable()
  }
}

// Función para ir a la página siguiente
function nextPage() {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  if (currentPage < totalPages) {
    currentPage++
    renderTable()
  }
}

// Función para editar usuario (placeholder)
function editUser(userId) {
  const baseUrl = document.getElementById("usersTableBody").dataset.editUrl;
  window.location.href = `${baseUrl}?id=${userId}`;
}

// Función para crear nuevo usuario
function createNewUser() {
  const url = document.getElementById("createUserBtn").dataset.url;
  window.location.href = url;
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Renderizar tabla inicial
  renderTable()

  // Buscador
  const searchInput = document.getElementById("searchInput")
  searchInput.addEventListener("input", function () {
    filterUsers(this.value)
  })

  // Botones de paginación
  const prevBtn = document.getElementById("prevBtn")
  const nextBtn = document.getElementById("nextBtn")

  prevBtn.addEventListener("click", previousPage)
  nextBtn.addEventListener("click", nextPage)

  // Botón crear usuario
  const createUserBtn = document.getElementById("createUserBtn")
  createUserBtn.addEventListener("click", createNewUser)

  // Hacer que el Enter en el buscador también funcione
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      filterUsers(this.value)
    }
  })
})

