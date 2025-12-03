document.addEventListener("DOMContentLoaded", () => {
  function showAlert(type, message) {
    const successEl = document.getElementById("successAlert");
    const errorEl = document.getElementById("errorAlert");

    [successEl, errorEl].forEach((el) => {
      if (!el) return;
      el.classList.add("hide");
      el.style.display = "none";
    });

    const alertEl = type === "success" ? successEl : errorEl;
    const msgEl = type === "success" ? document.getElementById("successMessageAlert") : document.getElementById("errorMessageAlert");

    if (msgEl) msgEl.textContent = message;

    if (alertEl) {
      alertEl.style.display = "flex";
      alertEl.classList.remove("hide");
      setTimeout(() => {
        alertEl.classList.add("hide");
        setTimeout(() => {
          alertEl.style.display = "none";
        }, 400);
      }, 3000);
    }
  }

  function toggleSpinner(show) {
    const sp = document.getElementById("loadingSpinner");
    if (!sp) return;
    if (show) sp.classList.remove("hidden");
    else sp.classList.add("hidden");
  }

  function getCSRFToken() {
    const input = document.querySelector("#csrf_token_container input");
    if (input) return input.value;
    const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  let pubToDelete = null;
  const $deleteModal = document.getElementById("deleteModal");
  const $deleteCancelBtn = document.getElementById("deleteCancelBtn");
  const $deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

  // Función global para abrir el modal
  window.abrirModalEliminar = (id) => {
    pubToDelete = id;
    if ($deleteModal) {
      $deleteModal.classList.remove("hidden");
      $deleteModal.style.display = "flex";
    }
  };

  // Evento Cancelar
  if ($deleteCancelBtn) {
    $deleteCancelBtn.addEventListener("click", () => {
      pubToDelete = null;
      if ($deleteModal) {
        $deleteModal.classList.add("hidden");
        $deleteModal.style.display = "none";
      }
    });
  }

  // Evento Confirmar
  if ($deleteConfirmBtn) {
    $deleteConfirmBtn.addEventListener("click", () => {
      if (!pubToDelete) return;

      toggleSpinner(true);

      fetch(`/eliminar_publicacion/${pubToDelete}`, {
        method: "POST",
        headers: {
          "X-CSRFToken": getCSRFToken(),
          "Content-Type": "application/json",
        },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.ok) {
            // Eliminar tarjeta del DOM visualmente
            const card = document.getElementById(`pub-card-${pubToDelete}`);
            if (card) {
              card.style.transition = "opacity 0.5s, transform 0.5s";
              card.style.opacity = "0";
              card.style.transform = "scale(0.9)";
              setTimeout(() => card.remove(), 500);
            }
            // Actualizar lista en memoria para filtros
            publicaciones = publicaciones.filter((p) => p.id !== pubToDelete);

            showAlert("success", "Publicación eliminada con éxito.");
          } else {
            showAlert("error", res.error || "No se pudo eliminar.");
          }
        })
        .catch((err) => {
          console.error(err);
          showAlert("error", "Error de conexión.");
        })
        .finally(() => {
          toggleSpinner(false);
          if ($deleteModal) {
            $deleteModal.classList.add("hidden");
            $deleteModal.style.display = "none";
          }
          pubToDelete = null;
        });
    });
  }

  // DOM
  const searchInput = document.getElementById("searchNoticias");
  const statusTabs = document.querySelectorAll(".status-tab");
  const requestsGrid = document.getElementById("requestsGrid");
  const noResults = document.getElementById("noResults");

  // Modal filtros
  const $filterBtn = document.getElementById("filterBtn");
  const $filterModal = document.getElementById("filterModal");
  const $closeFilter = document.getElementById("closeFilter");
  const $applyFilters = document.getElementById("applyFilters");
  const $clearFilters = document.getElementById("clearFilters");
  const $sortFilter = document.getElementById("sortFilter");
  const $typeFilter = document.getElementById("typeFilter");

  // Datos embebidos
  const dataTag = document.getElementById("publicaciones-data");
  let publicaciones = [];
  try {
    publicaciones = JSON.parse(dataTag.textContent || "[]");
  } catch (err) {
    console.error("Error al parsear JSON de publicaciones:", err);
  }

  // Estado
  let currentFilter = "all";
  const filterState = {
    sort: "date-desc",
    tipo: "",
  };
  let filtered = [...publicaciones];

  // Helpers
  const toStr = (v) => (v ?? "").toString();
  const lower = (s) => toStr(s).toLowerCase().trim();
  const norm = (s) =>
    lower(s).normalize
      ? lower(s)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : lower(s);
  const dateValue = (s) => (s ? new Date(s).getTime() : 0);

  function sortByFecha(list, order) {
    return [...list].sort((a, b) => {
      const da = dateValue(a.fecha);
      const db = dateValue(b.fecha);
      return order === "date-asc" ? da - db : db - da;
    });
  }

  // Llenar tipos dinámicamente
  function buildTypeOptions(list) {
    if (!$typeFilter) return;
    const set = new Set();
    list.forEach((p) => {
      const t = toStr(p.tipo).toLowerCase();
      if (t) set.add(t);
    });
    $typeFilter.innerHTML = '<option value="">Todos</option>';
    Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
        $typeFilter.appendChild(opt);
      });
  }

  buildTypeOptions(publicaciones);

  const statusLabels = { noticia: "Noticia", aviso: "Aviso" };

  function renderPublicaciones(lista) {
    requestsGrid.innerHTML = "";

    if (!lista.length) {
      requestsGrid.style.display = "none";
      noResults.style.display = "block";
      return;
    }
    requestsGrid.style.display = "grid";
    noResults.style.display = "none";

    lista.forEach((pub) => {
      const card = document.createElement("div");
      card.id = `pub-card-${pub.id}`;

      const buttons = `
        <div style="display:flex; gap:10px; margin-top:16px;">
          <button class="cancel-btn requests-buttons" onclick="abrirModalEliminar('${pub.id}')">Eliminar</button>
          <a href="/editar_publicacion/${pub.id}" class="view-details-btn a-btn-request requests-buttons" onclick="viewDetails('${pub.id}')">Modificar</a>
        </div>
      `;

      card.innerHTML = `
        <div class="request-card">
          <div class="request-header">
            <div class="request-icon">
              <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"/>
              </svg>
            </div>
            <div class="request-info">
              <h3 class="request-title">${pub.titulo}</h3>
              <span class="request-description">👤 ${pub.autor || ""}</span>
              <p class="request-description">${pub.contenido || ""}</p>
              <div class="request-meta">
                <span>Fecha de Evento: ${pub.fecha || ""}</span>
              </div>
            </div>
            <div class="status-badge status-badge ${pub.tipo}">
              ${pub.tipo === "noticia" ? "📰" : pub.tipo === "aviso" ? "⚠️" : "✗"}
              ${statusLabels[pub.tipo] || "Desconocido"}
            </div>
          </div>
          ${buttons}
        </div>
      `;
      requestsGrid.appendChild(card);

      // Animación
      document.querySelectorAll(".request-card").forEach((card, i) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        setTimeout(() => {
          card.style.transition = "opacity .5s ease, transform .5s ease";
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, i * 80);
      });
    });
  }

  // Filtro + búsqueda + orden
  function aplicarFiltrosYRender() {
    const q = norm(searchInput.value);

    // búsqueda
    let list = publicaciones.filter((p) => {
      const hay = norm(`${p.titulo} ${p.contenido} ${p.autor}`);
      return hay.includes(q);
    });

    // tabs (tipo visible)
    if (currentFilter !== "all") {
      list = list.filter((p) => toStr(p.tipo).toLowerCase() === currentFilter);
    }

    // modal: tipo
    if (filterState.tipo) {
      list = list.filter((p) => toStr(p.tipo).toLowerCase() === filterState.tipo);
    }

    // modal: orden
    list = sortByFecha(list, filterState.sort);

    filtered = list;
    renderPublicaciones(filtered);
  }

  // Eventos base
  searchInput.addEventListener("input", aplicarFiltrosYRender);

  statusTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      statusTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.status;
      aplicarFiltrosYRender();
    });
  });

  // Modal filtros
  if ($filterBtn && $filterModal) {
    $filterBtn.addEventListener("click", () => {
      $filterModal.style.display = "flex";
      document.body.style.overflow = "hidden";
      // precarga estado actual
      if ($sortFilter) $sortFilter.value = filterState.sort;
      if ($typeFilter) $typeFilter.value = filterState.tipo;
    });
  }
  if ($closeFilter && $filterModal) {
    const close = () => {
      $filterModal.style.display = "none";
      document.body.style.overflow = "auto";
    };
    $closeFilter.addEventListener("click", close);
    $filterModal.addEventListener("click", (e) => {
      if (e.target === $filterModal) close();
    });
  }
  if ($applyFilters) {
    $applyFilters.addEventListener("click", () => {
      filterState.sort = $sortFilter ? $sortFilter.value : "date-desc";
      filterState.tipo = $typeFilter ? $typeFilter.value || "" : "";
      aplicarFiltrosYRender();
      $filterModal.style.display = "none";
      document.body.style.overflow = "auto";
    });
  }
  if ($clearFilters) {
    $clearFilters.addEventListener("click", () => {
      if ($sortFilter) $sortFilter.value = "date-desc";
      if ($typeFilter) $typeFilter.value = "";
      filterState.sort = "date-desc";
      filterState.tipo = "";
      if (searchInput) searchInput.value = "";
      aplicarFiltrosYRender();
      $filterModal.style.display = "none";
      document.body.style.overflow = "auto";
    });
  }

  // Inicial
  aplicarFiltrosYRender();
});
