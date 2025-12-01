document.addEventListener("DOMContentLoaded", () => {
  function showAlert(type, message) {
    const successEl = document.getElementById("successAlert");
    const errorEl   = document.getElementById("errorAlert");

    [successEl, errorEl].forEach(el => {
      if (!el) return;
      el.classList.add("hide");
      el.style.display = "none";
    });

    const alertEl = type === "success" ? successEl : errorEl;
    const msgEl   = type === "success"
      ? document.getElementById("successMessageAlert")
      : document.getElementById("errorMessageAlert");

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
    const input = document.querySelector('#csrf_token_container input');
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
                  "Content-Type": "application/json"
              }
          })
          .then(r => r.json())
          .then(res => {
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
                  publicaciones = publicaciones.filter(p => p.id !== pubToDelete);
                  
                  showAlert("success", "Publicación eliminada con éxito.");
              } else {
                  showAlert("error", res.error || "No se pudo eliminar.");
              }
          })
          .catch(err => {
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
  const statusTabs  = document.querySelectorAll(".status-tab");
  const requestsGrid = document.getElementById("requestsGrid");
  const noResults    = document.getElementById("noResults");

  // Modal filtros
  const $filterBtn    = document.getElementById("filterBtn");
  const $filterModal  = document.getElementById("filterModal");
  const $closeFilter  = document.getElementById("closeFilter");
  const $applyFilters = document.getElementById("applyFilters");
  const $clearFilters = document.getElementById("clearFilters");
  const $sortFilter   = document.getElementById("sortFilter");
  const $typeFilter   = document.getElementById("typeFilter");

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
    (lower(s).normalize ? lower(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "") : lower(s));
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

  // Render
  function fadeIn(element) {
    element.style.opacity = 0;
    element.style.display = "block";
    let opacity = 0;
    const fade = setInterval(() => {
      opacity += 0.05;
      element.style.opacity = opacity;
      if (opacity >= 1) clearInterval(fade);
    }, 30);
  }

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
      card.classList.add("noticia-card", "fade-card");
      card.id = `pub-card-${pub.id}`; 
      
      card.innerHTML = `
        <h3>${pub.titulo}</h3>
        <p class="fecha">📅 ${pub.fecha || ""}</p>
        <p class="autor">👤 ${pub.autor || ""}</p>
        <p class="contenido">${pub.contenido || ""}</p>
        <div class="acciones-card">
          <a href="/editar_publicacion/${pub.id}" class="btn btn-editar">Editar</a>
          
          <button type="button" class="btn btn-eliminar" onclick="abrirModalEliminar('${pub.id}')">
            Eliminar
          </button>
        </div>
      `;
      requestsGrid.appendChild(card);
      fadeIn(card);
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
    $filterModal.addEventListener("click", (e) => { if (e.target === $filterModal) close(); });
  }
  if ($applyFilters) {
    $applyFilters.addEventListener("click", () => {
      filterState.sort = $sortFilter ? $sortFilter.value : "date-desc";
      filterState.tipo = $typeFilter ? ($typeFilter.value || "") : "";
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