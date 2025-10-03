
const capFirst = (s)=>{ s=String(s||""); return s? s.charAt(0).toUpperCase()+s.slice(1): s; };
const escapeHtml = (s)=> String(s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const readJSON = (id, fb)=>{ const el=document.getElementById(id); if(!el) return fb; try{return JSON.parse(el.textContent);}catch{return fb;} };

let currentFilter = "todos";
const usuario   = readJSON("user-data", {nombre:"", rut:""});
const documentos = readJSON("docs-data", []);


document.addEventListener("DOMContentLoaded", () => {
  renderUserInfo();
  renderDocuments();
  initializeFilters();
  initializeSearch();
});


function renderUserInfo() {
  const employeeName = document.getElementById("employeeName");
  const employeeRut  = document.getElementById("employeeRut");
  if (employeeName) employeeName.textContent = usuario.nombre || "—";
  if (employeeRut)  employeeRut.textContent  = usuario.rut || "—";
}


function renderDocuments() {
  const documentsGrid = document.getElementById("documentsGrid");
  if (!documentsGrid) return;

  documentsGrid.innerHTML = "";

  if (!documentos || documentos.length === 0) {
    documentsGrid.innerHTML = `
      <div class="no-documents">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>No hay documentos disponibles para este usuario</p>
      </div>`;
    return;
  }

  documentos.forEach((documento) => {
    const card = document.createElement("div");
    const estado = (documento.estado || "activo").toLowerCase();

    card.className = "document-card";
    card.setAttribute("data-status", estado);
    card.setAttribute("data-nombre", (documento.nombre || "").toLowerCase());

    card.innerHTML = `
      <div class="document-header">
        <h3 class="document-name">${escapeHtml(documento.nombre || "Documento")}</h3>
        <span class="status-badge status-${estado}">
          ${capFirst(estado)}
        </span>
      </div>

      <div class="document-info">
        <div class="info-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>Subido: ${escapeHtml(documento.fecha_subida || "")}</span>
        </div>
      </div>

      <div class="document-actions">
        <button class="action-btn btn-view" onclick="verDocumento('${String(documento.id)}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Ver
        </button>
        <button class="action-btn btn-upload" onclick="subirDocumento('${String(documento.id)}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          Subir
        </button>
        <button class="action-btn btn-edit" onclick="modificarDocumento('${String(documento.id)}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Modificar
        </button>
        <button class="action-btn btn-delete" onclick="eliminarDocumento('${String(documento.id)}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>
    `;

    documentsGrid.appendChild(card);
  });
}


function initializeFilters() {
  const filterButtons = document.querySelectorAll(".status-tab");
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const status = this.getAttribute("data-status");
      if (currentFilter === status) {
        currentFilter = "todos";
        filterButtons.forEach((btn) => btn.classList.remove("active"));
      } else {
        currentFilter = status;
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
      }
      applyFilters();
    });
  });
}

function initializeSearch() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.addEventListener("input", () => applyFilters());
}

function applyFilters() {
  const searchTerm = (document.getElementById("searchInput").value || "").toLowerCase();
  const documentCards = document.querySelectorAll(".document-card");
  documentCards.forEach((card) => {
    const name = card.getAttribute("data-nombre") || "";
    const st   = card.getAttribute("data-status") || "";
    const okSearch = name.includes(searchTerm);
    const okFilter = currentFilter === "todos" || st === currentFilter;
    card.classList.toggle("hidden", !(okSearch && okFilter));
  });
}


function verDocumento(docId) {
  const base = (window.ROUTES && window.ROUTES.verDocumento) || "";
  if (base) {
    window.location.href = `${base}?docId=${encodeURIComponent(docId)}`;
  } else {

    const doc = (documentos || []).find(d => String(d.id) === String(docId));
    if (doc && doc.url) window.open(doc.url, "_blank", "noopener");
  }
}
function subirDocumento(id){ console.log("[v0] Subir documento:", id); }
function modificarDocumento(id){ console.log("[v0] Modificar documento:", id); }
function eliminarDocumento(id){
  console.log("[v0] Eliminar documento:", id);
  if (confirm("¿Estás seguro de que deseas eliminar este documento?")) {
  
  }
}