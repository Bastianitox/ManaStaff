(function () {
  // Utils
  function readTemplateJSON(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    try { return JSON.parse(el.textContent); } catch { return fallback; }
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }
  function getCSRFToken() {
    const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Data 
  const BLOQUES = readTemplateJSON('users-docs-data', []);
  const usersContainer = document.getElementById('usersContainer');

  // Render 
  function renderUsersBlocks(blocks) {
    if (!usersContainer) return;
    usersContainer.innerHTML = blocks.map(b => usuarioBlockHTML(b)).join('');
  }

  function usuarioBlockHTML(b) {
    const baseHref = (window.ROUTES && window.ROUTES.documentosUsuarios) || '#';
    const verMasHref = `${baseHref}?rut=${encodeURIComponent(b.rut)}`;
    const docsHTML = (b.documentos || []).map(d => documentoCardHTML(d)).join('');

    return `
      <div class="bloque-usuario" data-user-id="${esc(b.rut)}">
        <div class="user-header">
          <div class="user-info">
            <h3 class="usuario-nombre">${esc(b.nombre || 'Usuario')}</h3>
            <span class="usuario-rut">RUT: ${esc(b.rut_visible || b.rut || '')}</span>
          </div>
          <a class="btn-ver-mas" href="${verMasHref}">Ver más documentos</a>
        </div>
        <div class="documents-grid">
          ${docsHTML || ''}
        </div>
      </div>
    `;
  }

  function documentoCardHTML(d) {
    const estado = String(d.estado || 'activo').toLowerCase();
    const titulo = d.titulo || d.nombre || 'Documento';
    const fecha  = d.fecha || d.fecha_subida || '';

    const docSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`;

    const badge =
      `<span class="status-badge ${estado}">
         ${estado.charAt(0).toUpperCase() + estado.slice(1)}
       </span>`;

    return `
      <div class="document-card" data-doc-id="${esc(d.id || '')}" data-status="${esc(estado)}">
        <div class="document-header">
          <div class="document-icon">${docSVG}</div>
          <div class="document-info">
            <h4 class="document-title">${esc(titulo)}</h4>
            ${badge}
          </div>
        </div>

        <div class="document-meta">
          <div class="document-date">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            ${esc(fecha || '')}
          </div>
        </div>

        <div class="document-actions">
          <button class="btn-view"   onclick="verDocumento('${esc(d.id || '')}', '${esc(d.url || '')}')">Ver</button>
          <button class="btn-modify" onclick="modificarDocumento('${esc(d.id || '')}')">Modificar</button>
          <button class="btn-delete" onclick="eliminarDocumento('${esc(d.id || '')}')">Eliminar</button>
        </div>
      </div>
    `;
  }

  // Acciones
    // ver
  window.verDocumento = (id, url) => {
    if (url) { window.open(url, '_blank'); }
    else { alert('Este documento no tiene archivo cargado todavía.'); }
  };
    // modificar
  window.modificarDocumento = (id) => {
    const tpl = (window.ROUTES && window.ROUTES.modificarDocumento) || '/modificar_documento/DOC_ID';
    const url = tpl.replace('DOC_ID', encodeURIComponent(id));
    const next = window.location.href;
    window.location.href = `${url}?next=${encodeURIComponent(next)}`;
  };
    // eliminar
  window.eliminarDocumento = id => {
    if (!id) return;
    if (!confirm('¿Eliminar este documento definitivamente?')) return;

    const url = (window.ROUTES && window.ROUTES.eliminarDocumento) || '/eliminar_documento';
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify({ doc_id: id })
    })
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        document.querySelectorAll('.document-card').forEach(card => {
          if ((card.getAttribute('data-doc-id') || '') === id) card.remove();
        });
        alert('Documento eliminado.');
      } else {
        alert('No se pudo eliminar: ' + (res.error || 'Error desconocido'));
      }
    })
    .catch(() => alert('Error de red al eliminar.'));
  };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    renderUsersBlocks(BLOQUES);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.bloque-usuario').forEach(block => {
          const name = (block.querySelector('.usuario-nombre')?.textContent || '').toLowerCase();
          const rut  = (block.querySelector('.usuario-rut')?.textContent || '').toLowerCase();
          block.style.display = (name.includes(term) || rut.includes(term)) ? '' : 'none';
        });
      });
    }

    const tabs = document.querySelectorAll('.status-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const selected = this.getAttribute('data-status');
        document.querySelectorAll('.document-card').forEach(card => {
          const st = card.getAttribute('data-status');
          card.style.display = (selected === 'todos' || st === selected) ? '' : 'none';
        });
      });
    });
  });
})();