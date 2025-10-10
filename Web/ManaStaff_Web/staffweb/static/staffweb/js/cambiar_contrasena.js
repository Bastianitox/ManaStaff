// --- Firebase ---
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// --- Configuración de Firebase (usa la misma que tu proyecto) ---
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Lógica del formulario ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

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

    const user = auth.currentUser;
    if (!user) {
      alert("⚠️ No hay usuario autenticado. Inicia sesión nuevamente.");
      return;
    }

    try {
      // Reautenticar al usuario
      const credenciales = EmailAuthProvider.credential(user.email, actual);
      await reauthenticateWithCredential(user, credenciales);

      // Actualizar la contraseña
      await updatePassword(user, nueva);

      alert("✅ Contraseña cambiada correctamente.");
      window.location.href = "/inicio_perfil"; // redirige al perfil
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      if (error.code === "auth/wrong-password") {
        alert("❌ Contraseña actual incorrecta.");
      } else if (error.code === "auth/weak-password") {
        alert("⚠️ La nueva contraseña es muy débil (mínimo 6 caracteres).");
      } else {
        alert("⚠️ Error: " + error.message);
      }
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
