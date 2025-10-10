
// --- Lógica del formulario ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cambiar-contrasena");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const actual = document.getElementById("password_actual").value.trim();
    const nueva = document.getElementById("nueva_password").value.trim();
    const confirmar = document.getElementById("confirmar_password").value.trim();

    if (!actual || !nueva || !confirmar) {
      alert("⚠️ Completa todos los campos.");
      return;
    }

    if (nueva !== confirmar) {
      alert("⚠️ Las contraseñas no coinciden.");
      return;
    }
    loadingOverlay.classList.add("show");

  const url = `/cambiar_contrasena_funcion/${currentUserRut}`;
  const formData = new FormData(form);
   try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        },
      });

      const result = await response.json();

      // Ocultar overlay y habilitar botón
      submitBtn.disabled = false;

      if (result.status === "success") {
        mostrarMensajeExito();
      } else {
        alert(result.message || "Error al modificar usuario");
      }
    } catch (error) {
      submitBtn.disabled = false;
      console.error(error);
      alert("Error al enviar el formulario");
    }finally{
      loadingOverlay.classList.remove("show");
    }
  });

  // --- Función para mostrar/ocultar contraseñas ---
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function () {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      const iconoOjo = this.querySelector(".icono-ojo");
      const iconoOjoCerrado = this.querySelector(".icono-ojo-cerrado");

      if (input.type === "password") {
        input.type = "text";
        iconoOjo.classList.add("oculto");
        iconoOjoCerrado.classList.remove("oculto");
      } else {
        input.type = "password";
        iconoOjo.classList.remove("oculto");
        iconoOjoCerrado.classList.add("oculto");
      }
    });
  });
});

// Mostrar mensaje de éxito
function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage")
  mensaje.classList.add("show")
  setTimeout(() => {
    setTimeout(() => {
      window.location.href = "/inicio_perfil"
    }, 500)
  }, 300)
}