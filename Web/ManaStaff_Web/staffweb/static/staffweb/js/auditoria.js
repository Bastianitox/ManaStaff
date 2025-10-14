// === Variables del contexto Django ===
const actividadesPorTipo = {{ actividades_por_tipo|safe }};
const actividadesPorDia = {{ actividades_por_dia|safe }};
const descargasPorDocumento = {{ descargas_por_documento|safe }};

// === Gráfico de actividades por tipo ===
if (document.getElementById('actividadesTipoChart')) {
    new Chart(document.getElementById('actividadesTipoChart'), {
        type: 'doughnut',
        data: {
            labels: ['Descargas', 'Cambios Admin', 'Accesos', 'Creaciones', 'Eliminaciones', 'Actualizaciones'],
            datasets: [{
                data: actividadesPorTipo,
                backgroundColor: ['#4e73df', '#e74a3b', '#f6c23e', '#1cc88a', '#36b9cc', '#722fcaff']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// === Gráfico de actividades en el tiempo ===
if (document.getElementById('actividadesTiempoChart')) {
    new Chart(document.getElementById('actividadesTiempoChart'), {
        type: 'line',
        data: {
            labels: actividadesPorDia.labels,
            datasets: [{
                label: 'Actividades',
                data: actividadesPorDia.data,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// === Gráfico de descargas por documento ===
if (document.getElementById('descargasDocumentosChart')) {
    new Chart(document.getElementById('descargasDocumentosChart'), {
        type: 'bar',
        data: {
            labels: descargasPorDocumento.labels,
            datasets: [{
                label: 'Descargas',
                data: descargasPorDocumento.data,
                backgroundColor: '#1cc88a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}

// === Función: abrir modal con detalles ===
function verDetalles(logId) {
    fetch(`/auditoria/detalles/${logId}/`)
        .then(response => response.json())
        .then(data => {
            const contenedor = document.getElementById('contenidoDetalles');
            let html = `
                <div class="detalle-item"><strong>Usuario:</strong> ${data.usuario}</div>
                <div class="detalle-item"><strong>Fecha:</strong> ${data.fecha_hora}</div>
                <div class="detalle-item"><strong>Tipo:</strong> ${data.tipo_accion}</div>
                <div class="detalle-item"><strong>Descripción:</strong> ${data.descripcion}</div>
                <div class="detalle-item"><strong>IP:</strong> ${data.ip_address}</div>
                <div class="detalle-item"><strong>User Agent:</strong> ${data.user_agent}</div>
            `;

            if (data.datos_adicionales) {
                html += `<div class="detalle-item"><strong>Datos Adicionales:</strong>
                         <pre>${JSON.stringify(data.datos_adicionales, null, 2)}</pre></div>`;
            }

            contenedor.innerHTML = html;
            document.getElementById('modalDetalles').style.display = 'block';
        })
        .catch(error => {
            console.error('Error al cargar los detalles:', error);
            alert('❌ Error al cargar los detalles del registro.');
        });
}

// === Función: cerrar modal ===
function cerrarModal() {
    const modal = document.getElementById('modalDetalles');
    modal.style.display = 'none';
    document.getElementById('contenidoDetalles').innerHTML = ''; // limpia el contenido
}

// === Cerrar modal al hacer clic fuera ===
window.onclick = function(event) {
    const modal = document.getElementById('modalDetalles');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

