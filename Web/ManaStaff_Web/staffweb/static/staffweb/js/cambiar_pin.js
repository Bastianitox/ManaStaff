// --- Lógica del formulario ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cambiar-contrasena"); 
  const loadingOverlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const actual = document.getElementById("pin_actual").value.trim();
    const nueva = document.getElementById("pin_nueva").value.trim();
    const confirmar = document.getElementById("pin_confirmar").value.trim();

    // --- VALIDACIONES PERSONALIZADAS ---
    if (!actual || !nueva || !confirmar) {
      alert("⚠️ Completa todos los campos.");
      return;
    }

    // Verifica que sean solo números
    const soloNumeros = /^[0-9]+$/;
    if (!soloNumeros.test(nueva) || !soloNumeros.test(confirmar)) {
      alert("⚠️ El PIN solo puede contener números.");
      return;
    }

    // Verifica que tenga exactamente 4 dígitos
    if (nueva.length !== 4 || confirmar.length !== 4) {
      alert("⚠️ El PIN debe tener exactamente 4 dígitos numéricos.");
      return;
    }

    // Verifica que coincidan
    if (nueva !== confirmar) {
      alert("⚠️ Los PIN no coinciden.");
      return;
    }

    // --- Envío al servidor ---
    loadingOverlay.classList.add("show");

    const url = `/cambiar_pin_funcion/${currentUserRut}`;
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

      submitBtn.disabled = false;

      if (result.status === "success") {
        mostrarMensajeExito();
      } else {
        alert(result.message || "Error al modificar PIN.");
      }
    } catch (error) {
      submitBtn.disabled = false;
      console.error(error);
      alert("Error al enviar el formulario.");
    } finally {
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

// --- Mostrar mensaje de éxito y redirigir ---
function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage");
  mensaje.classList.add("show");

  setTimeout(() => {
    window.location.href = "/inicio_perfil";
  }, 1000);
}
