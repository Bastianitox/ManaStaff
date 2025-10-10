document.addEventListener("DOMContentLoaded", function () {
  const alerta = document.querySelector(".alerta-exito");
  const imagen_actual = document.getElementById('imagen_actual')
  const imagen_nueva = document.getElementById('imagen_nueva')
  const input_imagen = document.getElementById('imagen_input')
  const btn_cancelar_imagen = document.getElementById('btn_cancelar_imagen')

  input_imagen.addEventListener("change", function () {
    const file = this.files[0];
    imagen_actual.classList.add("hidden");
    imagen_nueva.classList.remove("hidden");

    if (!file) {
      // No hay archivo seleccionado
      imagen_nueva.src = "";
    imagen_actual.classList.add("hidden");
    imagen_nueva.classList.remove("hidden");
      return;
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      alert("El archivo debe ser una imagen (JPG, PNG, GIF)");
      this.value = ""; // limpiar input
      imagen_nueva.src = "";
    imagen_actual.classList.add("hidden");
    imagen_nueva.classList.remove("hidden");
      return;
    }

    if (file.size > maxSize) {
      alert("La imagen no debe superar los 2MB");
      this.value = ""; // limpiar input
      imagen_nueva.src = "";
    imagen_actual.classList.add("hidden");
    imagen_nueva.classList.remove("hidden");
      return;
    }

    // Si pasa la validación, mostrar preview
    const reader = new FileReader();
    reader.onload = function (e) {
      imagen_nueva.src = e.target.result;
    imagen_actual.classList.add("hidden");
    imagen_nueva.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  if (alerta) {
    mostrarToast("✅ Datos guardados correctamente");
  }



  document.getElementById("btn_cancelar_imagen").addEventListener("click", () => {
    imagen_nueva.src = "";
    imagen_nueva.classList.add("hidden");
    imagen_actual.classList.remove("hidden");
    input_imagen.value = "";
  })
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
