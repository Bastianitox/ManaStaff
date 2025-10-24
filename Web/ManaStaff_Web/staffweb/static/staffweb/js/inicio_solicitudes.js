/*********** Estado global ***********/
let requests = [];
let filteredRequests = [];
let currentFilter = "all";

/** Estado de filtros */
const filterState = {
  sort: "date-desc", 
  tipo: "",        
};

/*********** DOM ***********/
const searchInput   = document.getElementById("searchInput");
const statusTabs    = document.querySelectorAll(".status-tab");
const requestsGrid  = document.getElementById("requestsGrid");
const noResults     = document.getElementById("noResults");
const loader        = document.getElementById("loader");

// Modal filtros
const $filterBtn    = document.getElementById("filterBtn");
const $filterModal  = document.getElementById("filterModal");
const $closeFilter  = document.getElementById("closeFilter");
const $applyFilters = document.getElementById("applyFilters");
const $clearFilters = document.getElementById("clearFilters");
const $sortFilter   = document.getElementById("sortFilter");
const $typeFilter   = document.getElementById("typeFilter");

/*********** Utils ***********/
const toStr = (v) => (v ?? "").toString();
const lower = (s) => toStr(s).toLowerCase().trim();
function norm(s) {
  const t = lower(s);
  return t.normalize ? t.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : t;
}
const dateValue = (s) => (s ? new Date(s).getTime() : 0);
function sortByFecha(list, order) {
  return [...list].sort((a, b) => {
    const da = dateValue(a.fecha_solicitud);
    const db = dateValue(b.fecha_solicitud);
    return order === "asc" ? da - db : db - da;
  });
}

/*********** Data ***********/
async function obtener_solicitudes_usuario() {
  try {
    loader.style.display = "block";
    const response = await fetch("obtener_solicitudes_usuario");
    if (!response.ok) throw new Error("Error HTTP " + response.status);
    const data = await response.json();

    const crudos = Array.isArray(data.solicitudes) ? data.solicitudes : [];
    requests = crudos.map((r) => ({
      ...r,
      _search: norm(`${r.asunto || ""} ${r.descripcion || ""} ${r.tipo_solicitud_nombre || ""}`)
    }));

    buildTypeFilterOptions(requests);
    aplicarFiltrosYRender();
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
  } finally {
    loader.style.display = "none";
  }
}

/** Llena el select de tipos con los presentes en las solicitudes */
function buildTypeFilterOptions(list) {
  if (!$typeFilter) return;
  const map = new Map();
  list.forEach((r) => {
    const id = toStr(r.tipo_solicitud || "");
    const name = toStr(r.tipo_solicitud_nombre || "");
    if (id && name) map.set(id, name);
  });
  $typeFilter.innerHTML = '<option value="">Todos los tipos</option>';
  [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"))
    .forEach(([id, name]) => {
      const opt = document.createElement("option");
      opt.value = id; opt.textContent = name;
      $typeFilter.appendChild(opt);
    });
}

/*********** Filtro + búsqueda + orden ***********/
function aplicarFiltrosYRender() {
  const q = norm(searchInput.value);
  const tokens = q.split(/\s+/).filter(Boolean);

  // Búsqueda
  let list = requests.filter((r) => {
    if (!tokens.length) return true;
    return tokens.every((tk) => r._search.includes(tk));
  });

  // Estado
  if (currentFilter !== "all") {
    list = list.filter((r) => r.estado === currentFilter);
  }

  // Tipo 
  if (filterState.tipo) {
    list = list.filter((r) => toStr(r.tipo_solicitud) === filterState.tipo);
  }

  // Orden por fecha
  const order = filterState.sort === "date-asc" ? "asc" : "desc";
  filteredRequests = sortByFecha(list, order);

  renderRequests(filteredRequests);
}

/*********** Render ***********/
const statusLabels = { aprobada: "Aprobada", pendiente: "Pendiente", rechazada: "Rechazada" };

function renderRequests(list) {
  if (!list.length) {
    requestsGrid.style.display = "none";
    noResults.style.display = "block";
    return;
  }
  requestsGrid.style.display = "grid";
  noResults.style.display = "none";

  requestsGrid.innerHTML = list.map((request) => {
    // Rango de fechas
    const inicioValido = request.fecha_inicio && request.fecha_inicio !== "null";
    const finValido    = request.fecha_fin    && request.fecha_fin    !== "null";

    let dateRange = "En revisión";
    if (inicioValido && !finValido) dateRange = `${request.fecha_inicio} - Decisión pendiente`;
    else if (inicioValido && finValido && request.fecha_inicio === request.fecha_fin) dateRange = request.fecha_inicio;
    else if (inicioValido && finValido) dateRange = `${request.fecha_inicio} - ${request.fecha_fin}`;

    const buttons = request.estado === "pendiente"
      ? `
        <div style="display:flex; gap:10px; margin-top:16px;">
          <button class="cancel-btn requests-buttons" onclick="cancelRequest('${request.id_solicitud}')">Cancelar</button>
          <button class="view-details-btn requests-buttons" onclick="viewDetails('${request.id_solicitud}')">Ver detalles</button>
        </div>
      `
      : `<button class="view-details-btn requests-buttons" onclick="viewDetails('${request.id_solicitud}')">Ver detalles</button>`;

    return `
      <div class="request-card ${request.estado}">
        <div class="request-header">
          <div class="request-icon">
            <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"/>
            </svg>
          </div>
          <div class="request-info">
            <h3 class="request-title">${request.asunto}</h3>
            <p class="request-description">${request.descripcion || ""}</p>
            <div class="request-meta">
              <span>Enviado: ${request.fecha_solicitud || ""}</span>
              <span>📅 ${dateRange}</span>
            </div>
          </div>
          <div class="status-badge ${request.estado}">
            ${request.estado === 'aprobada' ? '✓' : request.estado === 'pendiente' ? '⏳' : '✗'}
            ${statusLabels[request.estado]}
          </div>
        </div>
        ${buttons}
      </div>
    `;
  }).join("");

  // Animación
  document.querySelectorAll(".request-card").forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "opacity .5s ease, transform .5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 80);
  });
}

/*********** Buscador y tabs ***********/
if (searchInput) searchInput.addEventListener("input", aplicarFiltrosYRender);

statusTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    statusTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.status;
    aplicarFiltrosYRender();
  });
});

/*********** Modal filtros ***********/
if ($filterBtn && $filterModal) {
  $filterBtn.addEventListener("click", () => {
    $filterModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    if ($sortFilter) $sortFilter.value = filterState.sort;
    if ($typeFilter) $typeFilter.value = filterState.tipo;
  });
}

if ($closeFilter && $filterModal) {
  const close = () => {
    $filterModal.style.display = "none";
    document.body.style.overflow = "auto";
  };
  $closeFilter.addEventListener("click", close);
  $filterModal.addEventListener("click", (e) => { if (e.target === $filterModal) close(); });
}

if ($applyFilters) {
  $applyFilters.addEventListener("click", () => {
    filterState.sort = $sortFilter ? $sortFilter.value : "date-desc";
    filterState.tipo = $typeFilter ? ($typeFilter.value || "") : "";
    aplicarFiltrosYRender();
    $filterModal.style.display = "none";
    document.body.style.overflow = "auto";
  });
}

if ($clearFilters) {
  $clearFilters.addEventListener("click", () => {
    if ($sortFilter) $sortFilter.value = "date-desc";
    if ($typeFilter) $typeFilter.value = "";
    filterState.sort = "date-desc";
    filterState.tipo = "";
    if (searchInput) searchInput.value = "";
    aplicarFiltrosYRender();
    $filterModal.style.display = "none";
    document.body.style.overflow = "auto";
  });
}

/*********** Cancelar solicitud ***********/
let requestToDelete = null;

function cancelRequest(requestId) {
  requestToDelete = requestId;
  document.getElementById("confirmModal").classList.remove("hidden");
}
document.getElementById("cancelBtn").addEventListener("click", () => {
  requestToDelete = null;
  document.getElementById("confirmModal").classList.add("hidden");
});
document.getElementById("confirmBtn").addEventListener("click", () => {
  if (!requestToDelete) return;
  document.getElementById("loadingSpinner").classList.remove("hidden");

  fetch(`/cancelar_solicitud_funcion/${requestToDelete}`, {
    method: "POST",
    headers: { "X-CSRFToken": getCookie("csrftoken") },
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.status === "success") {
        requests = requests.filter((r) => r.id_solicitud !== requestToDelete);
        aplicarFiltrosYRender();
      } else {
        showToast("Error: " + (data.message || "No se pudo cancelar la solicitud"), "error");
      }
    })
    .catch((e) => {
      console.error("Error:", e);
      showToast("Ocurrió un error al cancelar la solicitud.", "error");
    })
    .finally(() => {
      requestToDelete = null;
      document.getElementById("confirmModal").classList.add("hidden");
      document.getElementById("loadingSpinner").classList.add("hidden");
    }); 
});

// CSRF
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

function showToast(message, type = "success", ms = 3000) {
  const container = document.getElementById("toastContainer");
  if (!container) return console.log(message);
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.style.setProperty("--hide-delay", `${Math.max(1000, ms - 250)}ms`);
  el.textContent = message;
  container.appendChild(el);
  // quitar del DOM cuando termine la animación de salida
  const total = ms + 250;
  setTimeout(() => {
    el.remove();
  }, total);
}

/*********** Detalle ***********/
function viewDetails(requestId) {
  const request = requests.find((r) => r.id_solicitud === requestId);
  if (!request) return;
  showDetailedView(request);
}

function showDetailedView(request) {
  const main_content_div = document.querySelector(".main-content");
  const detailView = document.createElement("div");
  detailView.className = "detail-view";
  detailView.innerHTML = createDetailedViewHTML(request);
  main_content_div.insertAdjacentElement("afterend", detailView);
  main_content_div.style.display = "none";
}

function createDetailedViewHTML(request) {
  let timelinePhases = [];
  timelinePhases.push({ title: "Solicitud Enviada", date: request.fecha_solicitud, description: "Tu solicitud ha sido enviada y está en cola para revisión.", status: "completed", icon: "📤" });

  const inicioValido = request.fecha_inicio && request.fecha_inicio !== "null";
  const finValido = request.fecha_fin && request.fecha_fin !== "null";
  if (!(inicioValido === false && finValido === false)) {
    if (request.estado === "pendiente") {
      timelinePhases.push({ title: "Solicitud en Revisión", date: request.fecha_vista || "En proceso", description: "Tu solicitud está siendo revisada por el equipo de recursos humanos.", status: "current", icon: "👀" });
      timelinePhases.push({ title: "Decisión Pendiente", date: "Por determinar", description: "Esperando decisión final sobre tu solicitud.", status: "pending", icon: "⏳" });
    } else if (request.estado === "aprobada") {
      timelinePhases.push({ title: "Solicitud Revisada", date: request.fecha_vista || request.fecha_solicitud, description: "Tu solicitud ha sido revisada completamente.", status: "completed", icon: "👀" });
      timelinePhases.push({ title: "Solicitud Aprobada", date: request.fecha_inicio, description: "¡Felicidades! Tu solicitud ha sido aprobada.", status: "completed", icon: "✅" });
    } else if (request.estado === "rechazada") {
      timelinePhases.push({ title: "Solicitud Revisada", date: request.fecha_vista || request.fecha_solicitud, description: "Tu solicitud ha sido revisada completamente.", status: "completed", icon: "👀" });
      timelinePhases.push({ title: "Solicitud Rechazada", date: request.fecha_inicio, description: request.razon && request.razon.trim() !== "" ? request.razon : "Tu solicitud no pudo ser aprobada en esta ocasión.", status: "rejected", icon: "❌" });
    }
  }

  return `
    <div class="detail-main-content">
      <div class="detail-header">
        <button class="back-btn" onclick="goBackToList()">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/>
          </svg>
          Volver a Solicitudes
        </button>
        <h1>Detalles de Solicitud</h1>
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
            <h2>${request.asunto}</h2>
            <div class="status-badge-large ${request.estado}">
              ${request.estado === "aprobada" ? "✓" : request.estado === "pendiente" ? "⏳" : "✗"}
              ${statusLabels[request.estado]}
            </div>
          </div>
        </div>

        <div class="detail-info-grid">
          <div class="detail-section">
            <h3>Descripción</h3>
            <div class="detail-description">${request.descripcion || ""}</div>
          </div>

          <div class="detail-section">
            <h3>Tipo de Solicitud</h3>
            <span class="type-badge">${request.tipo_solicitud_nombre || ""}</span>
          </div>

          ${request.archivo ? `
          <div class="detail-section">
            <h3>Archivos subidos</h3>
            <div id="uploadedFile" class="uploaded-file">
              <svg class="file-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
              </svg>
              <div class="file-info">
                <a href="${request.archivo}" target="_blank" class="file-name">${request.archivo_name}</a>
              </div>
            </div>
          </div>` : ''}

          <div class="detail-section">
            <h3>Fechas</h3>
            <div class="dates-grid">
              <div class="date-item">
                <div class="date-label">Fecha de Solicitud</div>
                <div class="date-value">${request.fecha_solicitud || ""}</div>
              </div>
              ${request.fecha_vista && request.fecha_vista !== "null" ? `
              <div class="date-item">
                <div class="date-label">Fecha de Revisión</div>
                <div class="date-value">${request.fecha_vista}</div>
              </div>` : '' }
              <div class="date-item">
                <div class="date-label">Fecha de Inicio</div>
                <div class="date-value">${request.fecha_inicio && request.fecha_inicio !== "null" ? request.fecha_inicio : "En espera"}</div>
              </div>
              <div class="date-item">
                <div class="date-label">Fecha de Fin</div>
                <div class="date-value">${request.fecha_fin && request.fecha_fin !== "null" ? request.fecha_fin : "En espera"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-section">
        <h2>Historial de la Solicitud</h2>
        <div class="timeline">
          ${timelinePhases.map((p) => `
            <div class="timeline-item ${p.status}">
              <div class="timeline-marker"><span class="timeline-icon">${p.icon}</span></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h3>${p.title}</h3>
                  <span class="timeline-date">${p.date}</span>
                </div>
                <p>${p.description}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function goBackToList() {
  const detailView = document.querySelector(".detail-view");
  if (detailView) detailView.remove();
  document.querySelector(".main-content").style.display = "block";
}

/*********** Init ***********/
document.addEventListener("DOMContentLoaded", () => {
  obtener_solicitudes_usuario();
});