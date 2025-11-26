function showLoader(message = "Procesando solicitud...") {
    const overlay = document.getElementById("loadingOverlay");
    const text = overlay.querySelector(".loading-text");
    text.textContent = message;
    overlay.classList.add("show");
}

function hideLoader() {
    document.getElementById("loadingOverlay").classList.remove("show");
}

function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage")
  mensaje.classList.add("show")
  setTimeout(() => {
        hideLoader()
        window.location.href = "/"
  }, 500)
}

// Eventos
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("recuperarForm");
  const submitButton = document.getElementById("submitButton");

  form.addEventListener("submit", async (e) => {
        submitButton.disabled = true;
        showLoader("Enviando correo...");
        e.preventDefault();

        // Mostrar overlay de carga

        setTimeout(async () => {

            try{
                const data_form = {
                    correo: document.getElementById("email").value.trim(),
                };
                const response = await fetch("/recuperar_contrasena_funcion", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
                        },
                        body: JSON.stringify(data_form)
                    });
                if (!response.ok) throw new Error("Error HTTP " + response.status)

                const data = await response.json();

                if (data.status === "success") {
                    mostrarMensajeExito()
                }else{
                    submitButton.disabled = false;
                    alert("⚠️ " + (data.mensaje || "Error desconocido al enviar el correo."));
                    modal.style.display = "none";
                }
            }catch(error){
                submitButton.disabled = false;
                console.error("Error enviando correo:", error);
                alert("Error de conexión al enviar el correo.");
            }finally{
                hideLoader();
            }
        }, 500)

        });
});
