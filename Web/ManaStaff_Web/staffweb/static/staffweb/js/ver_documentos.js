document.addEventListener("DOMContentLoaded", () => {
  // Variables globales
  let currentZoom = 100

  // Elementos del DOM
  const pdfViewer = document.getElementById("pdfViewer")
  const zoomInBtn = document.getElementById("zoomIn")
  const zoomOutBtn = document.getElementById("zoomOut")
  const zoomLevel = document.getElementById("zoomLevel")
  const fallbackMessage = document.getElementById("fallbackMessage")

  // Inicialización
  init()

  function init() {
    setupEventListeners()
    checkPDFSupport()
    updateUI()
  }

  function setupEventListeners() {
    // Controles de zoom
    zoomInBtn.addEventListener("click", zoomIn)
    zoomOutBtn.addEventListener("click", zoomOut)

    // Eventos de teclado simplificados
    document.addEventListener("keydown", handleKeyboard)

    // Detectar cambios en el iframe
    pdfViewer.addEventListener("load", onPDFLoad)
    pdfViewer.addEventListener("error", onPDFError)

    // Responsive - ajustar en cambio de tamaño
    window.addEventListener("resize", handleResize)
  }

  function checkPDFSupport() {
    // Verificar si el navegador soporta PDFs
    const isSupported =
      navigator.mimeTypes["application/pdf"] ||
      navigator.plugins["Chrome PDF Viewer"] ||
      navigator.plugins["WebKit built-in PDF"]

    if (!isSupported) {
      showFallback()
    }
  }

  function onPDFLoad() {
    console.log("[v0] PDF cargado correctamente")
    hideFallback()
  }

  function onPDFError() {
    console.log("[v0] Error al cargar PDF")
    showFallback()
  }

  function showFallback() {
    pdfViewer.style.display = "none"
    fallbackMessage.style.display = "flex"
  }

  function hideFallback() {
    pdfViewer.style.display = "block"
    fallbackMessage.style.display = "none"
  }

  function zoomIn() {
    if (currentZoom < 200) {
      currentZoom += 25
      applyZoom()
    }
  }

  function zoomOut() {
    if (currentZoom > 50) {
      currentZoom -= 25
      applyZoom()
    }
  }

  function applyZoom() {
    // Para iframe, el zoom es limitado, pero podemos cambiar el tamaño del contenedor
    const scale = currentZoom / 100
    pdfViewer.style.transform = `scale(${scale})`
    pdfViewer.style.transformOrigin = "top left"

    // Ajustar el contenedor para el zoom
    const container = pdfViewer.parentElement
    container.style.overflow = currentZoom > 100 ? "auto" : "hidden"

    updateZoomLevel()
  }

  function updateZoomLevel() {
    zoomLevel.textContent = currentZoom + "%"
  }

  function handleKeyboard(event) {
    switch (event.key) {
      case "+":
      case "=":
        event.preventDefault()
        zoomIn()
        break
      case "-":
        event.preventDefault()
        zoomOut()
        break
    }
  }

  function handleResize() {
    // Reajustar el visor en cambios de tamaño
    if (currentZoom !== 100) {
      applyZoom()
    }
  }

  function updateUI() {
    updateZoomLevel()
  }

  // Exponer funciones globales si es necesario
  window.PDFViewer = {
    zoomIn,
    zoomOut,
  }
})