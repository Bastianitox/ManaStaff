const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const logoutButton = document.getElementById("logout-btn");
const sidebar = document.getElementById("sidebar");
const mobileOverlay = document.getElementById("mobileOverlay");

// Toggle menú
mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
    mobileOverlay.classList.toggle("active");
    mobileMenuBtn.classList.toggle("hidden"); 
});

// Cerrar menú al hacer click fuera
mobileOverlay.addEventListener("click", () => {
    sidebar.classList.remove("mobile-open");
    mobileOverlay.classList.remove("active");
    mobileMenuBtn.classList.remove("hidden"); 
});

logoutButton.onclick = function () {
    window.location.href = "/cerrarSesion";
};