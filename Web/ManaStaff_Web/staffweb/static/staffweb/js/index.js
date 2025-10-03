// Eventos
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");

  const loadingOverlay = document.getElementById("loadingOverlay");

  form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Mostrar overlay de carga
      loadingOverlay.classList.add("show");

      const data = {
          email: document.getElementById("email").value.trim(),
          password: document.getElementById("password").value.trim()
      };

        try {
            const response = await fetch("/iniciarSesion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.status === "success") {
                mostrarMensajeExito();
            } else {
                mostrarError(result.message || "Error al iniciar sesión");
                loadingOverlay.classList.remove("show");
            }
        } catch (error) {
            console.error(error);
            loadingOverlay.classList.remove("show");
            mostrarError(result.message || "Error al enviar los datos");
        }

  });
});

// Mensaje de éxito
function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage")
  mensaje.classList.add("show")

  setTimeout(() => {
    mensaje.classList.remove("show")
    loadingOverlay.classList.remove("show");
    setTimeout(() => {
      window.location.href = "/inicio_noticias_eventos"
    }, 300)
  }, 1000)
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
  const modal = document.getElementById("errorModal");
  const texto = document.getElementById("errorMessageText");
  const cerrar = document.getElementById("closeErrorModal");

  texto.textContent = mensaje;
  modal.classList.add("show");

  // Cerrar al hacer click en la "x"
  cerrar.onclick = () => modal.classList.remove("show");

  // Cerrar al hacer click fuera del contenido
  window.onclick = (e) => {
      if (e.target === modal) {
          modal.classList.remove("show");
      }
  };
}
