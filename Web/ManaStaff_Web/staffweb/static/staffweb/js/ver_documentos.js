document.addEventListener("DOMContentLoaded", () => {
  // Referencias básicas del DOM (para futuras extensiones si se necesitan)
  const documentTitle   = document.getElementById("documentTitle");
  const documentMeta    = document.getElementById("documentMeta");
  const documentContent = document.getElementById("documentContent");
  const downloadBtn     = document.getElementById("downloadBtn");

  // 1) Obtener el docId desde el atributo data-doc-id del botón (preferido),
  //    o bien desde la query ?docId=... como respaldo.
  let docId = null;

  if (downloadBtn) {
    docId = downloadBtn.getAttribute("data-doc-id");
  }

  if (!docId) {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get("docId");
    // Acepta IDs alfanuméricos y guiones; evita parseInt para no romper IDs no numéricos.
    if (rawId && /^[\w\-]+$/.test(rawId)) {
      docId = rawId;
    }
  }

  // 2) Si hay botón de descarga habilitado y tenemos docId,
  //    enlazamos el mismo comportamiento que en inicio_documentos.js:
  //    redirigir con window.location.href al endpoint Django.
  if (downloadBtn && !downloadBtn.disabled && docId) {
    downloadBtn.addEventListener("click", (e) => {
      // Evita que el <a> navegue por su href de forma nativa.
      // (Si quieres soportar Ctrl/Cmd+Click en nueva pestaña, elimina esta línea
      // y deja que el href haga su trabajo.)
      e.preventDefault();

      // Redirección directa como en las tarjetas
      window.location.href = `/descargar_documento/${encodeURIComponent(docId)}`;
    });
  }

  // 3) Si no hay docId o el botón está deshabilitado, no hacemos nada más:
  //    el template ya dejó el botón inactivo/estilizado.
  //    El visor (iframe) lo controla el template con documento.filePath.
});




