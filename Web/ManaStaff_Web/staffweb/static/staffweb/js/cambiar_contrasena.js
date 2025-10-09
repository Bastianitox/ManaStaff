// Importamos Firebase desde el CDN oficial
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getAuth, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ⚙️ Configuración de Firebase (usa tu configuración real)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCambiarContrasena");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const actual = document.getElementById("password_actual").value.trim();
    const nueva = document.getElementById("nueva_password").value.trim();
    const confirmar = document.getElementById("confirmar_password").value.trim();

    if (nueva !== confirmar) {
      alert("⚠️ Las contraseñas no coinciden.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("❌ No hay usuario autenticado. Por favor, inicia sesión nuevamente.");
      return;
    }

    try {
      // Reautenticamos al usuario antes de cambiar la contraseña
      const cred = EmailAuthProvider.credential(user.email, actual);
      await reauthenticateWithCredential(user, cred);

      // Actualizamos la contraseña
      await updatePassword(user, nueva);

      alert("✅ Contraseña cambiada correctamente.");

      // Redirigir después de unos segundos
      setTimeout(() => {
        window.location.href = "/inicio_perfil"; // <-- Asegúrate de que esta URL exista en tus urls.py
      }, 1200);

    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      alert("⚠️ " + (error.message || "Error al cambiar la contraseña."));
    }
  });
});
