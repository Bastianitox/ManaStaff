
function readJSON(id, fb) {
  const el = document.getElementById(id);
  if (!el) return fb;
  try { return JSON.parse(el.textContent); } catch { return fb; }
}
function normalizeRut(v){ return String(v||"").replace(/[^\d]/g,""); }

const USUARIOS = readJSON("usuarios-data", []);   
const ESTADOS  = readJSON("estados-data", {});    

let selectedUser = null;

// elementos
const userSearchInput      = document.getElementById("userSearch");
const userDropdown         = document.getElementById("userDropdown");
const selectedUserDisplay  = document.getElementById("selectedUserDisplay");
const selectedUserIdInput  = document.getElementById("selectedUserId");
const documentFileInput    = document.getElementById("documentFile");
const fileNameSpan         = document.getElementById("fileName");
const createDocumentForm   = document.getElementById("createDocumentForm");
const statusActivo         = document.getElementById("statusActivo");
const statusPendiente      = document.getElementById("statusPendiente");
const fileRequired         = document.getElementById("fileRequired");
const fileOptional         = document.getElementById("fileOptional");

// buscador de usuarios 
userSearchInput.addEventListener("input", function () {
  const term = this.value.toLowerCase().trim();
  if (!term) { userDropdown.classList.remove("show"); return; }

  const matches = USUARIOS.filter(u =>
    (u.nombre || "").toLowerCase().includes(term) ||
    String(u.rut_visible || u.rut || "").includes(term)
  );

  userDropdown.innerHTML = matches.length
    ? matches.map(u => `
        <div class="user-option" data-rut="${u.rut}" data-name="${u.nombre}">
          <div class="user-option-name">${u.nombre}</div>
          <div class="user-option-rut">${u.rut}</div>
        </div>`).join("")
    : `<div class="no-results">No se encontraron usuarios</div>`;

  userDropdown.classList.add("show");
});

userDropdown.addEventListener("click", (e) => {
  const opt = e.target.closest(".user-option");
  if (!opt) return;
  const rut = String(opt.dataset.rut);
  const name = String(opt.dataset.name);
  selectedUser = { rut, nombre: name };

  userSearchInput.value = "";
  userDropdown.classList.remove("show");

  selectedUserIdInput.value = normalizeRut(rut); 
  selectedUserDisplay.innerHTML = `
    <div class="selected-user-info">
      <div class="selected-user-name">${name}</div>
      <div class="selected-user-rut">${rut}</div>
    </div>
    <button type="button" class="remove-user" id="removeUserBtn">X</button>`;
  selectedUserDisplay.classList.add("show");

  document.getElementById("userSearchError")?.classList.remove("show");

  document.getElementById("removeUserBtn").onclick = () => {
    selectedUser = null;
    selectedUserIdInput.value = "";
    selectedUserDisplay.classList.remove("show");
    selectedUserDisplay.innerHTML = "";
  };
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) userDropdown.classList.remove("show");
});

// archivo
documentFileInput.addEventListener("change", function () {
  fileNameSpan.textContent = this.files?.[0]?.name || "Seleccionar archivo";
  document.getElementById("documentFileError")?.classList.remove("show");
});

// estado
function updateFileRequirement() {
  const pendiente = statusPendiente.checked;
  fileRequired.style.display = pendiente ? "none" : "inline";
  fileOptional.style.display = pendiente ? "inline" : "none";
}
statusActivo.addEventListener("change", updateFileRequirement);
statusPendiente.addEventListener("change", updateFileRequirement);
updateFileRequirement();

// validación liviana
createDocumentForm.addEventListener("submit", (e) => {
  let ok = true;

  const nameEl = document.getElementById("documentName");
  const nameErr = document.getElementById("documentNameError");
  if (!nameEl.value.trim()) {
    nameErr.textContent = "El nombre del documento es obligatorio";
    nameErr.classList.add("show"); nameEl.classList.add("error"); ok = false;
  } else { nameErr.classList.remove("show"); nameEl.classList.remove("error"); }

  const status = document.querySelector('input[name="documentStatus"]:checked')?.value || "activo";
  const fileErr = document.getElementById("documentFileError");
  if (status === "activo") {
    if (!documentFileInput.files.length) {
      fileErr.textContent = "Debe seleccionar un archivo para documentos activos";
      fileErr.classList.add("show"); ok = false;
    } else if ((documentFileInput.files[0].size / 1024 / 1024) > 10) {
      fileErr.textContent = "El archivo no debe superar los 10MB";
      fileErr.classList.add("show"); ok = false;
    } else { fileErr.classList.remove("show"); }
  } else {
    if (documentFileInput.files.length &&
        (documentFileInput.files[0].size / 1024 / 1024) > 10) {
      fileErr.textContent = "El archivo no debe superar los 10MB";
      fileErr.classList.add("show"); ok = false;
    } else { fileErr.classList.remove("show"); }
  }

  const selectedRut = selectedUserIdInput.value;
  const userErr = document.getElementById("userSearchError");
  if (!selectedRut) { userErr.textContent = "Debe seleccionar un usuario"; userErr.classList.add("show"); ok = false; }
  else { userErr.classList.remove("show"); }

  if (!ok) e.preventDefault();
});