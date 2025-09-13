// Sample data
const requests = [
    {
        id: 1,
        titulo: "Actualización del Sistema ManaStaff",
        contenido: "Se ha implementado la nueva versión 2.1 con mejoras en la gestión de solicitudes y reportes.",
        tipo: "noticia",
        fecha_publicacion: "2025-09-12",
        id_publicador: "admin01"
    },
    {
        id: 2,
        titulo: "Capacitación Obligatoria",
        contenido: "Todos los usuarios deben completar el curso de seguridad informática antes del 30 de septiembre.",
        tipo: "aviso",
        fecha_publicacion: "2025-09-10",
        id_publicador: "rrhh02"
    },
    {
        id: 3,
        titulo: "Nuevo Documento: Reglamento Interno",
        contenido: "Se ha cargado el nuevo reglamento interno de la empresa. Revisen la sección de documentos para descargarlo.",
        tipo: "noticia",
        fecha_publicacion: "2025-09-08",
        id_publicador: "admin01"
    },
    {
        id: 4,
        titulo: "Mantenimiento Programado",
        contenido: "El sistema ManaStaff estará en mantenimiento este sábado de 00:00 a 04:00 hrs. Durante este periodo, no se podrá acceder a la plataforma.",
        tipo: "aviso",
        fecha_publicacion: "2025-09-11",
        id_publicador: "soporte03"
    },
    {
        id: 5,
        titulo: "Reconocimiento a Empleado Destacado",
        contenido: "Felicitaciones a Juan Pérez por su desempeño en la gestión de solicitudes durante agosto. Su compromiso ha sido ejemplar.",
        tipo: "noticia",
        fecha_publicacion: "2025-09-09",
        id_publicador: "rrhh02"
    }
];

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
    noticia: 'Noticia',
    aviso: 'Aviso',
};

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
                return `
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
                                ${statusLabels[request.tipo]}
                            </div>
                        </div>
                        <button class="view-details-btn requests-buttons" onclick="viewDetails(${request.id})">
                            Ver detalles
                        </button>
                    </div>
                `;
            }).join('');
}

// Filter requests
function filterRequests() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredRequests = requests.filter(request => {
        const matchesSearch = request.titulo.toLowerCase().includes(searchTerm) ||
                            request.contenido.toLowerCase().includes(searchTerm);
        const matchesStatus = currentFilter === 'all' || request.tipo === currentFilter;
        
        return matchesSearch && matchesStatus;
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
    const tipo = request.tipo.charAt(0).toUpperCase() + request.tipo.slice(1)
    return `
        <div class="detail-main-content">
            <!-- Header with back button -->
            <div class="detail-header">
                <button class="back-btn" onclick="goBackToList()">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/>
                    </svg>
                    Volver al listado
                </button>
                <h1>Detalles de ${tipo}</h1>
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
                        <h2>${request.titulo}</h2>
                        <div class="status-badge ${request.tipo}">
                            ${request.tipo === 'noticia' ? '📰' : request.tipo === 'aviso' ? '⚠️' : '✗'}
                            ${statusLabels[request.tipo]}
                        </div>
                    </div>
                </div>

                <div class="detail-info-grid">
                    <div class="detail-section">
                        <h3>Contenido</h3>
                        <div class="detail-description">
                            ${request.contenido}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Fechas</h3>
                        <div class="dates-grid">
                            <div class="date-item">
                                <div class="date-label">Fecha de ${tipo}</div>
                                <div class="date-value">${request.fecha_publicacion}</div>
                            </div>
                        </div>
                    </div>
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














// Initial render
renderRequests(filteredRequests);

// Add some interactive animations
document.addEventListener('DOMContentLoaded', () => {
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