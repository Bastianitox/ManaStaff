document.addEventListener("DOMContentLoaded", function () {
  const alerta = document.querySelector(".alerta-exito");

  if (alerta) {
    mostrarToast("✅ Datos guardados correctamente");
  }
});

// Función para crear y mostrar un toast
function mostrarToast(mensaje) {
  // Crear el contenedor si no existe
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Crear el toast individual
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = mensaje;
  toastContainer.appendChild(toast);

  // Mostrar animación
  setTimeout(() => toast.classList.add("show"), 100);

  // Quitar el toast después de 3 segundos
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
