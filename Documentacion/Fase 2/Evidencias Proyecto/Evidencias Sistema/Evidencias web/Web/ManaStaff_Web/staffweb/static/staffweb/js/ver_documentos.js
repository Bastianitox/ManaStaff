document.addEventListener("DOMContentLoaded", () => {
  const $deleteModal = document.getElementById("deleteModal");
  const $deleteCancelBtn = document.getElementById("deleteCancelBtn");
  const $deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
  const $loadingSpinner = document.getElementById("loadingSpinner");
  
  const $btnDeleteDoc = document.getElementById("btnDeleteDoc");
  
  let docIdToDelete = null;

  function getCSRFToken() {
    const input = document.querySelector('[name=csrfmiddlewaretoken]');
    if (input) return input.value;
    const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function showAlert(type, message) {
    const successEl = document.getElementById("successAlert");
    const errorEl = document.getElementById("errorAlert");

    [successEl, errorEl].forEach(el => { if(el) el.style.display = "none"; });

    const alertEl = type === "success" ? successEl : errorEl;
    const msgEl = type === "success" 
        ? document.getElementById("successMessageAlert") 
        : document.getElementById("errorMessageAlert");

    if (msgEl) msgEl.textContent = message;
    if (alertEl) {
        alertEl.style.display = "flex";
        setTimeout(() => {
            alertEl.style.display = "none";
        }, 4000);
    }
  }

  function toggleSpinner(show) {
    if (!$loadingSpinner) return;
    if (show) $loadingSpinner.classList.remove("hidden");
    else $loadingSpinner.classList.add("hidden");
  }

  if ($btnDeleteDoc) {
    $btnDeleteDoc.addEventListener("click", () => {
        docIdToDelete = $btnDeleteDoc.getAttribute("data-doc-id");
        if ($deleteModal) $deleteModal.classList.remove("hidden");
    });
  }

  if ($deleteCancelBtn) {
    $deleteCancelBtn.addEventListener("click", () => {
        docIdToDelete = null;
        if ($deleteModal) $deleteModal.classList.add("hidden");
    });
  }

  if ($deleteConfirmBtn) {
    $deleteConfirmBtn.addEventListener("click", () => {
        if (!docIdToDelete) return;
        
        toggleSpinner(true);

        fetch("/eliminar_documento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            body: JSON.stringify({ doc_id: docIdToDelete })
        })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                showAlert("success", "Documento eliminado. Redirigiendo...");
                setTimeout(() => {
                    window.location.href = "/administrar_documentos";
                }, 1500);
            } else {
                showAlert("error", res.error || "Error al eliminar.");
            }
        })
        .catch(err => {
            console.error(err);
            showAlert("error", "Error de conexión.");
        })
        .finally(() => {
            toggleSpinner(false);
            if ($deleteModal) $deleteModal.classList.add("hidden");
        });
    });
  }
});