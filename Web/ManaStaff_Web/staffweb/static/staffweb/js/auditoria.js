// === Gráfico de actividades por tipo ===
if (document.getElementById('actividades_por_tipo')) {
    new Chart(document.getElementById('actividades_por_tipo'), {
        type: 'doughnut',
        data: {
            labels: ['Descargas', 'Accesos', 'Creaciones', 'Eliminaciones', 'Actualizaciones', 'Solicitudes', 'Otro'],
            datasets: [{
                data: actividadesPorTipo,
                backgroundColor: ['#4e73df', '#e74a3b', '#f6c23e', '#1cc88a', '#36b9cc', '#722fcaff', '#ddfe9cff']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// === Gráfico de actividades en el tiempo ===
if (document.getElementById('actividades_por_dia')) {
    new Chart(document.getElementById('actividades_por_dia'), {
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

// === Función: abrir modal con detalles ===
function verDetalles(logId) {
    fetch(`/auditoria/detalles/${logId}/`)
        .then(response => response.json())
        .then(data => {
            const contenedor = document.getElementById('contenidoDetalles');
            let html = `
                <div class="detalle-item"><strong>Rut:</strong> ${data.uid}</div>
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



const loadingOverlay = document.getElementById("loadingOverlay");
let currentPage = 1;
let hasMore = true;
const tbody = document.getElementById("tablaLogsBody");
const btnCargarMas = document.getElementById("btnCargarMas");

async function cargarLogs(reset = false) {
  const tipo_accion = document.getElementById("tipo_accion").value;
  const usuario = document.getElementById("usuario").value;
  const fecha_inicio = document.getElementById("fecha_inicio").value;
  const fecha_fin = document.getElementById("fecha_fin").value;

  if (reset) {
    currentPage = 1;
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center;">
            <div class="spinner"></div>
            </td>
        </tr>
        `;
  }

  const params = new URLSearchParams({
    tipo_accion,
    usuario,
    fecha_inicio,
    fecha_fin,
    page: currentPage
  });

  // Mostrar overlay solo si NO es la primera carga (reset)
  if (!reset) loadingOverlay.classList.add("show");

  try {
    const response = await fetch(`/api_logs_auditoria?${params}`);
    const data = await response.json();

    if (reset) tbody.innerHTML = "";
    
    if (data.logs.length === 0) {
      tbody.innerHTML = `
          <tr>
              <td colspan="7" style="text-align: center; font-style: italic; color: #888;">
                  ❌ No se encontraron registros con los filtros aplicados.
              </td>
          </tr>
      `;
      btnCargarMas.style.display = "none";
      return;
    }

    data.logs.forEach(log => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${log.fecha_hora}</td>
        <td>${log.usuario_nombre}</td>
        <td>${log.rol}</td>
        <td>${log.accion}</td>
        <td>${log.descripcion}</td>
        <td>${log.ip_origen}</td>
        <td><button class="btn-ver-detalles" onclick="verDetalles('${log.id}')">Ver</button></td>
      `;
      tbody.appendChild(tr);
    });

    hasMore = data.has_more;
    btnCargarMas.style.display = hasMore ? "inline-block" : "none";
  } catch (error) {
    console.error("Error cargando logs:", error);
    alert("❌ Ocurrió un error al cargar los registros.");
  } finally {
    // Ocultar overlay siempre que termine la carga
    loadingOverlay.classList.remove("show");
  }
}

// Inicial: carga la primera página
document.addEventListener("DOMContentLoaded", () => {
  cargarLogs(true);
});

// Filtrado dinámico
document.querySelector(".filtros-auditoria").addEventListener("submit", e => {
  e.preventDefault();
  cargarLogs(true);
});

// Cargar más
btnCargarMas.addEventListener("click", () => {
  if (hasMore) {
    currentPage++;
    cargarLogs(false);
  }
});

// === Botón Limpiar ===
document.getElementById("btnLimpiar").addEventListener("click", () => {
  // Limpiar valores del formulario
  document.getElementById("tipo_accion").value = "";
  document.getElementById("usuario").value = "";
  document.getElementById("fecha_inicio").value = "";
  document.getElementById("fecha_fin").value = "";

  // Resetear la tabla
  currentPage = 1;
  hasMore = true;
  tbody.innerHTML = `
        <tr>
        <td colspan="7" style="text-align: center;">
            <div class="spinner"></div>
        </td>
        </tr>
    `;
  // Volver a cargar logs sin filtros
  cargarLogs(true);
});