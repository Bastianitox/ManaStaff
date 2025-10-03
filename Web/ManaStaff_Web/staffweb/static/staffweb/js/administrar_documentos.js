function verTodosDocumentos(userId) {
  window.location.href = `/documentos/usuario/${userId}/todos`
}


function verDocumento(docId) {
  console.log("Ver documento:", docId)
}

function subirDocumento(docId) {
  console.log("Subir documento:", docId)
}

function modificarDocumento(docId) {
  console.log("Modificar documento:", docId)
}

function eliminarDocumento(docId) {
  console.log("Eliminar documento:", docId)
  if (confirm("¿Estás seguro de que deseas eliminar este documento?")) {
  }
}

function crearDocumento() {
  console.log("Crear nuevo documento")
}

// Funcionalidad del buscador
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput")

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase()
      const userBlocks = document.querySelectorAll(".bloque-usuario")

      userBlocks.forEach((block) => {
        const userName = block.querySelector(".usuario-nombre").textContent.toLowerCase()
        const userRut = block.querySelector(".usuario-rut").textContent.toLowerCase()

        if (userName.includes(searchTerm) || userRut.includes(searchTerm)) {
          block.style.display = "block"
        } else {
          block.style.display = "none"
        }
      })
    })
  }

  // Funcionalidad de los tabs de estado
  const statusTabs = document.querySelectorAll(".status-tab")

  statusTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      statusTabs.forEach((t) => t.classList.remove("active"))
      this.classList.add("active")

      const selectedStatus = this.getAttribute("data-status")
      const documentCards = document.querySelectorAll(".document-card")

      // Filtrar documentos por estado
      documentCards.forEach((card) => {
        const cardStatus = card.getAttribute("data-status")

        if (selectedStatus === "todos" || cardStatus === selectedStatus) {
          card.style.display = "block"
        } else {
          card.style.display = "none"
        }
      })
    })
  })
})
