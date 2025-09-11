// Sample data
const requests = [
    {
        id: 1,
        asunto: "Vacaciones de verano",
        descripcion: "Solicito mis días de vacaciones desde el 24 de agosto hasta el 6 de octubre.",
        estado: "rechazada",
        fecha_solicitud: "8 de agosto, 2025",
        fecha_inicio: "15 Agosto, 2025",
        fecha_fin: "20 Agosto, 2025",
        tipo: "vacaciones"
    },
    {
        id: 2,
        asunto: "Día administrativo",
        descripcion: "Saludos, solicito día administrativo el 10 de octubre para realizar un trámite bancario.",
        estado: "aprobada",
        fecha_solicitud: "8 de agosto, 2025",
        fecha_inicio: "15 Agosto, 2025",
        fecha_fin: "20 Agosto, 2025",
        tipo: "administrativo"
    },
    {
        id: 3,
        asunto: "Permiso médico",
        descripcion: "Solicito permiso médico para cita con especialista el próximo viernes.",
        estado: "pendiente",
        fecha_solicitud: "8 de agosto, 2025",
        fecha_inicio: "15 Agosto, 2025",
        fecha_fin: null,
        tipo: "salud"
    },
    {
        id: 4,
        asunto: "Trabajo remoto",
        descripcion: "Solicito autorización para trabajar desde casa durante la próxima semana.",
        estado: "pendiente",
        fecha_solicitud: "8 de agosto, 2025",
        fecha_inicio: null,
        fecha_fin: null,
        tipo: "equipo"
    },
    {
        id: 5,
        asunto: "Capacitación externa",
        descripcion: "Solicito permiso para asistir a curso de capacitación en desarrollo web.",
        estado: "rechazada",
        fecha_solicitud: "20 de agosto, 2025",
        fecha_inicio: "22 Agosto, 2025",
        fecha_fin: "23 Agosto, 2025",
        tipo: "equipo"
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
    aprobada: 'Aprobada',
    pendiente: 'Pendiente',
    rechazada: 'Rechazada'
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
                const dateRange = request.fecha_inicio === request.fecha_fin 
                    ? request.fecha_inicio 
                    : `${request.fecha_inicio} - ${request.fecha_fin}`;

                // Create buttons based on status
                const buttons = request.estado === 'pendiente' 
                    ? `
                        <div style="display: flex; gap: 10px; margin-top: 16px;">
                            <button class="cancel-btn requests-buttons">
                                Cancelar
                            </button>
                            <button class="view-details-btn requests-buttons">
                                Ver detalles
                            </button>
                        </div>
                    `
                    : `
                        <button class="view-details-btn requests-buttons">
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