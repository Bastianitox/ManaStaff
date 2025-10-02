let selectedFile = null;

// DOM Elements
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('fileInput');
const uploadedFile = document.getElementById('uploadedFile');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const requestForm = document.getElementById('requestForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// File Upload Handlers
fileUploadArea.addEventListener('click', () => fileInput.click());
fileUploadArea.addEventListener('dragover', handleDragOver);
fileUploadArea.addEventListener('dragleave', handleDragLeave);
fileUploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
removeFileBtn.addEventListener('click', removeFile);

function handleDragOver(e) {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showError('Tipo de archivo no permitido. Solo se aceptan PDF, DOC, DOCX, JPG y PNG.');
        return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showError('El archivo es demasiado grande. El tamaño máximo es 10MB.');
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileUploadArea.style.display = 'none';
    uploadedFile.style.display = 'flex';
}

function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    fileUploadArea.style.display = 'block';
    uploadedFile.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form Submission
requestForm.addEventListener('submit', handleSubmit);
const loadingOverlay = document.getElementById("loadingOverlay");

async function handleSubmit(e) {
    
    e.preventDefault()
    var formData = {
        type: document.getElementById('requestType').value,
        title: document.getElementById('requestTitle').value,
        description: document.getElementById('requestDescription').value,
        file: selectedFile
    };

    // Validate required fields
    if (!formData.type || !formData.title || !formData.description) {
        showError('Por favor completa todos los campos requeridos.');
        return;
    }

    // Mostrar overlay y deshabilitar botón
    loadingOverlay.classList.remove("hidden");
    submitBtn.disabled = true;

    // Forzar redraw para asegurar que la animación se muestre
    await new Promise(requestAnimationFrame);

    const url = `/crear_solicitud_funcion`;
    formData = new FormData(requestForm);

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        },
      });

      const result = await response.json();

      // Ocultar overlay y habilitar botón
      loadingOverlay.classList.add("hidden");
      submitBtn.disabled = false;

      if (result.status === "success") {
        mostrarMensajeExito();
      } else {
        alert(result.message || "Error al crear solicitud");
      }
    } catch (error) {
      loadingOverlay.classList.add("hidden");
      submitBtn.disabled = false;
      console.error(error);
      alert("Error al enviar el formulario");
    }
}

function mostrarMensajeExito() {
  const mensaje = document.getElementById("successMessage")
  mensaje.classList.add("show")
  setTimeout(() => {
    setTimeout(() => {
      window.location.href = "/inicio_solicitudes"
    }, 150)
  }, 300)
}


function resetForm() {
    requestForm.reset();
    removeFile();
    hideMessages();
}

function showSuccess() {
    hideMessages();
    successMessage.classList.add('show');
}

function showError(message) {
    hideMessages();
    errorText.textContent = message;
    errorMessage.classList.add('show');
}

function hideMessages() {
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    hideMessages();
});