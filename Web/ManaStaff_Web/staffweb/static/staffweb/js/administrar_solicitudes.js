let currentUser = null;       
let requests = [];             
let filteredRequests = [];        

let currentFilter = "todos"; 

// DOM
const searchInput  = document.getElementById("searchInput");
const sortSelect   = document.getElementById("sortSelect");
const statusTabs   = document.querySelectorAll(".status-tab");
const requestsGrid = document.getElementById("requestsGrid");
const noResults    = document.getElementById("noResults");
const loader       = document.getElementById("loader");

// ------------------ Utils ------------------
const toStr = (v) => (v ?? "").toString();
const lower = (s) => toStr(s).toLowerCase().trim();
const onlyDigits = (s) => toStr(s).replace(/\D+/g, "");
const dateValue = (s) => (s ? new Date(s).getTime() : 0);

// Normaliza texto para búsqueda (minúsculas + sin acentos)
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

// ------------------ Data fetch ------------------
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

    const resp = await fetch("obtener_solicitudes_administrar");
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const data = await resp.json();

    const crudos = Array.isArray(data.solicitudes) ? data.solicitudes : [];

    // Normalizamos y creamos un "texto índice" para búsqueda
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

    aplicarFiltrosYRender();
  } catch (e) {
    console.error("Error al obtener las solicitudes:", e);
  } finally {
    loader.style.display = "none";
  }
}

// ------------------ Filtro + Búsqueda + Orden ------------------
function aplicarFiltrosYRender() {
  const q = norm(searchInput.value);
  const tokens = q.split(/\s+/).filter(Boolean);

  //Búsqueda por palabras
  let list = requests.filter((r) => {
    if (tokens.length === 0) return true;
    return tokens.every((tk) => r._search.includes(tk));
  });

  // Filtro por tab/estado
  list = list.filter((r) => {
    if (currentFilter === "todos") {
      return true; 
    }
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

  //Orden
  const order = (sortSelect?.value === "asc") ? "asc" : "desc";
  filteredRequests = sortByFecha(list, order);

  renderRequests(filteredRequests);
}

// ------------------ Render ------------------
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

// ------------------ Interacciones ------------------
sortSelect.addEventListener("change", aplicarFiltrosYRender);
searchInput.addEventListener("input", aplicarFiltrosYRender);

statusTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    statusTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.status; 
    aplicarFiltrosYRender();
  });
});

// ------------------ Acciones (asignar / detalles / cerrar) ------------------
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
      const resp = await fetch("asignarme_solicitud/" + id_solicitud);
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

function showDetailedView(request) {}
function goBackToList() {}
function openConfirmModal(action, requestId) {}
function showLoaderCerrar(message) {}
function hideLoaderCerrar() {}

// ------------------ Inicio ------------------
document.addEventListener("DOMContentLoaded", async () => {
  await obtener_usuario_actual();
  await obtener_solicitudes_administrar();

  statusTabs.forEach((t) => t.classList.remove("active"));
  const defaultTab = document.querySelector('.status-tab[data-status="todos"]');
  if (defaultTab) defaultTab.classList.add("active");

  aplicarFiltrosYRender();
});