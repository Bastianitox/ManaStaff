document.addEventListener("DOMContentLoaded", () => {
  const documentTitle   = document.getElementById("documentTitle");
  const documentMeta    = document.getElementById("documentMeta");
  const documentContent = document.getElementById("documentContent");
  const downloadBtn     = document.getElementById("downloadBtn");

  let docId = null;

  if (downloadBtn) {
    docId = downloadBtn.getAttribute("data-doc-id");
  }

  if (!docId) {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get("docId");
    if (rawId && /^[\w\-]+$/.test(rawId)) {
      docId = rawId;
    }
  }

  if (downloadBtn && !downloadBtn.disabled && docId) {
    downloadBtn.addEventListener("click", (e) => {

      e.preventDefault();

      window.location.href = `/descargar_documento/${encodeURIComponent(docId)}`;
    });
  }
});




