const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
};


if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formCambiarContrasena");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const actual = document.getElementById("password_actual").value;
        const nueva = document.getElementById("nueva_password").value;
        const confirmar = document.getElementById("confirmar_password").value;

        if (nueva !== confirmar) {
            alert("⚠️ Las contraseñas no coinciden.");
            return;
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            alert("❌ No hay usuario autenticado.");
            return;
        }

        // Reautenticar al usuario antes de cambiar la contraseña
        const credenciales = firebase.auth.EmailAuthProvider.credential(
            user.email,
            actual
        );

        try {
            await user.reauthenticateWithCredential(credenciales);
            await user.updatePassword(nueva);
            alert("✅ Contraseña cambiada correctamente.");
            form.reset();
        } catch (error) {
            console.error(error);
            if (error.code === "auth/wrong-password") {
                alert("❌ Contraseña actual incorrecta.");
            } else if (error.code === "auth/weak-password") {
                alert("⚠️ La nueva contraseña es demasiado débil.");
            } else {
                alert("⚠️ Error al cambiar la contraseña: " + error.message);
            }
        }
    });
});
