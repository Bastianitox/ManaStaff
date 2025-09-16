document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput")
  const filterBtn = document.getElementById("filterBtn")
  const filterModal = document.getElementById("filterModal")
  const closeFilter = document.getElementById("closeFilter")
  const applyFilters = document.getElementById("applyFilters")
  const clearFilters = document.getElementById("clearFilters")
  const documentCards = document.querySelectorAll(".document-card")

  let currentFilters = {
    search: "",
    format: "",
    sort: "date-desc",
    size: "",
  }

  // Funcionalidad de búsqueda mejorada
  searchInput.addEventListener("input", function () {
    currentFilters.search = this.value.toLowerCase().trim()
    applyAllFilters()

    // Mostrar mensaje si no hay resultados
    showNoResultsMessage()
  })

  // Abrir modal de filtros
  filterBtn.addEventListener("click", () => {
    filterModal.style.display = "flex"
    document.body.style.overflow = "hidden"
  })

  // Cerrar modal de filtros
  closeFilter.addEventListener("click", closeFilterModal)
  filterModal.addEventListener("click", (e) => {
    if (e.target === filterModal) {
      closeFilterModal()
    }
  })

  function closeFilterModal() {
    filterModal.style.display = "none"
    document.body.style.overflow = "auto"
  }

  applyFilters.addEventListener("click", () => {
    currentFilters.format = document.getElementById("formatFilter").value
    currentFilters.sort = document.getElementById("sortFilter").value
    currentFilters.size = document.getElementById("sizeFilter").value

    applyAllFilters()
    closeFilterModal()
  })

  clearFilters.addEventListener("click", () => {
    document.getElementById("formatFilter").value = ""
    document.getElementById("sortFilter").value = "date-desc"
    document.getElementById("sizeFilter").value = ""
    searchInput.value = ""

    currentFilters = {
      search: "",
      format: "",
      sort: "date-desc",
      size: "",
    }

    applyAllFilters()
    closeFilterModal()
  })

  function applyAllFilters() {
    const visibleCards = []

    documentCards.forEach((card) => {
      const title = card.querySelector(".document-title").textContent.toLowerCase()
      const format = card.querySelector(".document-format").textContent
      const sizeText = card.querySelector(".document-size").textContent
      const dateText = card.querySelector(".document-date").textContent

      let showCard = true

      if (currentFilters.search) {
        const searchTerms = currentFilters.search.split(" ").filter((term) => term.length > 0)
        const matchesSearch = searchTerms.every((term) => title.includes(term) || format.toLowerCase().includes(term))
        if (!matchesSearch) {
          showCard = false
        }
      }

      // Filtro de formato
      if (currentFilters.format && format !== currentFilters.format) {
        showCard = false
      }

      // Filtro de tamaño
      if (currentFilters.size) {
        const sizeValue = Number.parseFloat(sizeText.replace(/[^\d.]/g, ""))
        const sizeUnit = sizeText.includes("KB") ? "KB" : "MB"
        const sizeInMB = sizeUnit === "KB" ? sizeValue / 1024 : sizeValue

        switch (currentFilters.size) {
          case "small":
            if (sizeInMB >= 1) showCard = false
            break
          case "medium":
            if (sizeInMB < 1 || sizeInMB > 3) showCard = false
            break
          case "large":
            if (sizeInMB <= 3) showCard = false
            break
        }
      }

      if (showCard) {
        card.style.display = "block"
        visibleCards.push({
          element: card,
          title: title,
          date: new Date(dateText.replace(/(\d+)\s(\w+),\s(\d+)/, "$2 $1, $3")),
          size: Number.parseFloat(sizeText.replace(/[^\d.]/g, "")) * (sizeText.includes("KB") ? 0.001 : 1),
        })
      } else {
        card.style.display = "none"
      }
    })

    if (currentFilters.sort && visibleCards.length > 0) {
      sortDocuments(visibleCards, currentFilters.sort)
    }
  }

  function sortDocuments(cards, sortType) {
    const container = document.querySelector(".documents-grid")

    cards.sort((a, b) => {
      switch (sortType) {
        case "date-desc":
          return b.date - a.date
        case "date-asc":
          return a.date - b.date
        case "name-asc":
          return a.title.localeCompare(b.title)
        case "name-desc":
          return b.title.localeCompare(a.title)
        case "size-desc":
          return b.size - a.size
        case "size-asc":
          return a.size - b.size
        default:
          return 0
      }
    })

    // Reordenar elementos en el DOM
    cards.forEach((card) => {
      container.appendChild(card.element)
    })
  }

  // Funcionalidad de los botones de acción
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const documentTitle = this.closest(".document-card").querySelector(".document-title").textContent

      // Mapear títulos de documentos a archivos PDF
      const documentFiles = {
        "Contrato de trabajo": "contrato_trabajo.pdf",
        "Certificado médico": "certificado_medico.pdf",
        "Nómina Noviembre": "nomina_noviembre.pdf",
        "Vacaciones 2024": "vacaciones_2024.pdf",
        "Seguro médico": "seguro_medico.pdf",
        "Evaluación anual": "evaluacion_anual.pdf",
      }

      // Obtener nombre del archivo o usar uno por defecto
      const fileName = documentFiles[documentTitle] || "documento.pdf"
      const pdfPath = `/static/pdf/${fileName}`

      // Redirigir a la página de visualización con parámetros
      const viewerUrl = `/ver_documentos/?doc=${encodeURIComponent(documentTitle)}&path=${encodeURIComponent(pdfPath)}`
      window.location.href = viewerUrl
    })
  })

  document.querySelectorAll(".download-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const documentTitle = this.closest(".document-card").querySelector(".document-title").textContent
      alert(`Descargando: ${documentTitle}`)
      // Aquí puedes agregar la lógica para descargar el documento
    })
  })

  function showNoResultsMessage() {
    const container = document.querySelector(".documents-grid")
    const visibleCards = Array.from(documentCards).filter((card) => card.style.display !== "none")

    // Remover mensaje anterior si existe
    const existingMessage = document.querySelector(".no-results-message")
    if (existingMessage) {
      existingMessage.remove()
    }

    // Mostrar mensaje si no hay resultados y hay texto de búsqueda
    if (visibleCards.length === 0 && currentFilters.search) {
      const noResultsDiv = document.createElement("div")
      noResultsDiv.className = "no-results-message"
      noResultsDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
          <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
          <h3 style="margin: 0 0 8px 0; color: #374151;">No se encontraron documentos</h3>
          <p style="margin: 0; font-size: 14px;">No hay documentos que coincidan con "${currentFilters.search}"</p>
        </div>
      `
      container.appendChild(noResultsDiv)
    }
  }

  applyAllFilters()
})
