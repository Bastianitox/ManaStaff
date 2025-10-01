// Datos de usuarios de prueba
var usersData = []

async function obtener_usuarios() {
  try {
    const response = await fetch("obtener_usuarios")
    if (!response.ok) throw new Error("Error HTTP " + response.status)

    const data = await response.json()
    usersData = data.usuarios

    filteredUsers = [...usersData].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
    renderTable()
  } catch (error) {
    console.error("Error al obtener los usuarios:", error)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  obtener_usuarios()
})


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
            <td>${user.rut_normal}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.position}</td>
            <td>${user.createdDate}</td>
            <td>
                <button class="action-btn" onclick="editUser(${user.rut})" title="Modificar usuario">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                    </svg>
                    Modificar
                </button>
                <button class="action-btn delete-btn" onclick="deleteUser(${user.rut})" title="Eliminar usuario">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M19,4H15.5L14.79,
                        3.29C14.61,3.11 14.35,3 14.09,3H9.91C9.65,3 9.39,
                        3.11 9.21,3.29L8.5,4H5V6H19V4Z"/>
                    </svg>
                    Eliminar
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



// CREAR MODAL DE CONFIRMACION

// VARIABLE PARA GUARDAR EL ID DEL USUARIO (RUT)
let userToDelete = null;

function deleteUser(userId) {
  userToDelete = userId;
  document.getElementById("confirmModal").classList.remove("hidden");
}

// Cancelar eliminación
document.getElementById("cancelBtn").addEventListener("click", () => {
  userToDelete = null;
  document.getElementById("confirmModal").classList.add("hidden");
});

// Confirmar eliminación
document.getElementById("confirmBtn").addEventListener("click", () => {
  if (!userToDelete) return;

  // Mostrar spinner de carga
  document.getElementById("loadingSpinner").classList.remove("hidden");

  fetch(`/eliminar_usuario/${userToDelete}`, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Usuario eliminado con éxito");
        obtener_usuarios();
      } else {
        alert("Error: " + data.message);
      }
    })
    .catch((error) => console.error("Error:", error))
    .finally(() => {
      userToDelete = null;
      document.getElementById("confirmModal").classList.add("hidden");
      // Ocultar spinner
      document.getElementById("loadingSpinner").classList.add("hidden");
    });
});


// Helper para CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}