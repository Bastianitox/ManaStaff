(function () {
  // ===== Helpers visuales reutilizados =====
  function showAlert(type, message) {
    const successEl = document.getElementById("successAlert");
    const errorEl   = document.getElementById("errorAlert");

    // Ocultar ambas primero
    [successEl, errorEl].forEach(el => {
      if (!el) return;
      el.classList.add("hide");
      el.style.display = "none";
    });

    const alertEl = type === "success" ? successEl : errorEl;
    const msgEl   = type === "success"
      ? document.getElementById("successMessageAlert")
      : document.getElementById("errorMessageAlert");

    msgEl.textContent = message;
    alertEl.style.display = "flex";
    alertEl.classList.remove("hide");

    // autocierre suave
    setTimeout(() => {
      alertEl.classList.add("hide");
      setTimeout(() => {
        alertEl.style.display = "none";
      }, 400);
    }, 5000);
  }

  function toggleSpinner(show) {
    const sp = document.getElementById("loadingSpinner");
    if (!sp) return;
    if (show) {
      sp.classList.remove("hidden");
    } else {
      sp.classList.add("hidden");
    }
  }

  // ===== Utils de datos =====
  function readTemplateJSON(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    try { return JSON.parse(el.textContent); } catch { return fallback; }
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[m]));
  }
  function getCSRFToken() {
    const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  // ===== Estado Global =====
  const BLOQUES = readTemplateJSON("users-docs-data", []);
  const usersContainer = document.getElementById("usersContainer");

  // doc que el user quiere borrar 
  let docToDelete = null;

  // refs modal eliminar
  const $deleteModal      = document.getElementById("deleteModal");
  const $deleteCancelBtn  = document.getElementById("deleteCancelBtn");
  const $deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

  // ===== Render =====
  function renderUsersBlocks(blocks) {
    if (!usersContainer) return;
    usersContainer.innerHTML = blocks.map(b => usuarioBlockHTML(b)).join("");
  }

  function usuarioBlockHTML(b) {
    const baseHref = (window.ROUTES && window.ROUTES.documentosUsuarios) || "#";
    const verMasHref = `${baseHref}?rut=${encodeURIComponent(b.rut)}`;

    const docsHTML = (b.documentos || []).map(d => documentoCardHTML(d)).join("");

    return `
      <div class="bloque-usuario" data-user-id="${esc(b.rut)}">
        <div class="user-header">
          <div class="user-info">
            <h3 class="usuario-nombre">${esc(b.nombre || "Usuario")}</h3>
            <span class="usuario-rut">RUT: ${esc(b.rut_visible || b.rut || "")}</span>
          </div>
          <a class="btn-ver-mas" href="${verMasHref}">Ver más documentos</a>
        </div>
        <div class="documents-grid">
          ${docsHTML || ""}
        </div>
      </div>
    `;
  }

  function documentoCardHTML(d) {
    const estado = String(d.estado || "activo").toLowerCase();
    const titulo = d.titulo || d.nombre || "Documento";
    const fecha  = d.fecha || d.fecha_subida || "";

    const isPending = (estado === "pendiente");

    const docSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`;

    const badgeHTML = `
      <span class="status-badge ${estado}">
        ${estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    `;


    const viewBtnHTML = isPending
      ? `<button class="btn-view disabled" disabled>Ver</button>`
      : `<button class="btn-view" onclick="verDocumento('${esc(d.id || '')}', '${esc(d.url || '')}')">Ver</button>`;

    return `
      <div class="document-card" data-doc-id="${esc(d.id || "")}" data-status="${esc(estado)}">
        <div class="document-header">
          <div class="document-icon">${docSVG}</div>
          <div class="document-info">
            <h4 class="document-title">${esc(titulo)}</h4>
            ${badgeHTML}
          </div>
        </div>

        <div class="document-meta">
          <div class="document-date">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            ${esc(fecha || "")}
          </div>
        </div>

        <div class="document-actions">
          ${viewBtnHTML}
          <button class="btn-modify" onclick="modificarDocumento('${esc(d.id || '')}')">Modificar</button>
          <button class="btn-delete" onclick="eliminarDocumento('${esc(d.id || '')}')">Eliminar</button>
        </div>
      </div>
    `;
  }

  // ===== Acciones públicas ====

  // Ver documento
  window.verDocumento = (id, url) => {
    if (!url) {
      showAlert('error', 'Este documento no tiene archivo cargado todavía.');
      return;
    }
    window.open(url, '_blank');
  };

  // Modificar documento
  window.modificarDocumento = (id) => {
    const tpl = (window.ROUTES && window.ROUTES.modificarDocumento) || "/modificar_documento/DOC_ID";
    const url = tpl.replace("DOC_ID", encodeURIComponent(id));
    const next = window.location.href;
    window.location.href = `${url}?next=${encodeURIComponent(next)}`;
  };

  // Eliminar documento (abrimos modal en vez de confirm nativo)
  window.eliminarDocumento = (id) => {
    if (!id) return;
    docToDelete = id;
    if ($deleteModal) $deleteModal.classList.remove("hidden");
  };


  function performDelete() {
    if (!docToDelete) return;

    toggleSpinner(true);

    const url = (window.ROUTES && window.ROUTES.eliminarDocumento) || "/eliminar_documento";
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken()
      },
      body: JSON.stringify({ doc_id: docToDelete })
    })
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          // eliminar del DOM la tarjeta
          document.querySelectorAll(".document-card").forEach(card => {
            if ((card.getAttribute("data-doc-id") || "") === docToDelete) {
              card.remove();
            }
          });
          showAlert("success", "Documento borrado con éxito.");
        } else {
          showAlert("error", res.error || "No se pudo eliminar el documento.");
        }
      })
      .catch(err => {
        console.error(err);
        showAlert("error", "Error de red al eliminar.");
      })
      .finally(() => {
        docToDelete = null;
        toggleSpinner(false);
        if ($deleteModal) $deleteModal.classList.add("hidden");
      });
  }

  // ===== Init / Listeners =====
  document.addEventListener("DOMContentLoaded", () => {
    // Render inicial
    renderUsersBlocks(BLOQUES);

    // Buscador por nombre / rut
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll(".bloque-usuario").forEach(block => {
          const name = (block.querySelector(".usuario-nombre")?.textContent || "").toLowerCase();
          const rut  = (block.querySelector(".usuario-rut")?.textContent || "").toLowerCase();
          block.style.display = (name.includes(term) || rut.includes(term)) ? "" : "none";
        });
      });
    }

    // Tabs de estado
    const tabs = document.querySelectorAll(".status-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", function () {
        tabs.forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        const selected = this.getAttribute("data-status");

        document.querySelectorAll(".document-card").forEach(card => {
          const st = card.getAttribute("data-status");
          card.style.display = (selected === "todos" || st === selected) ? "" : "none";
        });
      });
    });

    // Modal eliminar: Cancelar
    if ($deleteCancelBtn) {
      $deleteCancelBtn.addEventListener("click", () => {
        docToDelete = null;
        if ($deleteModal) $deleteModal.classList.add("hidden");
      });
    }

    // Modal eliminar: Confirmar (llama performDelete)
    if ($deleteConfirmBtn) {
      $deleteConfirmBtn.addEventListener("click", () => {
        performDelete();
      });
    }
  });
})();