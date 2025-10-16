function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');
const loadingOverlay = document.getElementById("loadingOverlay");

async function solicitarCodigo() {
    loadingOverlay.classList.add("show");
    try {
        const email = document.getElementById("email").value;
        const res = await fetch("/solicitar_recuperacion_pin", {
            method: "POST",
            headers: {'Content-Type':'application/x-www-form-urlencoded','X-CSRFToken': csrftoken},
            body: `email=${email}`
        }).then(r => r.json());

        if(res.status === "success") {
            mostrarMensajeExito(res.message, 1);
            document.getElementById("codigoContainer").style.display = "block";
            document.getElementById("btn-verificar").style.display = "block";
        }else{  
            mostrarMensajeExito(res.message, 2);
        }
    } catch (error) {
        console.error(error);
        alert("Error al enviar el código");
    } finally {
        loadingOverlay.classList.remove("show");
    }
}

async function verificarCodigo() {
    loadingOverlay.classList.add("show");
    try {
        const email = document.getElementById("email").value;
        const codigo = document.getElementById("codigo").value;
        const res = await fetch("/verificar_codigo_recuperacion", {
            method: "POST",
            headers: {'Content-Type':'application/x-www-form-urlencoded','X-CSRFToken': csrftoken},
            body: `email=${email}&codigo=${codigo}`
        }).then(r => r.json());

        if(res.status === "success") {
            mostrarMensajeExito(res.message, 1);
            document.getElementById("nuevoPinContainer").style.display = "block";
        }else{  
            mostrarMensajeExito(res.message, 2);
        }
    } catch (error) {
        console.error(error);
        mostrarMensajeExito('Error al verificar el código', 2);
    } finally {
        loadingOverlay.classList.remove("show");
    }
}

async function cambiarPIN() {
    loadingOverlay.classList.add("show");
    try {
        const email = document.getElementById("email").value;
        const codigo = document.getElementById("codigo").value;
        const nuevo_pin = document.getElementById("nuevoPin").value;

        const res = await fetch("/cambiar_PIN_verificado", {
            method: "POST",
            headers: {'Content-Type':'application/x-www-form-urlencoded','X-CSRFToken': csrftoken},
            body: `email=${email}&codigo=${codigo}&nuevo_pin=${nuevo_pin}`
        }).then(r => r.json());

        if(res.status === "success") {
            document.getElementById("nuevoPinContainer").style.display = "none";
            mostrarMensajeExito('PIN modificado con éxito', 3);
        }else{
            mostrarMensajeExito(res.message, 2);
        }
    } catch (error) {
        console.error(error);
        mostrarMensajeExito('Error al actualizar el PIN', 2);
    } finally {
        loadingOverlay.classList.remove("show");
    }
}

// Mostrar mensaje de éxito
function mostrarMensajeExito(mensajeText, estado) {
  var mensaje = document.getElementById("successMessage")
  mensaje.innerHTML = mensajeText
  if (estado == 2){
    mensaje.classList.add("error")
  }
  mensaje.classList.add("show")
  setTimeout(() => {
    setTimeout(() => {
        mensaje.classList.remove("show")
        mensaje.classList.remove("error")
        if (estado == 3){
            window.location.href = "/inicio_perfil"
        }
    }, 500)
  }, 300)
}

// Limitar código a 6 dígitos
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("codigo").addEventListener("input", function () {
        if (this.value.length > 6) this.value = this.value.slice(0, 6);
    });
    document.getElementById("nuevoPin").addEventListener("input", function () {
        if (this.value.length > 4) this.value = this.value.slice(0, 4);
    });
});
