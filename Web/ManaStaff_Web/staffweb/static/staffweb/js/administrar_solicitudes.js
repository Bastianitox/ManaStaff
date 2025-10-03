// Usuario actual
var currentUser = null;

async function obtener_usuario_actual() {
  try {
    const response = await fetch("/obtener_usuario_actual");
    const data = await response.json();
    if (data.status === "success") {
        currentUser = data.usuario
    } else {
        console.error(data.message);
        return null;
    }
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    return null;
  }
}



// Sample data
var requests = [];

async function obtener_solicitudes_administrar() {
  const loader = document.getElementById("loader");
  const requestsGrid = document.getElementById("requestsGrid");
  const noResults = document.getElementById("noResults");

  try {
    // Mostrar loader y ocultar grid
    loader.style.display = "block";
    requestsGrid.style.display = "none";
    noResults.style.display = "none";

    const response = await fetch("obtener_solicitudes_administrar");
    if (!response.ok) throw new Error("Error HTTP " + response.status);

    const data = await response.json();
    requests = data.solicitudes;

    filteredRequests = [...requests].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

    renderRequests(filteredRequests);

  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
  } finally {
    // Ocultar loader al terminar
    loader.style.display = "none";
  }
}


let filteredRequests = [...requests];
let currentFilter = 'pendiente';

// Traducción de estados
const statusLabels = {
    asignada: 'Asignada',
    pendiente: 'Pendiente',
    cerrada: 'Cerrada'
};

// DOM elements
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const statusTabs = document.querySelectorAll('.status-tab');
const requestsGrid = document.getElementById('requestsGrid');
const noResults = document.getElementById('noResults');

// Renderizado de requests
function renderRequests(requestsToRender) {
    const requestsGrid = document.getElementById("requestsGrid");
    const noResults = document.getElementById("noResults");

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

        // Información de asignación
        let asignacionInfo = "";
        if (request.estado === "pendiente" && request.id_aprobador != "null") {
            if (request.id_aprobador === currentUser.rut) {
                asignacionInfo = `<span class="status-badge asignada_a_mi">👤 Asignada a mí</span>`;
            } else {
                asignacionInfo = `<span class="status-badge asignada">👤 Asignada a ${request.rut_usuario_aprobador_nombre}</span>`;
            }
        }

        // Botones según asignación
        let buttons = "";
        if (request.estado_asignacion === "pendiente") {
            if (request.id_aprobador === "null") {
                buttons = `
                    <button class="view-details-btn requests-buttons btn-asignacion" onclick="assignRequest('${request.id_solicitud}')">
                        Asignarme solicitud
                    </button>
                `;
            } else if (request.id_aprobador === currentUser.rut) {
                buttons = `
                    <button class="view-details-btn requests-buttons btn-detalles" onclick="viewDetails('${request.id_solicitud}')">
                        Ver detalles
                    </button>
                `;
            } else {
                buttons = ""; // asignada a otro → sin botones
            }
        } else if (request.estado_asignacion !== "pendiente" && request.id_aprobador === currentUser.rut) {
            buttons = `
                <button class="view-details-btn requests-buttons" onclick="viewDetails('${request.id_solicitud}')">
                    Ver detalles
                </button>
            `;
        }

        let badgeClass, badgeText;

        if (request.estado_asignacion === 'asignada') {
            if (request.id_aprobador === currentUser.rut) {
                badgeClass = 'asignada_a_mi';
                badgeText = '🕛 Asignada a mí';
            } else {
                badgeClass = 'asignada';
                badgeText = `✗ Asignada a ${request.rut_usuario_aprobador_nombre}`;
            }
        } else if (request.estado_asignacion === 'cerrada') {
            badgeClass = 'cerrada';
            badgeText = '🔒 Cerrada';
        } else {
            badgeClass = 'pendiente';
            badgeText = '⏳ Pendiente';
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
                        <p class="request-description">${request.descripcion}</p>
                        <span class="usuario_solicitud">${request.rut_usuario_solicitud_nombre}</span>
                        <div class="request-meta">
                            <span>Enviado: ${request.fecha_solicitud}</span>
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




const sortSelect = document.getElementById('sortSelect');

// Escuchar cambio en el select
sortSelect.addEventListener('change', () => {
    filterRequests(); // vuelve a filtrar y renderizar
});

function filterRequests() {
    const searchTerm = searchInput.value.toLowerCase();

    filteredRequests = requests.filter(request => {
        const matchesSearch = request.asunto.toLowerCase().includes(searchTerm) ||
                              request.descripcion.toLowerCase().includes(searchTerm) ||
                              request.usuario_solicitud.toLowerCase().includes(searchTerm);

        let matchesFilter = false;
        if (currentFilter === 'pendiente') {
            matchesFilter = request.estado_asignacion === 'pendiente' || request.estado_asignacion === 'asignada';
        } else if (currentFilter === 'asignada') {
            matchesFilter = request.asignado_a === currentUser.rut && request.estado_asignacion === 'asignada';
        } else if (currentFilter === 'cerrada') {
            matchesFilter = request.estado_asignacion === 'cerrada';
        }

        return matchesSearch && matchesFilter;
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






function assignRequest(id_solicitud) {
    const solicitud = requests.find(r => r.id_solicitud === id_solicitud);
    if (!solicitud) return;

    const modal = document.getElementById('assignModal');
    const message = document.getElementById('assignModalMessage');
    const confirmBtn = document.getElementById('assignConfirmBtn');
    const cancelBtn = document.getElementById('assignCancelBtn');

    // Mensaje modal
    message.textContent = `¿Quieres asignarte la solicitud "${solicitud.asunto}"?`;
    modal.style.display = 'flex';

    confirmBtn.onclick = async () => {
        showLoader("Asignando solicitud...");

        try {
            const response = await fetch("asignarme_solicitud/"+id_solicitud)
            if (!response.ok) throw new Error("Error HTTP " + response.status)

            console.log(response)

            const data = await response.json();

            if (data.status === "success") {
                // 🔹 Actualizar solicitud local para reflejar el cambio
                solicitud.id_aprobador = currentUser.rut;
                solicitud.fecha_inicio = new Date().toISOString().slice(0, 19).replace("T", " ");
                solicitud.estado_asignacion = "asignada";

                modal.style.display = "none";
                filterRequests();

                // Mensaje bonito de éxito
                showSuccessMessage(data.mensaje || "Solicitud asignada correctamente.");
            } else {
                alert("⚠️ " + (data.mensaje || "Error desconocido al asignar la solicitud."));
            }
        } catch (error) {
            console.error("Error asignando solicitud:", error);
            alert("Error de conexión al asignar la solicitud.");
        } finally {
            hideLoader();
        }
    };

    cancelBtn.onclick = () => {
        modal.classList.add('vanish');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('vanish');
        }, 300);
    };
}


function showLoader(message = "Procesando solicitud...") {
    const overlay = document.getElementById("loadingOverlay");
    const text = overlay.querySelector(".loading-text");
    text.textContent = message;
    overlay.classList.add("show");
}

function hideLoader() {
    document.getElementById("loadingOverlay").classList.remove("show");
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
            description: "Tu solicitud no pudo ser aprobada en esta ocasión.",
            status: "rejected",
            icon: "❌"
        });
    }

    return `
        <div class="detail-main-content">
            <!-- Header with back button -->
            <div class="detail-header">
                <button class="back-btn" onclick="goBackToList()">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/>
                    </svg>
                    Volver a requests
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
                        <span class="type-badge">${request.usuario_solicitud}</span>
                    </div>

                    <div class="detail-section">
                        <h3>Tipo de Solicitud</h3>
                        <span class="type-badge">${request.tipo}</span>
                    </div>

                    ${request.archivo ? `
                    <div class="detail-section">
                        <h3>Archivos subidos</h3>
                        <div id="uploadedFile" class="uploaded-file">
                            <svg class="file-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                            </svg>
                            <div class="file-info">
                                <a href="/media/Contrato.pdf" target="${request.archivo}" class="file-name">${request.archivo_name}</a>
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
                        <button class="reject-btn" onclick="openConfirmModal('rechazada', '${request.id_solicitud}')">Rechazar</button>
                    </div>

                    <!-- Modal de confirmación -->
                    <div id="confirmModal" class="confirm-modal" style="display:none;">
                        <div class="modal-content">
                            <p id="modalMessage">¿Estás seguro?</p>
                            <div class="modal-buttons">
                                <button id="modalConfirmBtn">Confirmar</button>
                                <button id="modalCancelBtn">Cancelar</button>
                            </div>
                        </div>
                    </div>
                ` : ''}

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


function confirmAction(action, requestId) {
    const request = requests.find(r => r.id_solicitud === requestId);
    if (!request) return;

    // Primera confirmación
    if (confirm(`¿Estás seguro de que quieres ${action === 'aprobada' ? 'aprobar' : 'rechazar'} la solicitud "${request.asunto}"?`)) {
        // Segunda confirmación
        if (confirm('Esta acción es irreversible. ¿Deseas continuar?')) {
            // Actualizamos el estado
            request.estado = action;
            request.estado_asignacion = 'cerrada';
            request.fecha_inicio = new Date().toISOString().split('T')[0]; // ejemplo de fecha de inicio
            request.fecha_fin = new Date().toISOString().split('T')[0];   // ejemplo de fecha de fin

            alert(`Solicitud "${request.asunto}" ${action === 'aprobada' ? 'aprobada' : 'rechazada'} correctamente.`);
            
            // Volver a la lista o refrescar vista
            goBackToList();
        }
    }
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

    confirmBtn.onclick = () => {
        // Actualizamos el estado
        request.estado = action;
        request.estado_asignacion = 'cerrada';
        request.fecha_inicio = new Date().toISOString().split('T')[0];
        request.fecha_fin = new Date().toISOString().split('T')[0];

        modal.style.display = 'none';
        filterRequests(filteredRequests);

        goBackToList();
    };

    cancelBtn.onclick = () => {
        modal.classList.add('vanish');
        setTimeout(() => modal.style.display = 'none', 300);
    };
    
}







document.addEventListener('DOMContentLoaded', () => {

    obtener_usuario_actual()
    // Initial render
    obtener_solicitudes_administrar()


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

