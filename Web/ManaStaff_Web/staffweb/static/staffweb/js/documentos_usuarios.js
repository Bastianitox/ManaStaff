// Utils 
function readTemplateJSON(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  try { return JSON.parse(el.textContent); } catch { return fallback; }
}
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, m => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]
  ));
}
function getCSRFToken() {
  const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

//  State 
let currentFilter = "todos";
const USUARIO    = readTemplateJSON("usuario-data", { nombre: "Usuario", rut: "-", rut_visible: "-" });
const DOCUMENTOS = readTemplateJSON("documentos-data", []);

//  Init 
document.addEventListener("DOMContentLoaded", () => {
  renderUserInfo();
  renderDocuments(DOCUMENTOS);
  initializeFilters();
  initializeSearch();
});

//  Render 
function renderUserInfo() {
  const employeeName = document.getElementById("employeeName");
  const employeeRut  = document.getElementById("employeeRut");
  if (employeeName) employeeName.textContent = USUARIO.nombre || "Usuario";
  if (employeeRut)  employeeRut.textContent  = USUARIO.rut_visible || USUARIO.rut || "-";
}

function renderDocuments(lista) {
  const container = document.getElementById("documentsGrid");
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(lista) || lista.length === 0) {
    container.innerHTML = `
      <div class="no-documents">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>No hay documentos disponibles para este usuario</p>
      </div>`;
    return;
  }

  lista.forEach(d => {
    const card  = document.createElement("div");
    const estado = String(d.estado || "activo").toLowerCase();
    const nombre = d.nombre || d.titulo || "Documento";
    const fecha  = d.fecha_subida || d.fecha || "";

    card.className = "document-card";
    card.setAttribute("data-status", estado);
    card.setAttribute("data-nombre", nombre.toLowerCase());
    card.setAttribute("data-doc-id", d.id || "");

    card.innerHTML = `
      <div class="document-header">
        <div class="document-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div class="document-info">
          <h4 class="document-title">${esc(nombre)}</h4>
          <span class="status-badge ${esc(estado)}">
            ${getStatusIcon(estado)}
            ${estado.charAt(0).toUpperCase() + estado.slice(1)}
          </span>
        </div>
      </div>

      <div class="document-meta">
        <div class="document-date">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Subido: ${esc(fecha)}
        </div>
      </div>

      <div class="document-actions">
        <button class="btn-view"   onclick="verDocumento('${esc(d.id || '')}', '${esc(d.url || '')}')">Ver</button>
        <button class="btn-upload" onclick="subirDocumento('${esc(d.id || '')}')">Subir</button>
        <button class="btn-modify" onclick="modificarDocumento('${esc(d.id || '')}')">Modificar</button>
        <button class="btn-delete" onclick="eliminarDocumento('${esc(d.id || '')}')">Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

//  Filtros & Búsqueda 
function initializeFilters() {
  const filterButtons = document.querySelectorAll(".status-tab");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const status = this.getAttribute("data-status");
      if (currentFilter === status) {
        currentFilter = "todos";
        filterButtons.forEach(b => b.classList.remove("active"));
      } else {
        currentFilter = status;
        filterButtons.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
      }
      applyFilters();
    });
  });
}

function initializeSearch() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
}

function applyFilters() {
  const term = (document.getElementById("searchInput").value || "").toLowerCase();
  document.querySelectorAll(".document-card").forEach(card => {
    const n  = card.getAttribute("data-nombre") || "";
    const st = card.getAttribute("data-status") || "";
    const okSearch = n.includes(term);
    const okStatus = currentFilter === "todos" || st === currentFilter;
    card.classList.toggle("hidden", !(okSearch && okStatus));
  });
}

// Acciones 
function verDocumento(id, url) {
  if (url) {
    window.open(url, "_blank");
  } else {
    console.log("[verDocumento] Documento sin URL", id);
    alert("Este documento no tiene archivo cargado todavía.");
  }
}
function subirDocumento(id){ console.log("Subir documento:", id); }
function modificarDocumento(id){ console.log("Modificar documento:", id); }

// Eliminar
function eliminarDocumento(id){
  if (!id) return;
  if (!confirm("¿Estás seguro de eliminar este documento?")) return;

  const endpoint = (window.ROUTES && window.ROUTES.eliminarDocumento) || "/eliminar_documento";
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken()
    },
    body: JSON.stringify({ doc_id: id })
  })
  .then(r => r.json())
  .then(res => {
    if (res.ok) {
      // eliminar la card visualmente
      document.querySelectorAll('.document-card').forEach(card => {
        if ((card.getAttribute('data-doc-id') || '') === id) {
          card.remove();
        }
      });
      alert("Documento eliminado.");
    } else {
      alert("No se pudo eliminar: " + (res.error || "Error desconocido"));
    }
  })
  .catch(() => alert("Error de red al eliminar."));
}

function getStatusIcon(estado) {
  const icons = {
    "activo": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>`,
    "pendiente": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
    </svg>`,
    "caducado": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
    </svg>`
  };
  return icons[String(estado).toLowerCase()] || "";
}