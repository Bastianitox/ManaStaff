// ===== Helpers de validación =====
function validarRequisitosPassword(password) {
  return {
    length: password.length >= 8 && password.length <= 30,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

function passwordCumpleTodosRequisitos(password) {
  const r = validarRequisitosPassword(password);
  return r.length && r.uppercase && r.lowercase && r.number && r.special;
}

// Marca visualmente un requisito 
function setRequirementState(id, estadoOk) {
  const el = document.getElementById(id);
  if (!el) return;
  if (estadoOk) {
    el.classList.add("met");
    el.classList.remove("unmet");
  } else {
    el.classList.add("unmet");
    el.classList.remove("met");
  }
}

// Actualiza SOLO los requisitos de la nueva contraseña 
function actualizarRequisitosNuevaPwd(nuevaPwd) {
  const r = validarRequisitosPassword(nuevaPwd);

  setRequirementState("req-length",    r.length);
  setRequirementState("req-uppercase", r.uppercase);
  setRequirementState("req-lowercase", r.lowercase);
  setRequirementState("req-number",    r.number);
  setRequirementState("req-special",   r.special);
}

// Actualiza SOLO "Las contraseñas coinciden"
function actualizarMatchPwd(nuevaPwd, confirmarPwd) {
  const coinciden = nuevaPwd.length > 0 && nuevaPwd === confirmarPwd;
  setRequirementState("req-match", coinciden);
}

// ========== ALERTA CENTRADA ==========
function showAlert(type, message) {
  const successEl = document.getElementById('successAlert');
  const errorEl   = document.getElementById('errorAlert');

  // Oculta cualquier alerta visible
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

// Mensaje de éxito con redirección
function mostrarMensajeExito() {
  showAlert('success', 'Contraseña modificada exitosamente.');
  setTimeout(() => {
    window.location.href = "/inicio_perfil";
  }, 2400);
}


// --- Lógica del formulario / envío ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cambiar-contrasena");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  const actualInput    = document.getElementById("password_actual");
  const nuevaInput     = document.getElementById("nueva_password");
  const confirmarInput = document.getElementById("confirmar_password");

  // Escuchar escritura en "Nueva Contraseña"
  nuevaInput.addEventListener("input", () => {
    actualizarRequisitosNuevaPwd(nuevaInput.value);
    // req-match se controla desde confirmar
  });

  // Escuchar escritura en "Confirmar Nueva Contraseña"
  confirmarInput.addEventListener("input", () => {
    actualizarMatchPwd(nuevaInput.value, confirmarInput.value);
  });

  // Estado inicial
  actualizarRequisitosNuevaPwd(nuevaInput.value || "");
  actualizarMatchPwd(nuevaInput.value || "", confirmarInput.value || "");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const actual    = actualInput.value.trim();
    const nueva     = nuevaInput.value.trim();
    const confirmar = confirmarInput.value.trim();

    if (!actual || !nueva || !confirmar) {
      showAlert('error', 'Completa todos los campos.');
      return;
    }

    if (!passwordCumpleTodosRequisitos(nueva)) {
      showAlert('error', 'La nueva contraseña no cumple todos los requisitos.');
      return;
    }

    if (nueva !== confirmar) {
      showAlert('error', 'Las contraseñas no coinciden.');
      return;
    }

    loadingOverlay.classList.add("show");
    submitBtn.disabled = true;

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

      submitBtn.disabled = false;

      if (result.status === "success") {
        mostrarMensajeExito();
      } else {
        showAlert('error', result.message || "Error al modificar contraseña.");
      }
    } catch (error) {
      submitBtn.disabled = false;
      console.error(error);
      showAlert('error', "Error al enviar el formulario.");
    } finally {
      loadingOverlay.classList.remove("show");
    }
  });

  // --- Toggle mostrar/ocultar contraseña ---
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