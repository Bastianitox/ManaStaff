document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function() {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      const ojo = this.querySelector(".icono-ojo");
      const ojoCerrado = this.querySelector(".icono-ojo-cerrado");

      if (input.type === "password") {
        input.type = "text";
        ojo.classList.add("oculto");
        ojoCerrado.classList.remove("oculto");
      } else {
        input.type = "password";
        ojo.classList.remove("oculto");
        ojoCerrado.classList.add("oculto");
      }
    });
  });
});
