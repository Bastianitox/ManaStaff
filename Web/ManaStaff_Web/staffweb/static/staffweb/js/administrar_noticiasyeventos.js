document.addEventListener("DOMContentLoaded", () => {
  console.log("[v3] administrar_noticiasyeventos.js with filter modal");

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
      card.innerHTML = `
        <h3>${pub.titulo}</h3>
        <p class="fecha">📅 ${pub.fecha || ""}</p>
        <p class="autor">👤 ${pub.autor || ""}</p>
        <p class="contenido">${pub.contenido || ""}</p>
        <div class="acciones-card">
          <a href="/editar_publicacion/${pub.id}" class="btn btn-editar">Editar</a>
          <a href="/eliminar_publicacion/${pub.id}" class="btn btn-eliminar"
             onclick="return confirm('¿Seguro que deseas eliminar esta publicación?');">
            Eliminar
          </a>
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