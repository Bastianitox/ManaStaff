// ========== ALERTA CENTRADA ==========
function showAlert(type, message) {
  const successEl = document.getElementById('successAlert');
  const errorEl   = document.getElementById('errorAlert');

  // Ocultar alertas visibles
  [successEl, errorEl].forEach(el => {
    if (!el) return;
    el.classList.add('hide');
    el.style.display = 'none';
  });

  const alertEl = type === 'success' ? successEl : errorEl;
  const messageEl = type === 'success'
    ? document.getElementById('successMessageAlert')
    : document.getElementById('errorMessageAlert');

  messageEl.textContent = message;
  alertEl.style.display = 'flex';
  alertEl.classList.remove('hide');

  // Auto-ocultar con animación
  setTimeout(() => {
    alertEl.classList.add('hide');
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 400);
  }, 5200);
}

// Mostrar mensaje de éxito y luego redirigir
function mostrarMensajeExito() {
  showAlert('success', 'PIN modificado exitosamente.');
  setTimeout(() => {
    window.location.href = "/inicio_perfil";
  }, 2400);
}

function configurarInputPIN(inputEl) {
  inputEl.setAttribute("inputmode", "numeric");
  inputEl.setAttribute("pattern", "\\d{4}");
  inputEl.setAttribute("maxlength", "4");

  // Bloquear teclas no numéricas
  inputEl.addEventListener("keydown", (e) => {
    const allowedControlKeys = [
      "Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
      "Tab","Home","End"
    ];

    if (allowedControlKeys.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ["a","c","v","x","A","C","V","X"].includes(e.key)) {
      return;
    }

    // Solo dígitos 0-9
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    const selStart = e.target.selectionStart ?? 0;
    const selEnd   = e.target.selectionEnd ?? 0;
    const willReplace = selEnd > selStart; 
    if (!willReplace && e.target.value.replace(/\D/g,"").length >= 4) {
      e.preventDefault();
    }
  });

  // Normalizar en cada input event 
  inputEl.addEventListener("input", (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0,4);
    if (e.target.value !== digitsOnly) {
      e.target.value = digitsOnly;
    }
  });

  // Controlar pegado manualmente
  inputEl.addEventListener("paste", (e) => {
    e.preventDefault();
    const clip = (e.clipboardData || window.clipboardData).getData("text") || "";
    const digits = clip.replace(/\D/g, "").slice(0,4);

    const input = e.target;
    const before = input.value.slice(0, input.selectionStart);
    const after  = input.value.slice(input.selectionEnd);
    const next   = (before + digits + after).replace(/\D/g, "").slice(0,4);

    input.value = next;
    const caret = Math.min((before + digits).length, 4);
    input.setSelectionRange(caret, caret);
  });
}


// --- Lógica del formulario ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cambiar-contrasena"); 
  const loadingOverlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  const pinActualEl    = document.getElementById("pin_actual");
  const pinNuevaEl     = document.getElementById("pin_nueva");
  const pinConfirmarEl = document.getElementById("pin_confirmar");

  // Forzar formato numérico 4 dígitos en los 3 inputs
  configurarInputPIN(pinActualEl);
  configurarInputPIN(pinNuevaEl);
  configurarInputPIN(pinConfirmarEl);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const actual    = pinActualEl.value.trim();
    const nueva     = pinNuevaEl.value.trim();
    const confirmar = pinConfirmarEl.value.trim();

    // --- VALIDACIONES PERSONALIZADAS ---
    if (!actual || !nueva || !confirmar) {
      showAlert('error', 'Completa todos los campos.');
      return;
    }

    // Verifica que sean solo números y exactamente 4 dígitos
    const pinRegex = /^[0-9]{4}$/;
    if (!pinRegex.test(nueva) || !pinRegex.test(confirmar) || !pinRegex.test(actual)) {
      showAlert('error', 'El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    // Verifica que coincidan el nuevo y confirmar
    if (nueva !== confirmar) {
      showAlert('error', 'Los PIN no coinciden.');
      return;
    }

    // --- Envío al servidor ---
    loadingOverlay.classList.add("show");
    submitBtn.disabled = true;

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
        showAlert('error', result.message || "Error al modificar PIN.");
      }
    } catch (error) {
      submitBtn.disabled = false;
      console.error(error);
      showAlert('error', "Error al enviar el formulario.");
    } finally {
      loadingOverlay.classList.remove("show");
    }
  });

  // --- Mostrar/ocultar pin con el ojito ---
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
