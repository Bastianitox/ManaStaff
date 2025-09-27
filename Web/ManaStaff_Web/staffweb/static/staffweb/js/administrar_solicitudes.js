// Usuario actual
const currentUser = "Juan Pérez"; // <- aquí va el administrador logueado

const requests = [
    { 
        id: 1, 
        asunto: "Revisión de contrato de proveedor", 
        descripcion: "Solicito revisión y validación del contrato de suministro firmado el 15/09.", 
        fecha_solicitud: "2025-09-21", 
        estado: "pendiente", 
        asignado_a: null, 
        usuario_solicitud: "Jose Lopez", 
        estado_asignacion: "pendiente",
        fecha_inicio: null,
        fecha_fin: null,
        archivo: "contrato_proveedor_0925.pdf",
        tipo: "Documentos"
    },
    { 
        id: 2, 
        asunto: "Actualización de software interno", 
        descripcion: "Se requiere instalar la última versión del sistema interno en todos los equipos de la oficina.", 
        fecha_solicitud: "2025-09-20", 
        estado: "pendiente", 
        asignado_a: "Juan Pérez", 
        usuario_solicitud: "Jose Lopez", 
        estado_asignacion: "asignada",
        fecha_inicio: "2025-09-21",
        fecha_fin: "2025-09-25",
        archivo: "instrucciones_instalacion.docx",
        tipo: "TI"
    },
    { 
        id: 3, 
        asunto: "Solicitud de acceso a base de datos", 
        descripcion: "Necesito acceso a la base de datos de ventas para generar informes trimestrales.", 
        fecha_solicitud: "2025-09-19", 
        estado: "pendiente", 
        asignado_a: "María López", 
        usuario_solicitud: "Dayna Castillo", 
        estado_asignacion: "asignada",
        fecha_inicio: "2025-09-20",
        fecha_fin: "2025-09-22",
        archivo: "formulario_acceso_db.pdf",
        tipo: "TI"
    },
    { 
        id: 4, 
        asunto: "Mantenimiento de impresoras", 
        descripcion: "Solicito revisión de impresoras del área administrativa, varias presentan errores de impresión.", 
        fecha_solicitud: "2025-09-22", 
        estado: "pendiente", 
        asignado_a: "Eduardo Guzman", 
        usuario_solicitud: "Anais Maturana", 
        estado_asignacion: "pendiente",
        fecha_inicio: null,
        fecha_fin: null,
        archivo: null,
        tipo: "Mantenimiento"
    },
    { 
        id: 5, 
        asunto: "Reembolso de gastos de viaje", 
        descripcion: "Se solicita reembolso de pasajes y hospedaje del viaje a Santiago el 10/09.", 
        fecha_solicitud: "2025-09-23", 
        estado: "rechazada", 
        asignado_a: "Juan Pérez", 
        usuario_solicitud: "Luciano Torrejon", 
        estado_asignacion: "cerrada",
        fecha_inicio: "2025-09-24",
        fecha_fin: "2025-09-25",
        archivo: "comprobantes_viaje.pdf",
        tipo: "Finanzas"
    },
    { 
        id: 6, 
        asunto: "Cambio de mobiliario oficina", 
        descripcion: "Se solicita reemplazo de sillas y escritorios dañados en el área de contabilidad.", 
        fecha_solicitud: "2025-10-18", 
        estado: "rechazada", 
        asignado_a: "Juan Pérez", 
        usuario_solicitud: "Anais Maturana", 
        estado_asignacion: "cerrada",
        fecha_inicio: "2025-10-19",
        fecha_fin: "2025-10-21",
        archivo: "catalogo_muebles.pdf",
        tipo: "Mantenimiento"
    },
    { 
        id: 7, 
        asunto: "Solicitud de capacitación", 
        descripcion: "Solicito inscripción al curso de actualización en ciberseguridad para el equipo TI.", 
        fecha_solicitud: "2025-11-10", 
        estado: "pendiente", 
        asignado_a: null, 
        usuario_solicitud: "Alejandro Castro", 
        estado_asignacion: "pendiente",
        fecha_inicio: null,
        fecha_fin: null,
        archivo: "programa_curso_ciberseguridad.pdf",
        tipo: "Capacitación"
    },
    { 
        id: 8, 
        asunto: "Solicitud de vacaciones", 
        descripcion: "Solicito vacaciones del 01/06 al 15/06. Favor validar disponibilidad de reemplazo.", 
        fecha_solicitud: "2025-05-18", 
        estado: "pendiente", 
        asignado_a: null, 
        usuario_solicitud: "Luciano Torrejon", 
        estado_asignacion: "pendiente",
        fecha_inicio: null,
        fecha_fin: null,
        archivo: "formulario_vacaciones.pdf",
        tipo: "Recursos Humanos"
    },
    { 
        id: 9, 
        asunto: "Informe de auditoría interna", 
        descripcion: "Se solicita revisión y entrega de informe de auditoría del mes de septiembre.", 
        fecha_solicitud: "2025-10-18", 
        estado: "pendiente", 
        asignado_a: "Juan Pérez", 
        usuario_solicitud: "Anais Maturana", 
        estado_asignacion: "asignada",
        fecha_inicio: "2025-10-19",
        fecha_fin: "2025-10-22",
        archivo: "informe_auditoria_sep.pdf",
        tipo: "Auditoría"
    },
    { 
        id: 10, 
        asunto: "Actualización de manual de procedimientos", 
        descripcion: "Se requiere actualizar el manual de procedimientos internos del área administrativa.", 
        fecha_solicitud: "2025-10-18", 
        estado: "aprobada", 
        asignado_a: "Juan Pérez", 
        usuario_solicitud: "Anais Maturana", 
        estado_asignacion: "cerrada",
        fecha_inicio: "2025-10-19",
        fecha_fin: "2025-10-25",
        archivo: "manual_procedimientos.docx",
        tipo: "Documentos"
    }
];



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
        // Rango de fechas
        let dateRange;
        if (!request.fecha_inicio && !request.fecha_fin) {
            dateRange = "En revisión";
        } else if (request.fecha_inicio && !request.fecha_fin) {
            dateRange = `${request.fecha_inicio} - Decisión pendiente`;
        } else if (request.fecha_inicio === request.fecha_fin) {
            dateRange = request.fecha_inicio;
        } else {
            dateRange = `${request.fecha_inicio} - ${request.fecha_fin}`;
        }

        // Información de asignación
        let asignacionInfo = "";
        if (request.estado === "pendiente" && request.asignado_a) {
            if (request.asignado_a === currentUser) {
                asignacionInfo = `<span class="status-badge asignada_a_mi">👤 Asignada a mí</span>`;
            } else {
                asignacionInfo = `<span class="status-badge asignada">👤 Asignada a ${request.asignado_a}</span>`;
            }
        }

        // Botones según asignación
        let buttons = "";
        if (request.estado_asignacion === "pendiente") {
            if (!request.asignado_a) {
                buttons = `
                    <button class="view-details-btn requests-buttons btn-asignacion" onclick="assignRequest(${request.id})">
                        Asignarme solicitud
                    </button>
                `;
            } else if (request.asignado_a === currentUser) {
                buttons = `
                    <button class="view-details-btn requests-buttons btn-detalles" onclick="viewDetails(${request.id})">
                        Ver detalles
                    </button>
                `;
            } else {
                buttons = ""; // asignada a otro → sin botones
            }
        } else if (request.estado_asignacion !== "pendiente" && request.asignado_a === currentUser) {
            buttons = `
                <button class="view-details-btn requests-buttons" onclick="viewDetails(${request.id})">
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
                        <p class="request-description">${request.descripcion}</p>
                        <span class="usuario_solicitud">${request.usuario_solicitud}</span>
                        <div class="request-meta">
                            <span>Enviado: ${request.fecha_solicitud}</span>
                            <span>📅 ${dateRange}</span>
                        </div>
                        ${asignacionInfo}
                    </div>
                    <div class="status-badge ${request.asignado_a === currentUser && request.estado_asignacion === 'asignada'
                            ? 'asignada_a_mi' 
                            : request.asignado_a != currentUser && request.estado_asignacion == 'asignada'
                                ? 'asignada' 
                                : request.asignado_a === currentUser && request.estado_asignacion != 'asignada' 
                                ? 'cerrada'
                            : 'pendiente'}">
                        ${request.asignado_a === currentUser && request.estado_asignacion === 'asignada'
                            ? '🕛 Asignada a mí' 
                            : request.asignado_a != currentUser && request.estado_asignacion == 'asignada'
                                ? '✗ Asignada' 
                                : request.asignado_a === currentUser && request.estado_asignacion != 'asignada' 
                                ? '🔒 Cerrada'
                            : '⏳ Pendiente'}
                    </div>

                </div>
                <div class="buttons-list">
                    ${buttons}
                </div>
            </div>
        `;
    }).join('');
}

// Render inicial
renderRequests(requests);



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
            matchesFilter = request.asignado_a === currentUser && request.estado_asignacion === 'asignada';
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

// Render inicial
filterRequests(filteredRequests);


// Funciones auxiliares (simples)
function assignRequest(id) {
    const solicitud = requests.find(r => r.id === id);
    if (solicitud) {
        solicitud.asignado_a = currentUser;
        solicitud.estado_asignacion = "asignada";
        filterRequests();
    }
}

/* DETAILES */

// Updated view details function to show detailed view within same page
function viewDetails(requestId) {
    const request = requests.find(r => r.id === requestId);
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
                                <a href="/media/Contrato.pdf" target="_blank" class="file-name">${request.archivo}</a>
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
                            ${request.fecha_vista ? `
                                <div class="date-item">
                                    <div class="date-label">Fecha de Revisión</div>
                                    <div class="date-value">${request.fecha_vista}</div>
                                </div>
                            ` : ''}
                            <div class="date-item">
                                <div class="date-label">Fecha de Inicio</div>
                                <div class="date-value">${request.fecha_inicio}</div>
                            </div>
                            <div class="date-item">
                                <div class="date-label">Fecha de Fin</div>
                                <div class="date-value">${request.fecha_fin}</div>
                            </div>
                        </div>
                    </div>

                    ${request.estado === 'pendiente' ? `
                    <div class="detail-actions" style="margin-top: 16px;">
                        <button class="approve-btn" onclick="openConfirmModal('aprobada', ${request.id})">Aprobar</button>
                        <button class="reject-btn" onclick="openConfirmModal('rechazada', ${request.id})">Rechazar</button>
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
    const request = requests.find(r => r.id === requestId);
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

    const request = requests.find(r => r.id === requestId);
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

