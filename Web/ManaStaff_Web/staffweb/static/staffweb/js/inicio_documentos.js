// ------------------------PIN---------------------
document.addEventListener("DOMContentLoaded", () => {
  initPinModal()
  initDocumentsApp()
})

function getCsrfToken() {
  const m = document.cookie.match(/csrftoken=([^;]+)/)
  return m ? m[1] : ""
}

function initPinModal() {
  const section = document.getElementById('documentsSection') || document.querySelector('.documents-section')
  if (!section) return

  const pinInputs    = section.querySelectorAll('.pin-input')
  const submitBtn    = section.querySelector('#pinSubmitBtn')
  const errorMessage = section.querySelector('#pinErrorMessage')
  const modalOverlay = section.querySelector('#pinModalOverlay')

  if (!pinInputs.length || !submitBtn || !modalOverlay) return

  // Bloqueo visual solo de la sección más enfoque al primer input
  section.classList.add('is-locked')
  section.style.overflow = 'hidden'
  pinInputs[0].focus()

  // Manejo de entrada en los inputs auto-avance
  pinInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value

      // Aceptar solo dígitos
      if (!/^\d*$/.test(value)) {
        e.target.value = value.replace(/\D/g, "")
        return
      }

      // Avanza al siguiente input cuando hay 1 dígito
      if (e.target.value.length === 1) {
        if (index < pinInputs.length - 1) {
          pinInputs[index + 1].focus()
        } else {
          input.blur()
        }
      }

      // Limpia estados de error al tipear
      input.classList.remove("error")
      if (errorMessage) errorMessage.classList.remove("show")
    })

    input.addEventListener("keydown", (e) => {
      // vuelve y borra el anterior si está vacío
      if (e.key === "Backspace" && input.value === "" && index > 0) {
        pinInputs[index - 1].focus()
        pinInputs[index - 1].value = ""
      }
      // Navegación con flechas
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault(); pinInputs[index - 1].focus()
      }
      if (e.key === "ArrowRight" && index < pinInputs.length - 1) {
        e.preventDefault(); pinInputs[index + 1].focus()
      }
      // Enter envía
      if (e.key === "Enter") {
        e.preventDefault()
        submitBtn.click()
      }
    })

    // Seleccionar el dígito al enfocar
    input.addEventListener("focus", (e) => e.target.select())

    // reparte los dígitos
    input.addEventListener("paste", (e) => {
      e.preventDefault()
      const numbers = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
      if (!numbers) return
      numbers.split("").forEach((num, i) => {
        if (index + i < pinInputs.length) pinInputs[index + i].value = num
      })
      const nextIndex = Math.min(index + numbers.length, pinInputs.length - 1)
      pinInputs[nextIndex].focus()
    })
  })

  // Verificar PIN
  submitBtn.addEventListener('click', async () => {
    const enteredPin = Array.from(pinInputs).map(i => i.value).join('')
    if (enteredPin.length !== 4) {
      showPinError('Por favor, completa los 4 dígitos')
      return
    }

    try {
      // validar Django/Firebase 
      const resp = await fetch('/validar_pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({ pin: enteredPin }),
        credentials: 'same-origin',
      })

      const data = await resp.json().catch(() => ({}))

      if (resp.ok && data.ok) {
        modalOverlay.style.animation = 'fadeOut 0.2s ease'
        setTimeout(() => {
          modalOverlay.classList.add('hidden')
          section.classList.remove('is-locked')
          section.style.overflow = 'auto'
        }, 200)
      } else {
        showPinError('Código PIN incorrecto. Intenta nuevamente.')
        pinInputs.forEach(i => (i.value = ''))
        pinInputs[0].focus()
      }
    } catch (e) {
      showPinError('No se pudo validar el PIN. Reintenta.')
    }
  })

  function showPinError(msg) {
    if (!errorMessage) return
    const span = errorMessage.querySelector('span') || errorMessage
    span.textContent = msg
    errorMessage.classList.add('show')
    setTimeout(() => errorMessage.classList.remove('show'), 2500)
  }

  section.style.overflow = 'hidden'
}

// ------------------------------------------------------------------------------------



// Animación de fadeOut para el modal
const style = document.createElement("style")
style.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`
document.head.appendChild(style)

// Tabla usada para interpretar meses en español cuando ordenamos por fecha
const SPANISH_MONTHS = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

// Convierte cualquier representación de tamaño (KB/MB/GB) a MB para comparaciones homogéneas
function parseSizeToMb(sizeText) {
  if (!sizeText) {
    return null
  }
  const match = String(sizeText).trim().match(/([\d.,]+)\s*([a-zA-Z]+)?/)
  if (!match) {
    return null
  }
  const value = Number.parseFloat(match[1].replace(',', '.'))
  if (Number.isNaN(value)) {
    return null
  }
  const unit = (match[2] || 'MB').toUpperCase()
  switch (unit) {
    case 'KB':
      return value / 1024
    case 'GB':
      return value * 1024
    default:
      return value
  }
}

// Prepara una fecha comparable a partir del ISO entregado por Django o del texto visible en la tarjeta
function parseDateForSorting(sortDate, fallbackText) {
  if (sortDate) {
    const isoDate = sortDate.length === 10 ? `${sortDate}T00:00:00` : sortDate
    const parsed = new Date(isoDate)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  if (!fallbackText) {
    return null
  }

  const match = String(fallbackText)
    .trim()
    .match(/(\d{1,2})\s+([A-Za-z\u00c1\u00c9\u00cd\u00d3\u00da\u00e1\u00e9\u00f3\u00fa\u00f1]+),\s*(\d{4})/)

  if (!match) {
    return null
  }

  const day = Number.parseInt(match[1], 10)
  const monthName = match[2].toLowerCase()
  const year = Number.parseInt(match[3], 10)
  const monthIndex = SPANISH_MONTHS[monthName]

  if (!Number.isInteger(day) || !Number.isInteger(year) || monthIndex === undefined) {
    return null
  }

  return new Date(year, monthIndex, day)
}

// Normaliza la estructura recibida desde Django para que el resto del código se mantenga igual
function normalizeDocument(doc, index) {
  const normalized = { ...doc }

  normalized.id = doc.id || doc.firebaseId || `doc-${index + 1}`
  normalized.title = (doc.title || doc.nombre || `Documento ${index + 1}`).trim()
  normalized.format = (doc.format || doc.tipo || doc.tipo_documento || 'PDF').toUpperCase()
  normalized.size = doc.size || doc.tamano_archivo || doc.tamano || '0MB'

  const providedSize = Number.isFinite(doc.sizeInMb) ? doc.sizeInMb : parseSizeToMb(doc.size)
  normalized.sizeInMb = Number.isFinite(providedSize) ? providedSize : null

  normalized.date = doc.date || doc.Fecha_emitida || doc.fecha_emitida || ''
  normalized.sortDate = doc.sortDate || null
  normalized.available = Boolean(doc.available && doc.filePath)
  normalized.filePath = doc.filePath || null

  return normalized
}

// Lee el JSON embebido en el template y lo transforma en un arreglo utilizable por el front
function readDocumentsData() {
  const scriptElement = document.getElementById('documents-data')
  if (!scriptElement) {
    console.warn('[docs] JSON data element not found, fallback to empty list')
    return []
  }
  try {
    const parsed = JSON.parse(scriptElement.textContent)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.map((doc, index) => normalizeDocument(doc, index))
  } catch (error) {
    console.error('[docs] Failed to parse documents JSON', error)
    return []
  }
}

// Data base que usarán los filtros y el renderizado en el frontend
const documents = readDocumentsData()

// Inicializa listeners y render cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput')
  const filterBtn = document.getElementById('filterBtn')
  const filterModal = document.getElementById('filterModal')
  const closeFilter = document.getElementById('closeFilter')
  const applyFilters = document.getElementById('applyFilters')
  const clearFilters = document.getElementById('clearFilters')

  const formatFilter = document.getElementById('formatFilter')
  const sortFilter = document.getElementById('sortFilter')
  const sizeFilter = document.getElementById('sizeFilter')

  // Representa los filtros activos en la interfaz
  const state = {
    search: '',
    format: '',
    sort: 'date-desc',
    size: '',
  }

  function getDocumentsContainer() {
    return (
      document.getElementById('documentsGrid') ||
      document.querySelector('.documents-grid') ||
      document.querySelector('.document-grid') ||
      document.querySelector("[class*='document']")
    )
  }

  // Crea cada tarjeta conservando la estética original
  function renderDocuments() {
    const container = getDocumentsContainer()
    if (!container) {
      console.error('[docs] Documents container not found')
      return
    }

    container.innerHTML = ''

    if (!documents.length) {
      showNoResultsMessage(true)
      return
    }

    documents.forEach((doc) => {
      const card = document.createElement('div')
      card.className = 'document-card'
      card.dataset.docId = doc.id
      card.dataset.title = doc.title.toLowerCase()
      card.dataset.format = doc.format
      card.dataset.available = String(doc.available)
      if (doc.sortDate) {
        card.dataset.sortDate = doc.sortDate
      }
      if (Number.isFinite(doc.sizeInMb)) {
        card.dataset.sizeMb = String(doc.sizeInMb)
      }
      if (doc.filePath) {
        card.dataset.fileUrl = doc.filePath
      }

      card.innerHTML = `
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
            Ver
          </button>
          <button class="action-btn download-btn" data-doc-id="${doc.id}">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
            </svg>
            Descargar
          </button>
        </div>
      `

      container.appendChild(card)
    })

    bindCardActions(container)
  }

  // Mantiene los botones Ver/Descargar funcionando con las URLs reales
  function bindCardActions(container) {
    const viewButtons = container.querySelectorAll('.view-btn')
    viewButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const docId = button.dataset.docId
        window.location.href = `/ver_documentos?docId=${docId}` 
      })
    })

    const downloadButtons = container.querySelectorAll('.download-btn')
    downloadButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const docId = button.dataset.docId
        const doc = documents.find((item) => String(item.id) === String(docId))
        if (doc && doc.available && doc.downloadPath) {
          const a = document.createElement('a')
          a.href = doc.downloadPath   //
          a.download = `${doc.title}.${(doc.format || 'pdf').toLowerCase()}`
          document.body.appendChild(a)
          a.click()
          a.remove()
        } else {
          alert('Documento no disponible para descarga.')
        }
      })
    })
  }

  // Aplica búsqueda, formato, tamaño y orden sobre las tarjetas visibles
  function applyAllFilters() {
    const cards = document.querySelectorAll('.document-card')
    const visibleCards = []

    const searchTerms = state.search
      .split(' ')
      .map((term) => term.trim())
      .filter((term) => term.length > 0)

    cards.forEach((card) => {
      const title = card.dataset.title || card.querySelector('.document-title').textContent.toLowerCase()
      const format = card.dataset.format || card.querySelector('.document-format').textContent
      const sizeText = card.querySelector('.document-size').textContent
      const dateText = card.querySelector('.document-date').textContent

      const sizeFromDataset = card.dataset.sizeMb ? Number.parseFloat(card.dataset.sizeMb) : null
      const sizeValue = Number.isFinite(sizeFromDataset)
        ? sizeFromDataset
        : parseSizeToMb(sizeText)

      let showCard = true

      if (searchTerms.length > 0) {
        const matchesSearch = searchTerms.every(
          (term) => title.includes(term) || format.toLowerCase().includes(term),
        )
        if (!matchesSearch) {
          showCard = false
        }
      }

      if (state.format && format !== state.format) {
        showCard = false
      }

      if (state.size && Number.isFinite(sizeValue)) {
        switch (state.size) {
          case 'small':
            if (sizeValue >= 1) showCard = false
            break
          case 'medium':
            if (sizeValue < 1 || sizeValue > 3) showCard = false
            break
          case 'large':
            if (sizeValue <= 3) showCard = false
            break
          default:
            break
        }
      }

      if (showCard) {
        card.style.display = 'block'
        const sortDate = parseDateForSorting(card.dataset.sortDate || '', dateText) || new Date(0)
        const sizeForSort = Number.isFinite(sizeValue) ? sizeValue : 0
        visibleCards.push({
          element: card,
          title,
          date: sortDate,
          size: sizeForSort,
        })
      } else {
        card.style.display = 'none'
      }
    })

    if (visibleCards.length > 0) {
      sortDocuments(visibleCards, state.sort)
    }

    showNoResultsMessage(false)
  }

  function sortDocuments(cards, sortType) {
    const container = getDocumentsContainer()
    if (!container) {
      return
    }

    cards.sort((a, b) => {
      switch (sortType) {
        case 'date-desc':
          return b.date - a.date
        case 'date-asc':
          return a.date - b.date
        case 'name-asc':
          return a.title.localeCompare(b.title, 'es')
        case 'name-desc':
          return b.title.localeCompare(a.title, 'es')
        case 'size-desc':
          return b.size - a.size
        case 'size-asc':
          return a.size - b.size
        default:
          return 0
      }
    })

    cards.forEach((card) => {
      container.appendChild(card.element)
    })
  }

  // Muestra un mensaje cuando no hay documentos o no hay coincidencias
  function showNoResultsMessage(noData) {
    const container = getDocumentsContainer()
    if (!container) {
      return
    }

    const existingMessage = container.querySelector('.no-results-message')
    if (existingMessage) {
      existingMessage.remove()
    }

    const hasVisibleCards = Array.from(container.querySelectorAll('.document-card')).some(
      (card) => card.style.display !== 'none',
    )

    if (noData || (state.search && !hasVisibleCards)) {
      const message = document.createElement('div')
      message.className = 'no-results-message'
      message.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
          <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
          <h3 style="margin: 0 0 8px 0; color: #374151;">No se encontraron documentos</h3>
          <p style="margin: 0; font-size: 14px;">
            ${noData ? 'No hay documentos disponibles.' : `No hay documentos que coincidan con "${state.search}"`}
          </p>
        </div>
      `
      container.appendChild(message)
    }
  }

  // Eventos de UI que actualizan el estado y vuelven a renderizar las tarjetas
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      state.search = event.target.value.toLowerCase().trim()
      applyAllFilters()
    })
  }

  if (filterBtn && filterModal) {
    filterBtn.addEventListener('click', () => {
      filterModal.style.display = 'flex'
      document.body.style.overflow = 'hidden'
    })
  }

  if (closeFilter && filterModal) {
    const closeModal = () => {
      filterModal.style.display = 'none'
      document.body.style.overflow = 'auto'
    }

    closeFilter.addEventListener('click', closeModal)
    filterModal.addEventListener('click', (event) => {
      if (event.target === filterModal) {
        closeModal()
      }
    })

    if (applyFilters) {
      applyFilters.addEventListener('click', () => {
        state.format = formatFilter ? formatFilter.value : ''
        state.sort = sortFilter ? sortFilter.value : 'date-desc'
        state.size = sizeFilter ? sizeFilter.value : ''
        applyAllFilters()
        closeModal()
      })
    }

    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        if (formatFilter) formatFilter.value = ''
        if (sortFilter) sortFilter.value = 'date-desc'
        if (sizeFilter) sizeFilter.value = ''
        if (searchInput) searchInput.value = ''

        state.search = ''
        state.format = ''
        state.sort = 'date-desc'
        state.size = ''

        applyAllFilters()
        closeModal()
      })
    }
  }

  renderDocuments()
  applyAllFilters()
})
