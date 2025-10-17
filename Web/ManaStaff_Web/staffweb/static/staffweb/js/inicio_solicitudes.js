// Sample data
var requests = [];

async function obtener_solicitudes_usuario() {
  const loader = document.getElementById("loader");
  try {
    loader.style.display = "block";
    const response = await fetch("obtener_solicitudes_usuario")
    if (!response.ok) throw new Error("Error HTTP " + response.status)

    const data = await response.json()
    requests = data.solicitudes

    filteredRequests = [...requests].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
    filterRequests()
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error)
  }finally{
    loader.style.display = "none";
  }
}

let filteredRequests = [...requests];
let currentFilter = 'all';

// DOM elements
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const statusTabs = document.querySelectorAll('.status-tab');
const requestsGrid = document.getElementById('requestsGrid');
const noResults = document.getElementById('noResults');

// Status translations
const statusLabels = {
    aprobada: 'Aprobada',
    pendiente: 'Pendiente',
    rechazada: 'Rechazada'
};


const sortSelect = document.getElementById('sortSelect');

// Escuchar cambio en el select
sortSelect.addEventListener('change', () => {
    filterRequests(); // vuelve a filtrar y renderizar
});

// Render requests
function renderRequests(requestsToRender) {
    if (requestsToRender.length === 0) {
        requestsGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    requestsGrid.style.display = 'grid';
    noResults.style.display = 'none';

    requestsGrid.innerHTML = requestsToRender.map(request => {
        // Create date range display
        let dateRange;

        let inicioValido = request.fecha_inicio && request.fecha_inicio !== "null";
        let finValido = request.fecha_fin && request.fecha_fin !== "null";

        if (!inicioValido && !finValido) {
            dateRange = "En revisión";
        } else if (inicioValido && !finValido) {
            dateRange = `${request.fecha_inicio} - Decisión pendiente`;
        } else if (inicioValido && finValido && request.fecha_inicio === request.fecha_fin) {
            dateRange = request.fecha_inicio;
        } else if (inicioValido && finValido) {
            dateRange = `${request.fecha_inicio} - ${request.fecha_fin}`;
        } else {
            dateRange = "En revisión"; // fallback
        }




        // Create buttons based on status
        const buttons = request.estado === 'pendiente' 
            ? `
                <div style="display: flex; gap: 10px; margin-top: 16px;">
                    <button class="cancel-btn requests-buttons" onclick="cancelRequest('${request.id_solicitud}')">
                        Cancelar
                    </button>
                    <button class="view-details-btn requests-buttons" onclick="viewDetails('${request.id_solicitud}')">
                        Ver detalles
                    </button>
                </div>
            `
            : `
                <button class="view-details-btn requests-buttons" onclick="viewDetails('${request.id_solicitud}')">
                    Ver detalles
                </button>
            `;

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
                        <p class="request-description">${request.descripcion}</p>
                        <div class="request-meta">
                            <span>Enviado: ${request.fecha_solicitud}</span>
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
    }).join('');
    // Animacion despues de aparecer
    const cards = document.querySelectorAll('.request-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

}

// Filter requests
function filterRequests() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredRequests = requests.filter(request => {
        const matchesSearch = request.asunto.toLowerCase().includes(searchTerm) ||
                            request.descripcion.toLowerCase().includes(searchTerm);
        const matchesStatus = currentFilter === 'all' || request.estado === currentFilter;
        
        return matchesSearch && matchesStatus;
    });
    // Orden según filtro
    const sortOrder = sortSelect.value; // 'asc' o 'desc'
    filteredRequests.sort((a, b) => {
        const dateA = new Date(a.fecha_solicitud);
        const dateB = new Date(b.fecha_solicitud);

        if (sortOrder === 'asc') return dateA - dateB;
        else return dateB - dateA;
    });
    renderRequests(filteredRequests);
}

// Event listeners
searchInput.addEventListener('input', filterRequests);

statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.status;
        filterRequests();
    });
});




/* CANCELAR SOLICITUD */

// VARIABLE PARA GUARDAR EL ID DEL USUARIO (RUT)
let requestToDelete = null;

function cancelRequest(requestId) {
  requestToDelete = requestId;
  document.getElementById("confirmModal").classList.remove("hidden");
}

// Cancelar eliminación
document.getElementById("cancelBtn").addEventListener("click", () => {
  requestToDelete = null;
  document.getElementById("confirmModal").classList.add("hidden");
});

// Confirmar eliminación
document.getElementById("confirmBtn").addEventListener("click", () => {
  if (!requestToDelete) return;

  // Mostrar spinner de carga
  document.getElementById("loadingSpinner").classList.remove("hidden");

  fetch(`/cancelar_solicitud_funcion/${requestToDelete}`, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Solicitud cancelada con éxito");

        requests = requests.filter(r => r.id_solicitud !== requestToDelete);

        filterRequests();

      } else {
        alert("Error: " + data.message);
      }
    })
    .catch((error) => console.error("Error:", error))
    .finally(() => {
      requestToDelete = null;
      document.getElementById("confirmModal").classList.add("hidden");
      // Ocultar spinner
      document.getElementById("loadingSpinner").classList.add("hidden");
    });
});



// Helper para CSRF
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


/* DETAILES */

// Updated view details function to show detailed view within same page
function viewDetails(requestId) {
    const request = requests.find(r => r.id_solicitud === requestId);
    if (!request) return;
    
    showDetailedView(request);
}

// Added function to show detailed view
function showDetailedView(request) {
    // Hide main content
    const main_content_div = document.querySelector('.main-content')
    // Create detailed view
    const detailView = document.createElement('div');
    detailView.className = 'detail-view';
    detailView.innerHTML = createDetailedViewHTML(request);
    
    // Add to container
    main_content_div.insertAdjacentElement('afterend',detailView);
    main_content_div.style.display = 'none';
    
}

// Added function to create detailed view HTML
function createDetailedViewHTML(request) {
    // Create timeline phases based on status
    let timelinePhases = [];
    
    // Phase 1: Always present
    timelinePhases.push({
        title: "Solicitud Enviada",
        date: request.fecha_solicitud,
        description: "Tu solicitud ha sido enviada y está en cola para revisión.",
        status: "completed",
        icon: "📤"
    });

    // Validar si fecha_inicio y fecha_fin son "null" (string o null real)
    const inicioValido = request.fecha_inicio && request.fecha_inicio !== "null";
    const finValido = request.fecha_fin && request.fecha_fin !== "null";

    // Si ambas fechas son "null", no agregamos más fases → solo se ve "Solicitud Enviada"
    if (!(inicioValido === false && finValido === false)) {
        // Phase 2: Based on status
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
                description: request.razon,
                status: "rejected",
                icon: "❌"
            });
        }
    }

    return `
        <div class="detail-main-content">
            <!-- Header with back button -->
            <div class="detail-header">
                <button class="back-btn" onclick="goBackToList()">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/>
                    </svg>
                    Volver a Solicitudes
                </button>
                <h1>Detalles de Solicitud</h1>
            </div>

            <!-- Request Details Card -->
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
                            ${request.estado === 'aprobada' ? '✓' : request.estado === 'pendiente' ? '⏳' : '✗'}
                            ${statusLabels[request.estado]}
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
                </div>
            </div>

            <!-- Timeline Section -->
            <div class="timeline-section">
                <h2>Historial de la Solicitud</h2>
                <div class="timeline">
                    ${timelinePhases.map((phase, index) => `
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
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Added function to go back to main list
function goBackToList() {
    const detailView = document.querySelector('.detail-view');
    if (detailView) {
        detailView.remove();
    }
    document.querySelector('.main-content').style.display = 'block';
}















// Add some interactive animations
document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    obtener_solicitudes_usuario()
    // Animate cards on load
    const cards = document.querySelectorAll('.request-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});