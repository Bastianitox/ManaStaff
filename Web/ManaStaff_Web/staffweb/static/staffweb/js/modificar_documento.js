function readTemplateJSON(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  try { return JSON.parse(el.textContent); } catch { return fallback; }
}
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, m => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]
  ));
}
function getCSRFToken() {
  const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const USUARIO = readTemplateJSON("usuario-data", {nombre:"Usuario", rut:"-", rut_visible:"-"});
const DOC     = readTemplateJSON("doc-data", {id:"", nombre:"", estado:"pendiente", url:"", archivo_nombre:"", fecha_vencimiento:""});

// El DOM
const form              = document.getElementById("modifyDocumentForm");
const successMessage    = document.getElementById("successMessage");
const documentNameInput = document.getElementById("documentName");
const statusActivo      = document.getElementById("statusActivo");
const statusPendiente   = document.getElementById("statusPendiente");
const expirationDate    = document.getElementById("expirationDate");
const fileInput         = document.getElementById("documentFile");
const fileNameSpan      = document.getElementById("fileName");

// Pintar datos al cargar
document.addEventListener("DOMContentLoaded", () => {
  // usuario
  const userName = document.getElementById("userName");
  const userRut  = document.getElementById("userRut");
  if (userName) userName.textContent = USUARIO.nombre || "Usuario";
  if (userRut)  userRut.textContent  = USUARIO.rut_visible || USUARIO.rut || "-";

  // doc
  documentNameInput.value = DOC.nombre || "";

  if ((DOC.estado || "pendiente").toLowerCase() === "activo") {
    statusActivo.checked = true;
  } else {
    statusPendiente.checked = true;
  }

  if (DOC.fecha_vencimiento) {
    expirationDate.value = DOC.fecha_vencimiento; 
  }

  // documento actual
  const cont = document.getElementById("currentDocumentDisplay");
  cont.innerHTML = "";
  if (DOC.url) {
    cont.classList.remove("empty");
    cont.innerHTML = `
      <div class="document-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </div>
      <div class="document-info">
        <div class="document-name">${esc(DOC.archivo_nombre || '(archivo subido)')}</div>
        <div class="document-date">Actual</div>
      </div>
      <div class="document-actions">
        <button type="button" class="btn-view" onclick="window.open('${esc(DOC.url)}','_blank')">Ver</button>
      </div>
    `;
  } else {
    cont.classList.add("empty");
    cont.innerHTML = `
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <div class="empty-text">No hay archivo subido</div>
    `;
  }
});

// Nombre del archivo elegido
fileInput.addEventListener("change", function(){
  if (this.files && this.files.length) {
    fileNameSpan.textContent = this.files[0].name;
    document.getElementById("documentFileError")?.classList.remove("show");
    this.classList.remove("error");
  } else {
    fileNameSpan.textContent = "Seleccionar nuevo archivo";
  }
});

// Envío
form.addEventListener("submit", function(e){
  e.preventDefault();

  // Validaciones
  let ok = true;

  const nameErr = document.getElementById("documentNameError");
  if (!documentNameInput.value.trim()) {
    if (nameErr) {
      nameErr.textContent = "El nombre del documento es obligatorio";
      nameErr.classList.add("show");
    }
    documentNameInput.classList.add("error");
    ok = false;
  } else {
    nameErr?.classList.remove("show");
    documentNameInput.classList.remove("error");
  }

  const fileErr = document.getElementById("documentFileError");
  if (fileInput.files && fileInput.files.length) {
    const mb = fileInput.files[0].size / (1024 * 1024);
    if (mb > 10) {
      if (fileErr) {
        fileErr.textContent = "El archivo no debe superar los 10MB";
        fileErr.classList.add("show");
      }
      ok = false;
    } else {
      fileErr?.classList.remove("show");
    }
  } else {
    fileErr?.classList.remove("show");
  }

  if (!ok) return;

  const submitBtn = form.querySelector(".btn-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando...";

  const fd = new FormData();
  fd.append("documentName", documentNameInput.value.trim());
  fd.append("documentStatus", (document.querySelector('input[name="documentStatus"]:checked')?.value || "pendiente"));
  fd.append("expirationDate", (expirationDate.value || "").trim());
  if (fileInput.files && fileInput.files.length) {
    fd.append("documentFile", fileInput.files[0]);
  }

  fetch(window.MOD_DOC.postUrl, {
    method: "POST",
    headers: { "X-CSRFToken": getCSRFToken() },
    body: fd
  })
  .then(r => r.json())
  .then(res => {
    if (res.ok) {
      successMessage.classList.add("show");
      setTimeout(() => {
        const back = window.MOD_DOC.nextUrl || "{% url 'administrar_documentos' %}";
        window.location.href = back;
      }, 900);
    } else {
      alert(res.error || "No se pudo actualizar");
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar cambios";
    }
  })
  .catch(() => {
    alert("Error de red");
    submitBtn.disabled = false;
    submitBtn.textContent = "Guardar cambios";
  });
});