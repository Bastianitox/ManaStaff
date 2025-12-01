function readAnnouncementsFromTemplate() {
  const el = document.getElementById('announcements-data')
  if (!el) return []
  try {
    const parsed = JSON.parse(el.textContent)
    if (!Array.isArray(parsed)) return []
    return parsed.map((it, idx) => ({
      id: it.id ?? (idx + 1),                            // id (fallback numérico)
      titulo: String(it.titulo || 'Sin título'),         // título visible
      contenido: String(it.contenido || ''),             // cuerpo/desc
      // el backend ya mapea Noticia/Evento -> 'noticia' / 'aviso' para tus tabs
      tipo: String(it.tipo || 'noticia').toLowerCase(),  // categoría para filtros/estilos
      fecha_publicacion: String(it.fecha_publicacion || ''), // fecha tal cual viene
      id_publicador: String(it.id_publicador || ''),     // opcional
    }))
  } catch (e) {
    console.error('[anuncios] JSON inválido', e)
    return []
  }
}

// (NUEVO) Este arreglo ahora viene desde la BD vía Django
const requests = readAnnouncementsFromTemplate()

// Mantén tu lógica tal cual:
let filteredRequests = [...requests]
let currentFilter = 'all'

// DOM elements (igual que ya tienes)
const searchInput = document.getElementById('searchInput')
const filterBtn = document.getElementById('filterBtn')
const statusTabs = document.querySelectorAll('.status-tab')
const requestsGrid = document.getElementById('requestsGrid')
const noResults = document.getElementById('noResults')

// Etiquetas visibles (sin cambios)
const statusLabels = { noticia: 'Noticia', aviso: 'Aviso' }

// Render de tarjetas (cambia SOLO la llamada onclick para pasar string)
function renderRequests(requestsToRender) {
  if (requestsToRender.length === 0) {
    requestsGrid.style.display = 'none'
    noResults.style.display = 'block'
    return
  }
  requestsGrid.style.display = 'grid'
  noResults.style.display = 'none'

  requestsGrid.innerHTML = requestsToRender.map(request => `
    <div class="request-card ${request.tipo}">
      <div class="request-header">
        <div class="request-icon">
          <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"/>
          </svg>
        </div>
        <div class="request-info">
          <h3 class="request-title">${request.titulo}</h3>
          <p class="request-description">${request.contenido}</p>
          <div class="request-meta">
            <span>${request.fecha_publicacion}</span>
          </div>
        </div>
        <div class="status-badge ${request.tipo}">
          ${request.tipo === 'noticia' ? '📰' : request.tipo === 'aviso' ? '⚠️' : '✗'}
          ${statusLabels[request.tipo] || 'Otro'}
        </div>
      </div>
      <!-- 👇 PASAMOS EL ID ENTRE COMILLAS POR SI ES TEXTO (clave Firebase) -->
      <button class="view-details-btn requests-buttons" onclick="viewDetails('${request.id}')">
        Ver detalles
      </button>
    </div>
  `).join('')
}

// Filtro por texto + pestaña (sin cambios)
function filterRequests() {
  const searchTerm = (searchInput.value || '').toLowerCase().trim()
  filteredRequests = requests.filter(r => {
    const matchesSearch =
      r.titulo.toLowerCase().includes(searchTerm) ||
      r.contenido.toLowerCase().includes(searchTerm)
    const matchesStatus = currentFilter === 'all' || r.tipo === currentFilter
    return matchesSearch && matchesStatus
  })
  renderRequests(filteredRequests)
}

// Listeners (sin cambios)
if (searchInput) searchInput.addEventListener('input', filterRequests)
statusTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    statusTabs.forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    currentFilter = tab.dataset.status
    filterRequests()
  })
})

/* ====== DETALLE (igual, solo exponemos al global) ====== */
function viewDetails(requestId) {
  const request = requests.find(r => String(r.id) === String(requestId))
  if (!request) return
  showDetailedView(request)
}
function showDetailedView(request) {
  const main_content_div = document.querySelector('.main-content') || document.body
  const detailView = document.createElement('div')
  detailView.className = 'detail-view'
  detailView.innerHTML = createDetailedViewHTML(request)
  main_content_div.insertAdjacentElement('afterend', detailView)
  if (document.querySelector('.main-content')) {
    document.querySelector('.main-content').style.display = 'none'
  }
}
function createDetailedViewHTML(request) {
  const tipo = request.tipo.charAt(0).toUpperCase() + request.tipo.slice(1)
  return `
    <div class="detail-main-content">
      <div class="detail-header">
        <button class="back-btn" onclick="goBackToList()">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/>
          </svg>
          Volver al listado
        </button>
        <h1>Detalles de ${tipo}</h1>
      </div>
      <div class="detail-card">
        <div class="detail-card-header">
          <div class="detail-icon">
            <svg width="32" height="32" fill="white" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"/>
            </svg>
          </div>
          <div class="detail-title-section">
            <h2>${request.titulo}</h2>
            <div class="status-badge ${request.tipo}">
              ${request.tipo === 'noticia' ? '📰' : request.tipo === 'aviso' ? '⚠️' : '✗'}
              ${statusLabels[request.tipo] || 'Otro'}
            </div>
          </div>
        </div>
        <div class="detail-info-grid">
          <div class="detail-section">
            <h3>Contenido</h3>
            <div class="detail-description">${request.contenido}</div>
          </div>
          <div class="detail-section">
            <h3>Fechas del evento</h3>
            <div class="dates-grid">
              <div class="date-item">
                <div class="date-label">Fecha del evento</div>
                <div class="date-value">${request.fecha_publicacion}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`
}
function goBackToList() {
  const detailView = document.querySelector('.detail-view')
  if (detailView) detailView.remove()
  const main = document.querySelector('.main-content')
  if (main) main.style.display = 'block'
}

// 👇 Hacemos accesibles estas funciones porque las invocamos con onclick en HTML
window.viewDetails = viewDetails
window.goBackToList = goBackToList

// Render inicial + animación (igual)
renderRequests(filteredRequests)
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.request-card')
  cards.forEach((card, index) => {
    card.style.opacity = '0'
    card.style.transform = 'translateY(20px)'
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      card.style.opacity = '1'
      card.style.transform = 'translateY(0)'
    }, index * 100)
  })
})