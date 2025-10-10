document.addEventListener("DOMContentLoaded", () => {
    console.log("[v2] administrar_noticiasyeventos.js loaded");

    // Elementos del DOM
    const searchInput = document.getElementById("searchNoticias");
    const sortSelect = document.getElementById("sortSelect");
    const statusTabs = document.querySelectorAll(".status-tab");
    const requestsGrid = document.getElementById("requestsGrid");
    const noResults = document.getElementById("noResults");

    // Leer publicaciones desde el JSON embebido
    const dataTag = document.getElementById("publicaciones-data");
    let publicaciones = [];

    try {
        publicaciones = JSON.parse(dataTag.textContent);
        console.log("Publicaciones cargadas:", publicaciones);
    } catch (err) {
        console.error("Error al parsear JSON de publicaciones:", err);
    }

    // Variables de control
    let currentFilter = "all";
    let filtered = [...publicaciones];

    // Función para aplicar animación fade-in
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

    // Renderizado de publicaciones
    function renderPublicaciones(lista) {
        requestsGrid.innerHTML = "";

        if (lista.length === 0) {
            requestsGrid.style.display = "none";
            noResults.style.display = "block";
            return;
        }

        requestsGrid.style.display = "grid";
        noResults.style.display = "none";

        lista.forEach(pub => {
            const card = document.createElement("div");
            card.classList.add("noticia-card", "fade-card");
            card.innerHTML = `
                <h3>${pub.titulo}</h3>
                <p class="fecha">📅 ${pub.fecha}</p>
                <p class="autor">👤 ${pub.autor}</p>
                <p class="contenido">${pub.contenido}</p>
                <div class="acciones-card">
                    <a href="/editar_publicacion/${pub.id}" class="btn btn-editar">Editar</a>
                    <a href="/eliminar_publicacion/${pub.id}" class="btn btn-eliminar"
                        onclick="return confirm('¿Seguro que deseas eliminar esta publicación?');">
                        Eliminar
                    </a>
                </div>
            `;
            requestsGrid.appendChild(card);
            fadeIn(card); // animación al aparecer
        });
    }

    // Filtrado y orden
    function filtrarPublicaciones() {
        const termino = searchInput.value.toLowerCase();
        const sortOrder = sortSelect.value; // recientes / antiguas

        filtered = publicaciones.filter(pub => {
            const matchesSearch =
                pub.titulo.toLowerCase().includes(termino) ||
                pub.contenido.toLowerCase().includes(termino) ||
                pub.autor.toLowerCase().includes(termino);

            const matchesType =
                currentFilter === "all" ? true : pub.tipo.toLowerCase() === currentFilter;

            return matchesSearch && matchesType;
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            return sortOrder === "antiguas" ? dateA - dateB : dateB - dateA;
        });

        renderPublicaciones(filtered);
    }

    // Eventos
    searchInput.addEventListener("input", filtrarPublicaciones);
    sortSelect.addEventListener("change", filtrarPublicaciones);

    statusTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            statusTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentFilter = tab.dataset.status;
            filtrarPublicaciones();
        });
    });

    // Inicial
    filtrarPublicaciones();
});
