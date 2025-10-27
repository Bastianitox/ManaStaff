/**  Estado global **/
let currentUser = null;
let requests = [];
let filteredRequests = [];

let currentFilter = "todos";

/** estado del modal de filtros */
const filterState = {
  sort: "date-desc", 
  tipo: "",          
};

/**  DOM refs **/
const searchInput  = document.getElementById("searchInput");
const sortSelect   = document.getElementById("sortSelect");
const statusTabs   = document.querySelectorAll(".status-tab");
const requestsGrid = document.getElementById("requestsGrid");
const noResults    = document.getElementById("noResults");
const loader       = document.getElementById("loader");

/** Refs del modal de filtros**/
const $filterBtn    = document.getElementById("filterBtn");
const $filterModal  = document.getElementById("filterModal");
const $closeFilter  = document.getElementById("closeFilter");
const $applyFilters = document.getElementById("applyFilters");
const $clearFilters = document.getElementById("clearFilters");
const $sortFilter   = document.getElementById("sortFilter");
const $typeFilter   = document.getElementById("typeFilter");

/** Utils **/
const toStr = (v) => (v ?? "").toString();
const lower = (s) => toStr(s).toLowerCase().trim();
const onlyDigits = (s) => toStr(s).replace(/\D+/g, "");
const dateValue = (s) => (s ? new Date(s).getTime() : 0);

// Normaliza texto para búsqueda
function norm(s) {
  const txt = lower(s);
  return txt.normalize ? txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : txt;
}

// Ordena por fecha de solicitud
function sortByFecha(list, order) {
  return [...list].sort((a, b) => {
    const da = dateValue(a.fecha_solicitud);
    const db = dateValue(b.fecha_solicitud);
    return order === "asc" ? da - db : db - da;
  });
}

/** Data fetch **/
async function obtener_usuario_actual() {
  try {
    const r = await fetch("/obtener_usuario_actual");
    const data = await r.json();
    if (data.status === "success") {
      currentUser = data.usuario || null;
    } else {
      console.error(data.message || "No se pudo obtener el usuario actual.");
    }
  } catch (e) {
    console.error("Error al obtener usuario actual:", e);
  }
}

async function obtener_solicitudes_administrar() {
  try {
    loader.style.display = "block";
    requestsGrid.style.display = "none";
    noResults.style.display = "none";

    const resp = await fetch("/obtener_solicitudes_administrar");
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const data = await resp.json();

    const crudos = Array.isArray(data.solicitudes) ? data.solicitudes : [];

    requests = crudos.map((r) => {
      const solicitante = r.rut_usuario_solicitud_nombre || "";
      const tipoNombre  = r.tipo_solicitud_nombre || "";
      const bolsaTexto =
        `${r.asunto || ""} ${r.descripcion || ""} ${solicitante} ${tipoNombre} ${r.id_rut || ""}`;

      return {
        ...r,
        _search: norm(bolsaTexto),
      };
    });

    // Llenar dinámicamente el select de tipos
    buildTypeFilterOptions(requests);

    aplicarFiltrosYRender();
  } catch (e) {
    console.error("Error al obtener las solicitudes:", e);
  } finally {
    loader.style.display = "none";
  }
}

/** Llena el select de tipos con los tipos únicos presentes en la data */
function buildTypeFilterOptions(list) {
  if (!$typeFilter) return;
  const map = new Map();
  list.forEach((r) => {
    const id = toStr(r.tipo_solicitud || "");
    const name = toStr(r.tipo_solicitud_nombre || "");
    if (id && name) map.set(id, name);
  });
  // reset
  $typeFilter.innerHTML = '<option value="">Todos los tipos</option>';
  [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .forEach(([id, name]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = name;
      $typeFilter.appendChild(opt);
    });
}

/** Filtro + Búsqueda + Orden **/
function aplicarFiltrosYRender() {
  const q = norm(searchInput.value);
  const tokens = q.split(/\s+/).filter(Boolean);

  //Búsqueda por palabras
  let list = requests.filter((r) => {
    if (tokens.length === 0) return true;
    return tokens.every((tk) => r._search.includes(tk));
  });

  //Filtro por tab/estado
  list = list.filter((r) => {
    if (currentFilter === "todos") return true;
    if (currentFilter === "pendiente") {
      return r.estado_asignacion === "pendiente";
    }
    if (currentFilter === "asignada") {
      return r.estado_asignacion === "asignada" && currentUser && r.id_aprobador === currentUser.rut;
    }
    if (currentFilter === "cerrada") {
      return r.estado_asignacion === "cerrada" && currentUser && r.id_aprobador === currentUser.rut;
    }
    return true;
  });

  //Filtro por tipo de solicitud (modal)
  if (filterState.tipo) {
    list = list.filter((r) => toStr(r.tipo_solicitud) === filterState.tipo);
  }

  //Orden por fecha
  //   - Prioriza el modal (filterState.sort)
  //   - Si no hay modal, usa sortSelect (compatibilidad)
  let order = "desc";
  if ($sortFilter) {
    order = filterState.sort === "date-asc" ? "asc" : "desc";
  } else if (sortSelect) {
    order = sortSelect.value === "asc" ? "asc" : "desc";
  }
  filteredRequests = sortByFecha(list, order);

  renderRequests(filteredRequests);
}

/*********************  Render  *********************/
function renderRequests(list) {
  if (!list.length) {
    requestsGrid.style.display = "none";
    noResults.style.display = "block";
    return;
  }

  requestsGrid.style.display = "grid";
  noResults.style.display = "none";

  requestsGrid.innerHTML = list
    .map((request) => {
      // Rango de fechas
      const inicioValido = request.fecha_inicio && request.fecha_inicio !== "null";
      const finValido = request.fecha_fin && request.fecha_fin !== "null";

      let dateRange = "En revisión";
      if (!inicioValido && !finValido) dateRange = "En revisión";
      else if (inicioValido && !finValido) dateRange = `${request.fecha_inicio} - Decisión pendiente`;
      else if (inicioValido && finValido && request.fecha_inicio === request.fecha_fin) dateRange = request.fecha_inicio;
      else if (inicioValido && finValido) dateRange = `${request.fecha_inicio} - ${request.fecha_fin}`;

      // Badge
      let badgeClass = "pendiente";
      let badgeText  = "⏳ Pendiente";
      if (request.estado_asignacion === "asignada") {
        const asignadaAMi = currentUser && request.id_aprobador === currentUser.rut;
        badgeClass = asignadaAMi ? "asignada_a_mi" : "asignada";
        badgeText  = asignadaAMi ? "🕛 Asignada a mí" : `✗ Asignada a ${request.rut_usuario_aprobador_nombre || ""}`;
      }
      if (request.estado_asignacion === "cerrada") {
        badgeClass = "cerrada";
        badgeText  = "🔒 Cerrada";
      }

      // Info de asignación
      let asignacionInfo = "";
      if (request.estado_asignacion !== "cerrada" && request.id_aprobador && request.id_aprobador !== "null") {
        if (currentUser && request.id_aprobador === currentUser.rut) {
          asignacionInfo = `<span class="status-badge asignada_a_mi">👤 Asignada a mí</span>`;
        } else {
          asignacionInfo = `<span class="status-badge asignada">👤 Asignada a ${request.rut_usuario_aprobador_nombre || ""}</span>`;
        }
      }

      // Botones
      let buttons = "";
      if (request.estado_asignacion === "pendiente" && (!request.id_aprobador || request.id_aprobador === "null")) {
        buttons = `
          <button class="view-details-btn requests-buttons btn-asignacion" onclick="assignRequest('${request.id_solicitud}')">
            Asignarme solicitud
          </button>
        `;
      } else if (request.estado_asignacion !== "pendiente" && currentUser && request.id_aprobador === currentUser.rut) {
        buttons = `
          <button class="view-details-btn requests-buttons" onclick="viewDetails('${request.id_solicitud}')">
            Ver detalles
          </button>
        `;
      }

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
              <span class="usuario_solicitud">${request.rut_usuario_solicitud_nombre || ""}</span>
              <div class="request-meta">
                <span>Enviado: ${request.fecha_solicitud || ""}</span>
                <span>📅 ${dateRange}</span>
              </div>
              ${asignacionInfo}
            </div>
            <div class="status-badge ${badgeClass}">${badgeText}</div>
          </div>
          <div class="buttons-list">
            ${buttons}
          </div>
        </div>
      `;
    })
    .join("");

  // Animación
  const cards = document.querySelectorAll(".request-card");
  cards.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "opacity .5s ease, transform .5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 60);
  });
}

/*********************  Interacciones base  *********************/
if (sortSelect) sortSelect.addEventListener("change", aplicarFiltrosYRender); // compatibilidad
if (searchInput) searchInput.addEventListener("input", aplicarFiltrosYRender);

statusTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    statusTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.status;
    aplicarFiltrosYRender();
  });
});

/*********************  Interacciones del modal de filtros  *********************/
if ($filterBtn && $filterModal) {
  $filterBtn.addEventListener("click", () => {
    $filterModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    // Preseleccionar según estado actual
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
  $filterModal.addEventListener("click", (e) => {
    if (e.target === $filterModal) close();
  });
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

/*********************  Acciones (asignar / detalles / cerrar)  *********************/
async function assignRequest(id_solicitud) {
  const solicitud = requests.find((r) => r.id_solicitud === id_solicitud);
  if (!solicitud) return;

  const modal = document.getElementById("assignModal");
  const message = document.getElementById("assignModalMessage");
  const confirmBtn = document.getElementById("assignConfirmBtn");
  const cancelBtn = document.getElementById("assignCancelBtn");

  message.textContent = `¿Quieres asignarte la solicitud "${solicitud.asunto}"?`;
  modal.style.display = "flex";

  confirmBtn.onclick = async () => {
    modal.style.display = "none";
    showLoader("Asignando solicitud...");
    await new Promise((r) => requestAnimationFrame(r));
    try {
      const resp = await fetch(`/asignarme_solicitud/${id_solicitud}`);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();

      if (data.status === "success") {
        solicitud.id_aprobador = currentUser?.rut || solicitud.id_aprobador;
        solicitud.fecha_inicio = new Date().toISOString().slice(0, 19).replace("T", " ");
        solicitud.estado_asignacion = "asignada";
        aplicarFiltrosYRender();
      } else {
        alert("⚠️ " + (data.mensaje || "Error al asignar la solicitud."));
      }
    } catch (e) {
      console.error("Error asignando solicitud:", e);
      alert("Error de conexión al asignar la solicitud.");
    } finally {
      hideLoader();
    }
  };

  cancelBtn.onclick = () => {
    modal.classList.add("vanish");
    setTimeout(() => {
      modal.style.display = "none";
      modal.classList.remove("vanish");
    }, 300);
  };
}

// Loader global
function showLoader(message = "Procesando solicitud...") {
  const overlay = document.getElementById("loadingOverlay");
  const text = overlay.querySelector(".loading-text");
  text.textContent = message;
  overlay.classList.add("show");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.remove("show");
}

// Detalles
function viewDetails(requestId) {
  const request = requests.find((r) => r.id_solicitud === requestId);
  if (!request) return;
  showDetailedView(request);
}

// ---------- Vista detallada ----------
function showDetailedView(request) {
  const main_content_div = document.querySelector('.main-content');
  const detailView = document.createElement('div');
  detailView.className = 'detail-view';
  detailView.innerHTML = createDetailedViewHTML(request);
  main_content_div.insertAdjacentElement('afterend', detailView);
  main_content_div.style.display = 'none';
}

function createDetailedViewHTML(request) {
  let timelinePhases = [];

  timelinePhases.push({
    title: "Solicitud Enviada",
    date: request.fecha_solicitud,
    description: "Tu solicitud ha sido enviada y está en cola para revisión.",
    status: "completed",
    icon: "📤"
  });

  if (request.estado === 'pendiente') {
    timelinePhases.push({
      title: "Solicitud en Revisión",
      date: request.fecha_vista || "En proceso",
      description: "Tu solicitud está siendo revisada por el equipo de recursos humanos.",
      status: "current",
      icon: "👀"
    });
    timelinePhases.push({
      title: "Decisión Pendiente",
      date: "Por determinar",
      description: "Esperando decisión final sobre tu solicitud.",
      status: "pending",
      icon: "⏳"
    });
  } else if (request.estado === 'aprobada') {
    timelinePhases.push({
      title: "Solicitud Revisada",
      date: request.fecha_vista || request.fecha_solicitud,
      description: "Tu solicitud ha sido revisada completamente.",
      status: "completed",
      icon: "👀"
    });
    timelinePhases.push({
      title: "Solicitud Aprobada",
      date: request.fecha_inicio,
      description: "¡Felicidades! Tu solicitud ha sido aprobada.",
      status: "completed",
      icon: "✅"
    });
  } else if (request.estado === 'rechazada') {
    timelinePhases.push({
      title: "Solicitud Revisada",
      date: request.fecha_vista || request.fecha_solicitud,
      description: "Tu solicitud ha sido revisada completamente.",
      status: "completed",
      icon: "👀"
    });
    timelinePhases.push({
      title: "Solicitud Rechazada",
      date: request.fecha_inicio,
      description: request.razon && request.razon.trim() !== "" 
        ? request.razon 
        : "Tu solicitud no pudo ser aprobada en esta ocasión.",
      status: "rejected",
      icon: "❌"
    });
  }

  return `
    <div class="detail-main-content">
      <div class="detail-header">
        <button class="back-btn" onclick="goBackToList()">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/>
          </svg>
          Volver a requests
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
              ${request.estado === 'aprobada' ? '✓' : request.estado === 'rechazada' ? '✗' : '⏳'}
              ${request.estado.charAt(0).toUpperCase() + request.estado.slice(1)}
            </div>
          </div>
        </div>

        <div class="detail-info-grid">
          <div class="detail-section">
            <h3>Descripción</h3>
            <div class="detail-description">
              ${request.descripcion}
            </div>
          </div>

          <div class="detail-section">
            <h3>Usuario que solicita</h3>
            <span class="type-badge">${request.rut_usuario_solicitud_nombre}</span>
          </div>

          <div class="detail-section">
            <h3>Tipo de Solicitud</h3>
            <span class="type-badge">${request.tipo_solicitud_nombre}</span>
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
          </div>
          ` : ''}

          <div class="detail-section">
            <h3>Fechas</h3>
            <div class="dates-grid">
              <div class="date-item">
                <div class="date-label">Fecha de Solicitud</div>
                <div class="date-value">${request.fecha_solicitud}</div>
              </div>
              ${request.fecha_vista && request.fecha_vista !== "null" ? `
                <div class="date-item">
                  <div class="date-label">Fecha de Revisión</div>
                  <div class="date-value">${request.fecha_vista}</div>
                </div>
              ` : ''}
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

          ${request.estado === 'pendiente' ? `
          <div class="detail-actions" style="margin-top: 16px;">
            <button class="approve-btn" onclick="openConfirmModal('aprobada', '${request.id_solicitud}')">Aprobar</button>
            <button class="reject-btn"  onclick="openConfirmModal('rechazada', '${request.id_solicitud}')">Rechazar</button>
          </div>

          <div id="confirmModal" class="confirm-modal" style="display:none;">
            <div class="modal-content">
              <p id="modalMessage">¿Estás seguro?</p>
              <div class="modal-buttons">
                <button id="modalConfirmBtn" class="modalConfirmBtn">Confirmar</button>
                <button id="modalCancelBtn"  class="modalCancelBtn">Cancelar</button>
              </div>
            </div>
          </div>

          <div id="reasonModal" class="confirm-modal" style="display:none;">
            <div class="modal-content">
              <h3>Escribe la razón</h3>
              <textarea id="reasonInput" placeholder="Escribe la razón aquí..." rows="4" style="width:100%; resize:none;"></textarea>
              <div id="charCounter" style="font-size: 12px; color: gray; text-align: right;">0 / 10</div>
              <div class="modal-buttons">
                <button id="reasonConfirmBtn" class="modalConfirmBtn" disabled>Enviar</button>
                <button id="reasonCancelBtn"  class="modalCancelBtn">Cancelar</button>
              </div>
            </div>
          </div>
          ` : ''}

        </div>
      </div>

      <div class="timeline-section">
        <h2>Historial de la Solicitud</h2>
        <div class="timeline">
          ${timelinePhases.map((phase) => `
            <div class="timeline-item ${phase.status}">
              <div class="timeline-marker">
                <span class="timeline-icon">${phase.icon}</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h3>${phase.title}</h3>
                  <span class="timeline-date">${phase.date}</span>
                </div>
                <p>${phase.description}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>

    <div id="loadingOverlayCerrar" class="loadingOverlay">
      <div class="spinnerGlobal"></div>
      <p class="loading-text">Procesando solicitud...</p>
    </div>
  `;
}

function goBackToList() {
  const detailView = document.querySelector('.detail-view');
  if (detailView) detailView.remove();
  document.querySelector('.main-content').style.display = 'block';
}

function showLoaderCerrar(message = "Procesando solicitud...") {
  const overlay = document.getElementById("loadingOverlayCerrar");
  const text = overlay.querySelector(".loading-text");
  text.textContent = message;
  overlay.classList.add("show");
}
function hideLoaderCerrar() {
  document.getElementById("loadingOverlayCerrar").classList.remove("show");
}

function openConfirmModal(action, requestId) {
  const modal = document.getElementById('confirmModal');
  const message = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');

  modal.classList.remove('vanish');

  const request = requests.find(r => r.id_solicitud === requestId);
  if (!request) return;

  message.textContent = `¿Deseas ${action === 'aprobada' ? 'aprobar' : 'rechazar'} la solicitud "${request.asunto}"?`;
  modal.style.display = 'flex';

  confirmBtn.onclick = async () => {
    modal.style.display = "none";

    if (action === 'rechazada') {
      openReasonModal(requestId, action);
      return;
    }
    await cerrarSolicitud(requestId, action);
  };

  cancelBtn.onclick = () => {
    modal.classList.add('vanish');
    setTimeout(() => modal.style.display = 'none', 300);
  };
}

function openReasonModal(requestId, action) {
  const modal = document.getElementById('reasonModal');
  const reasonInput = document.getElementById('reasonInput');
  const confirmBtn = document.getElementById('reasonConfirmBtn');
  const cancelBtn = document.getElementById('reasonCancelBtn');
  const counter = document.getElementById('charCounter');

  reasonInput.value = "";
  confirmBtn.disabled = true;
  counter.textContent = "0 / 10";
  modal.style.display = 'flex';

  reasonInput.oninput = () => {
    const length = reasonInput.value.trim().length;
    counter.textContent = `${length} / 10`;
    confirmBtn.disabled = length < 10;
  };

  confirmBtn.onclick = async () => {
    const razon = reasonInput.value.trim();
    if (razon.length < 10) {
      alert("⚠️ La razón debe tener al menos 10 caracteres.");
      return;
    }
    modal.style.display = "none";
    await cerrarSolicitud(requestId, action, razon);
  };

  cancelBtn.onclick = () => {
    modal.classList.add('vanish');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('vanish');
    }, 300);
  };
}

async function cerrarSolicitud(requestId, action, razon = null) {
  showLoaderCerrar("Cerrando solicitud...");
  await new Promise(resolve => requestAnimationFrame(resolve));

  try {
    const url = `/cerrar_solicitud/${requestId}/${action}/${razon}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error HTTP " + response.status);

    const data = await response.json();

    if (data.status === "success") {
      const request = requests.find(r => r.id_solicitud === requestId);
      if (request) {
        request.estado = action;
        request.estado_asignacion = 'cerrada';
        request.fecha_inicio = new Date().toISOString().split('T')[0];
        request.fecha_fin = new Date().toISOString().split('T')[0];
      }
      aplicarFiltrosYRender();
    } else {
      alert("⚠️ " + (data.mensaje || "Error desconocido al cerrar la solicitud."));
    }
  } catch (error) {
    console.error("Error cerrando solicitud:", error);
    alert("Error de conexión al cerrar la solicitud.");
  } finally {
    hideLoaderCerrar();
    goBackToList();
  }
}

/*********************  Inicio  *********************/
document.addEventListener("DOMContentLoaded", async () => {
  await obtener_usuario_actual();
  await obtener_solicitudes_administrar();

  statusTabs.forEach((t) => t.classList.remove("active"));
  const defaultTab = document.querySelector('.status-tab[data-status="todos"]');
  if (defaultTab) defaultTab.classList.add("active");

  aplicarFiltrosYRender();
});