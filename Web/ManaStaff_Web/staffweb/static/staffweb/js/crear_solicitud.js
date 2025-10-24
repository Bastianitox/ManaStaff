let selectedFile = null;

// ========== DOM Elements ==========
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('fileInput');
const uploadedFile = document.getElementById('uploadedFile');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const requestForm = document.getElementById('requestForm');
const submitBtn = document.getElementById('submitBtn');

// Mensajes inline 
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Overlay de carga
const loadingOverlay = document.getElementById("loadingOverlay");

// ========== Listeners de archivo ==========
fileUploadArea.addEventListener('click', () => fileInput.click());
fileUploadArea.addEventListener('dragover', handleDragOver);
fileUploadArea.addEventListener('dragleave', handleDragLeave);
fileUploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
removeFileBtn.addEventListener('click', removeFile);

// ========== Alerta centrada ==========
function showAlert(type, message) {
  const successEl = document.getElementById('successAlert');
  const errorEl   = document.getElementById('errorAlert');

  // Oculta cualquier alerta visible antes de mostrar la nueva
  [successEl, errorEl].forEach(el => {
    if (!el) return;
    el.classList.add('hide');
    el.style.display = 'none';
  });

  const alertEl = type === 'success' ? successEl : errorEl;
  const messageEl = type === 'success'
    ? document.getElementById('successMessageAlert')
    : document.getElementById('errorMessageAlert');

  messageEl.textContent = message;
  alertEl.style.display = 'flex';
  alertEl.classList.remove('hide');

  // Duración
  setTimeout(() => {
    alertEl.classList.add('hide');
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 400); 
  }, 5200);
}

// Drag & Drop 
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
  // Validación de tipo
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  if (!allowedTypes.includes(file.type)) {
    showError('Tipo de archivo no permitido. Solo se aceptan PDF, DOC, DOCX, JPG y PNG.');
    return;
  }

  // Validación de tamaño (10MB)
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

// Submit del formulario
requestForm.addEventListener('submit', handleSubmit);

async function handleSubmit(e) {
  e.preventDefault();

  // Chequeo rápido de campos requeridos 
  const type = document.getElementById('requestType').value;
  const title = document.getElementById('requestTitle').value;
  const description = document.getElementById('requestDescription').value;

  if (!type || !title || !description) {
    showError('Por favor completa todos los campos requeridos.');
    return;
  }

  // Mostrar overlay y deshabilitar botón
  loadingOverlay.classList.add("show");
  submitBtn.disabled = true;

  // Forzar repaint para que se vea la animación del overlay
  await new Promise(requestAnimationFrame);

  const url = `/crear_solicitud_funcion`;
  let formData = new FormData(requestForm);

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
    loadingOverlay.classList.remove("show");
    submitBtn.disabled = false;

    if (result.status === "success") {
      // Texto de éxito
      showAlert(
        'success',
        '¡Solicitud enviada exitosamente! Tu solicitud ha sido registrada y está siendo procesada.'
      );

      setTimeout(() => {
        window.location.href = "/inicio_solicitudes";
      }, 2400);
    } else {
      showAlert('error', result.message || "Error al crear la solicitud.");
    }
  } catch (error) {
    loadingOverlay.classList.remove("show");
    submitBtn.disabled = false;
    console.error(error);
    showAlert('error', "Error al enviar el formulario.");
  }
}

// Utilidades de mensajes inline 
function resetForm() {
  requestForm.reset();
  removeFile();
  hideMessages();
}

function showError(message) {
  hideMessages();
  errorText.textContent = message;
  errorMessage.classList.add('show');
}

function hideMessages() {
  if (successMessage) successMessage.classList.remove('show');
  if (errorMessage) errorMessage.classList.remove('show');
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
  hideMessages();
});