// ====== ALERTA CENTRADA ======
function showAlert(type, message) {
  const successEl = document.getElementById('successAlert');
  const errorEl   = document.getElementById('errorAlert');

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

  setTimeout(() => {
    alertEl.classList.add('hide');
    setTimeout(() => { alertEl.style.display = 'none'; }, 400);
  }, 5200);
}

document.addEventListener("DOMContentLoaded", function () {
  const imagen_actual = document.getElementById('imagen_actual');
  const imagen_nueva  = document.getElementById('imagen_nueva');
  const input_imagen  = document.getElementById('imagen_input');

  // 1) MOSTRAR ALERTAS 
  if (window.__perfilSuccess) {
    showAlert('success', 'Datos modificados exitosamente.');
  }
  if (window.__perfilError) {
    showAlert('error', window.__perfilError);
  }

  // 2) PREVIEW + VALIDACIÓN AL CAMBIAR IMAGEN
  input_imagen.addEventListener("change", function () {
    const file = this.files[0];
    imagen_actual.classList.add("hidden");
    imagen_nueva.classList.remove("hidden");

    if (!file) {
      imagen_nueva.src = "";
      imagen_actual.classList.remove("hidden");
      imagen_nueva.classList.add("hidden");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      alert("El archivo debe ser una imagen (JPG, PNG, GIF)");
      this.value = "";
      imagen_nueva.src = "";
      imagen_actual.classList.remove("hidden");
      imagen_nueva.classList.add("hidden");
      return;
    }

    if (file.size > maxSize) {
      alert("La imagen no debe superar los 2MB");
      this.value = "";
      imagen_nueva.src = "";
      imagen_actual.classList.remove("hidden");
      imagen_nueva.classList.add("hidden");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      imagen_nueva.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // 3) CANCELAR CAMBIO DE IMAGEN
  document.getElementById("btn_cancelar_imagen").addEventListener("click", () => {
    imagen_nueva.src = "";
    imagen_nueva.classList.add("hidden");
    imagen_actual.classList.remove("hidden");
    input_imagen.value = "";
  });
});