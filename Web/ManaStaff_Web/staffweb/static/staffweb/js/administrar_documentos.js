// LECTURA DEL JSON DEL TEMPLATE
function getUsersDocsFromTemplate() {
  const el = document.getElementById('users-docs-data')
  if (!el) return []
  try {
    const data = JSON.parse(el.textContent)
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[admin-docs] JSON inválido', e)
    return []
  }
}

const BLOQUES = getUsersDocsFromTemplate()

// RENDER DE BLOQUES
const usersContainer = document.getElementById('usersContainer')

// Renderiza todos los usuarios con su grilla de documentos
function renderUsersBlocks(blocks) {
  if (!usersContainer) return
  usersContainer.innerHTML = blocks.map(b => blockUsuarioHTML(b)).join('')
}

function blockUsuarioHTML(b) {
  const docsHTML = (b.documentos || []).map(d => documentCardHTML(d)).join('')

  return `
    <div class="bloque-usuario" data-user-id="${b.rut}">
      <div class="user-header">
        <div class="user-info">
          <h3 class="usuario-nombre">${escapeHTML(b.nombre || 'Usuario')}</h3>
          <span class="usuario-rut">RUT: ${escapeHTML(b.rut_visible || b.rut || '')}</span>
        </div>
        <button class="btn-ver-mas" onclick="verTodosDocumentos('${b.rut}')">Ver más documentos</button>
      </div>

      <div class="documents-grid">
        ${docsHTML || '<!-- sin documentos -->'}
      </div>
    </div>
  `
}

// Tarjeta de documento con las mismas clases y data-status
function documentCardHTML(d) {
  const estado = (d.estado || 'activo').toLowerCase() 
  const fecha = d.fecha || ''
  const titulo = d.titulo || 'Documento'
  const id = d.id

  // icono de estado 
  const badgeIcon =
    estado === 'activo'
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
           <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
         </svg>`
      : estado === 'pendiente'
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
           <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
           <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
         </svg>`

  return `
    <div class="document-card" data-status="${estado}">
      <div class="document-header">
        <div class="document-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div class="document-info">
          <h4 class="document-title">${escapeHTML(titulo)}</h4>
          <span class="status-badge ${estado}">
            ${badgeIcon}
            ${estado.charAt(0).toUpperCase() + estado.slice(1)}
          </span>
        </div>
      </div>

      <div class="document-meta">
        <div class="document-date">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Subido: ${escapeHTML(fecha)}
        </div>
      </div>

      <div class="document-actions">
        <button class="btn-view" onclick="verDocumento('${id}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Ver
        </button>
        <button class="btn-upload" onclick="subirDocumento('${id}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          Subir
        </button>
        <button class="btn-modify" onclick="modificarDocumento('${id}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Modificar
        </button>
        <button class="btn-delete" onclick="eliminarDocumento('${id}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  `
}

// Escape básico para evitar inyección en texto
function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]))
}

//  TUS ACCIONES
function verTodosDocumentos(userId) { window.location.href = `/documentos/usuario/${userId}/todos` }
function verDocumento(docId)       { console.log("Ver documento:", docId) }
function subirDocumento(docId)     { console.log("Subir documento:", docId) }
function modificarDocumento(docId) { console.log("Modificar documento:", docId) }
function eliminarDocumento(docId)  {
  console.log("Eliminar documento:", docId)
  if (confirm("¿Estás seguro de que deseas eliminar este documento?")) { /* llamar a backend */ }
}
function crearDocumento()          { console.log("Crear nuevo documento") }


window.verTodosDocumentos = verTodosDocumentos
window.verDocumento = verDocumento
window.subirDocumento = subirDocumento
window.modificarDocumento = modificarDocumento
window.eliminarDocumento = eliminarDocumento
window.crearDocumento = crearDocumento

//  BUSCADOR Y TABS 
document.addEventListener("DOMContentLoaded", () => {
  renderUsersBlocks(BLOQUES)

  // Buscador por nombre o RUT 
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase()
      const blocks = document.querySelectorAll(".bloque-usuario")
      blocks.forEach((block) => {
        const name = block.querySelector(".usuario-nombre")?.textContent.toLowerCase() || ""
        const rut  = block.querySelector(".usuario-rut")?.textContent.toLowerCase() || ""
        block.style.display = (name.includes(term) || rut.includes(term)) ? "block" : "none"
      })
    })
  }

  // Tabs por data-status
  const statusTabs = document.querySelectorAll(".status-tab")
  statusTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      statusTabs.forEach((t) => t.classList.remove("active"))
      this.classList.add("active")
      const selected = this.getAttribute("data-status")

      // Mostrar/ocultar tarjetas según estado seleccionado
      document.querySelectorAll(".document-card").forEach((card) => {
        const st = card.getAttribute("data-status")
        card.style.display = (st === selected) ? "block" : "none"
      })
    })
  })
})