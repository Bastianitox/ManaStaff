document.addEventListener("DOMContentLoaded", () => {
  // Variables globales
  let pdfDoc = null
  let pageNum = 1
  let pageRendering = false
  let pageNumPending = null
  let scale = 1.0
  const canvas = document.getElementById("pdfCanvas")
  const ctx = canvas.getContext("2d")
  const pdfjsLib = window["pdfjs-dist/build/pdf"]

  // Elementos del DOM
  const loadingMessage = document.getElementById("loadingMessage")
  const errorMessage = document.getElementById("errorMessage")
  const documentName = document.getElementById("documentName")
  const prevPageBtn = document.getElementById("prevPage")
  const nextPageBtn = document.getElementById("nextPage")
  const pageInput = document.getElementById("pageInput")
  const totalPagesSpan = document.getElementById("totalPages")
  const zoomInBtn = document.getElementById("zoomIn")
  const zoomOutBtn = document.getElementById("zoomOut")
  const fitWidthBtn = document.getElementById("fitWidth")
  const zoomLevelSpan = document.getElementById("zoomLevel")
  const downloadBtn = document.getElementById("downloadBtn")

  // Configurar PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search)
  const documentTitle = urlParams.get("doc") || "Documento"
  const pdfPath = urlParams.get("path") || "/static/pdf/documento.pdf"

  // Establecer nombre del documento
  documentName.textContent = documentTitle

  // Cargar PDF
  loadPDF(pdfPath)

  function loadPDF(url) {
    console.log("[v0] Loading PDF from:", url)

    pdfjsLib
      .getDocument(url)
      .promise.then((pdfDoc_) => {
        pdfDoc = pdfDoc_
        totalPagesSpan.textContent = pdfDoc.numPages

        // Ocultar mensaje de carga y mostrar canvas
        loadingMessage.style.display = "none"
        canvas.style.display = "block"

        // Renderizar primera página
        renderPage(pageNum)

        // Habilitar controles
        updateControls()

        console.log("[v0] PDF loaded successfully. Total pages:", pdfDoc.numPages)
      })
      .catch((error) => {
        console.error("[v0] Error loading PDF:", error)
        showError()
      })
  }

  function renderPage(num) {
    pageRendering = true

    // Obtener página
    pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: scale })
      canvas.height = viewport.height
      canvas.width = viewport.width

      // Renderizar página en canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      }

      const renderTask = page.render(renderContext)

      renderTask.promise.then(() => {
        pageRendering = false
        if (pageNumPending !== null) {
          renderPage(pageNumPending)
          pageNumPending = null
        }
        console.log("[v0] Page rendered:", num)
      })
    })

    // Actualizar controles
    pageInput.value = num
    updateControls()
  }

  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num
    } else {
      renderPage(num)
    }
  }

  function updateControls() {
    // Actualizar botones de navegación
    prevPageBtn.disabled = pageNum <= 1
    nextPageBtn.disabled = pageNum >= pdfDoc.numPages

    // Actualizar zoom
    zoomLevelSpan.textContent = Math.round(scale * 100) + "%"

    // Actualizar input de página
    pageInput.max = pdfDoc.numPages
  }

  function showError() {
    loadingMessage.style.display = "none"
    errorMessage.style.display = "flex"
    canvas.style.display = "none"
  }

  // Event listeners
  prevPageBtn.addEventListener("click", () => {
    if (pageNum <= 1) return
    pageNum--
    queueRenderPage(pageNum)
  })

  nextPageBtn.addEventListener("click", () => {
    if (pageNum >= pdfDoc.numPages) return
    pageNum++
    queueRenderPage(pageNum)
  })

  pageInput.addEventListener("change", function () {
    const inputPage = Number.parseInt(this.value)
    if (inputPage >= 1 && inputPage <= pdfDoc.numPages) {
      pageNum = inputPage
      queueRenderPage(pageNum)
    } else {
      this.value = pageNum
    }
  })

  zoomInBtn.addEventListener("click", () => {
    scale += 0.25
    queueRenderPage(pageNum)
  })

  zoomOutBtn.addEventListener("click", () => {
    if (scale > 0.25) {
      scale -= 0.25
      queueRenderPage(pageNum)
    }
  })

  fitWidthBtn.addEventListener("click", () => {
    const container = document.querySelector(".pdf-viewer")
    const containerWidth = container.clientWidth - 60 // Padding

    if (pdfDoc) {
      pdfDoc.getPage(1).then((page) => {
        const viewport = page.getViewport({ scale: 1.0 })
        scale = containerWidth / viewport.width
        queueRenderPage(pageNum)
      })
    }
  })

  downloadBtn.addEventListener("click", () => {
    // Crear enlace de descarga
    const link = document.createElement("a")
    link.href = pdfPath
    link.download = documentTitle + ".pdf"
    link.click()
  })

  // Navegación con teclado
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowLeft":
        if (pageNum > 1) {
          pageNum--
          queueRenderPage(pageNum)
        }
        break
      case "ArrowRight":
        if (pageNum < pdfDoc.numPages) {
          pageNum++
          queueRenderPage(pageNum)
        }
        break
    }
  })
})
