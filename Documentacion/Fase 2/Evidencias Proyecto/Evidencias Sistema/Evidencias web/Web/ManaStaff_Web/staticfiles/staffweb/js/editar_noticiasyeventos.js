document.addEventListener("DOMContentLoaded", () => {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const form = document.querySelector("form");
  const tituloInput = document.getElementById("titulo");
  const contenidoInput = document.getElementById("contenido");
  const fechaInput = document.getElementById("fecha");
  const tipoInput = document.getElementById("tipo");

  const MAX_TITULO = 200;
  const MAX_CONTENIDO = 5000;

  function showAlert(type, message) {
    const successEl = document.getElementById("successAlert");
    const errorEl = document.getElementById("errorAlert");

    [successEl, errorEl].forEach((el) => {
      if (!el) return;
      el.classList.add("hide");
      el.style.display = "none";
    });

    const alertEl = type === "success" ? successEl : errorEl;
    const messageEl = type === "success" ? document.getElementById("successMessageAlert") : document.getElementById("errorMessageAlert");

    messageEl.textContent = message;
    alertEl.style.display = "flex";
    alertEl.classList.remove("hide");

    setTimeout(() => {
      alertEl.classList.add("hide");
      setTimeout(() => (alertEl.style.display = "none"), 400);
    }, 3000);
  }

  tituloInput.addEventListener("input", () => {
    if (tituloInput.value.length > MAX_TITULO) {
      tituloInput.value = tituloInput.value.substring(0, MAX_TITULO);
      showAlert("error", `El título no puede superar los ${MAX_TITULO} caracteres.`);
    }
  });

  contenidoInput.addEventListener("input", () => {
    if (contenidoInput.value.length > MAX_CONTENIDO) {
      contenidoInput.value = contenidoInput.value.substring(0, MAX_CONTENIDO);
      showAlert("error", `El contenido no puede superar los ${MAX_CONTENIDO} caracteres.`);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    loadingOverlay.classList.add("show");

    let errors = [];

    if (!tituloInput.value.trim()) errors.push("El título es obligatorio.");
    if (!contenidoInput.value.trim()) errors.push("El contenido es obligatorio.");
    if (!fechaInput.value) errors.push("La fecha es obligatoria.");
    if (!tipoInput.value) errors.push("El tipo de publicación es obligatorio.");

    if (tituloInput.value.length > MAX_TITULO) errors.push(`El título no puede exceder los ${MAX_TITULO} caracteres.`);

    if (contenidoInput.value.length > MAX_CONTENIDO) errors.push(`El contenido no puede exceder los ${MAX_CONTENIDO} caracteres.`);

    if (errors.length > 0) {
      loadingOverlay.classList.remove("show");
      showAlert("error", errors[0]);
      return;
    }

    const formData = new FormData(form);

    let exito = false;

    fetch(window.location.href, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          loadingOverlay.classList.remove("show");
          showAlert("error", data.message);
          return;
        }

        // ÉXITO
        showAlert("success", data.message);
        exito = true;

        setTimeout(() => {
          window.location.href = "/administrar_noticiasyeventos";
        }, 2600);
      })
      .catch(() => {
        showAlert("error", "Ocurrió un error inesperado.");
      })
      .finally(() => {
        setTimeout(() => {
          if (exito) {
            window.location.href = "/administrar_noticiasyeventos";
          }
          exito = false;
          loadingOverlay.classList.remove("show");
        }, 2600);
      });
  });
});
