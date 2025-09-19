const documents = [
  {
    id: 1,
    title: "Contrato de trabajo",
    format: "PDF",
    size: "2.4MB",
    date: "15 Diciembre, 2024",
    available: true, // Solo este documento está disponible
    filePath: "/static/staffweb/pdf/Contrato.pdf",
  },
  {
    id: 2,
    title: "Certificado médico",
    format: "PDF",
    size: "1.8MB",
    date: "10 Diciembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 3,
    title: "Nómina Noviembre",
    format: "PDF",
    size: "950KB",
    date: "30 Noviembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 4,
    title: "Vacaciones 2024",
    format: "PDF",
    size: "1.2MB",
    date: "20 Noviembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 5,
    title: "Seguro médico",
    format: "PDF",
    size: "3.1MB",
    date: "05 Noviembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 6,
    title: "Evaluación anual",
    format: "PDF",
    size: "1.7MB",
    date: "25 Octubre, 2024",
    available: false,
    filePath: null,
  },
]

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM loaded, initializing documents")
  console.log("[v0] Documents array:", documents)

  const searchInput = document.getElementById("searchInput")
  const filterBtn = document.getElementById("filterBtn")
  const filterModal = document.getElementById("filterModal")
  const closeFilter = document.getElementById("closeFilter")
  const applyFilters = document.getElementById("applyFilters")
  const clearFilters = document.getElementById("clearFilters")

  let currentFilters = {
    search: "",
    format: "",
    sort: "date-desc",
    size: "",
  }

  function renderDocuments() {
    console.log("[v0] Rendering documents...")

    const documentsGrid =
      document.getElementById("documentsGrid") ||
      document.querySelector(".documents-grid") ||
      document.querySelector(".document-grid") ||
      document.querySelector("[class*='document']")

    if (!documentsGrid) {
      console.error(
        "[v0] Documents container not found! Available elements:",
        document.querySelectorAll("[id*='document'], [class*='document']"),
      )
      return
    }

    console.log("[v0] Found documents container:", documentsGrid)
    documentsGrid.innerHTML = ""

    documents.forEach((doc) => {
      console.log("[v0] Rendering document:", doc.title)

      const documentCard = document.createElement("div")
      documentCard.className = "document-card"
      documentCard.innerHTML = `
        <div class="document-content">
          <div class="document-icon">
            <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <div class="document-info">
            <h3 class="document-title">${doc.title}</h3>
            <div class="document-details">
              <span class="document-format">${doc.format}</span>
              <span class="document-size">${doc.size}</span>
              <span class="document-date">${doc.date}</span>
            </div>
          </div>
        </div>
        <div class="document-actions">
          <button class="action-btn view-btn" data-doc-id="${doc.id}">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
            </svg>
            Mirar
          </button>
          <button class="action-btn download-btn" data-doc-id="${doc.id}">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
            </svg>
            Descargar
          </button>
        </div>
      `
      documentsGrid.appendChild(documentCard)
    })

    console.log("[v0] Documents rendered, total cards:", documentsGrid.children.length)
    addDocumentEventListeners()
  }

  function addDocumentEventListeners() {
    // --- MIRAR DOCUMENTO ---
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const docId = Number.parseInt(this.getAttribute("data-doc-id"))
        const docObj = documents.find((doc) => doc.id === docId)

        if (docObj && docObj.available) {
          const viewerUrl = `ver_documentos?doc=${encodeURIComponent(docObj.title)}&docId=${docId}`
          window.location.href = viewerUrl
        } else {
          alert("Documento no encontrado o no disponible")
        }
      })
    })

    // --- DESCARGAR DOCUMENTO ---
    document.querySelectorAll(".download-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const docId = Number.parseInt(this.getAttribute("data-doc-id"))
        const docObj = documents.find((doc) => doc.id === docId)

        if (docObj && docObj.available && docObj.filePath) {
          const link = document.createElement("a")
          link.href = docObj.filePath
          link.download = `${docObj.title}.pdf`
          link.target = "_blank"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else {
          alert("Documento no encontrado o no disponible para descarga")
        }
      })
    })
  }

  searchInput.addEventListener("input", function () {
    currentFilters.search = this.value.toLowerCase().trim()
    applyAllFilters()
    showNoResultsMessage()
  })

  filterBtn.addEventListener("click", () => {
    filterModal.style.display = "flex"
    document.body.style.overflow = "hidden"
  })

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
    const documentCards = document.querySelectorAll(".document-card")
    const visibleCards = []

    documentCards.forEach((card) => {
      const title = card.querySelector(".document-title").textContent.toLowerCase()
      const format = card.querySelector(".document-format").textContent
      const sizeText = card.querySelector(".document-size").textContent
      const dateText = card.querySelector(".document-date").textContent

      let showCard = true

      if (currentFilters.search) {
        const searchTerms = currentFilters.search.split(" ").filter((term) => term.length > 0)
        const matchesSearch = searchTerms.every(
          (term) => title.includes(term) || format.toLowerCase().includes(term),
        )
        if (!matchesSearch) {
          showCard = false
        }
      }

      if (currentFilters.format && format !== currentFilters.format) {
        showCard = false
      }

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
    const container =
      document.getElementById("documentsGrid") ||
      document.querySelector(".documents-grid") ||
      document.querySelector(".document-grid") ||
      document.querySelector("[class*='document']")

    if (!container) {
      console.error("[v0] Container not found for sorting")
      return
    }

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

    cards.forEach((card) => {
      container.appendChild(card.element)
    })
  }

  function showNoResultsMessage() {
    const container =
      document.getElementById("documentsGrid") ||
      document.querySelector(".documents-grid") ||
      document.querySelector(".document-grid") ||
      document.querySelector("[class*='document']")

    if (!container) {
      console.error("[v0] Container not found for no results message")
      return
    }

    const visibleCards = Array.from(document.querySelectorAll(".document-card")).filter(
      (card) => card.style.display !== "none",
    )

    const existingMessage = document.querySelector(".no-results-message")
    if (existingMessage) {
      existingMessage.remove()
    }

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

  renderDocuments()
  applyAllFilters()
})