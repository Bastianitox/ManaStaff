const documentsData = [
  {
    id: 1,
    title: "Contrato de trabajo",
    format: "PDF",
    size: "2.4MB",
    date: "15 Diciembre, 2024",
    available: true,
    filePath: "/static/staffweb/pdf/Contrato.pdf",
  },
  {
    id: 2,
    title: "Certificado médico",
    format: "PDF",
    size: "1.8MB",
    date: "10 Diciembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 3,
    title: "Nómina Noviembre",
    format: "PDF",
    size: "950KB",
    date: "30 Noviembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 4,
    title: "Vacaciones 2024",
    format: "PDF",
    size: "1.2MB",
    date: "20 Noviembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 5,
    title: "Seguro médico",
    format: "PDF",
    size: "3.1MB",
    date: "05 Noviembre, 2024",
    available: false,
    filePath: null,
  },
  {
    id: 6,
    title: "Evaluación anual",
    format: "PDF",
    size: "1.7MB",
    date: "25 Octubre, 2024",
    available: false,
    filePath: null,
  },
]

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] ver_documentos loaded, initializing viewer")

  const documentTitle = document.getElementById("documentTitle")
  const documentMeta = document.getElementById("documentMeta")
  const documentContent = document.getElementById("documentContent")
  const downloadBtn = document.getElementById("downloadBtn")

  const urlParams = new URLSearchParams(window.location.search)
  const docId = Number.parseInt(urlParams.get("docId"))
  const docTitle = urlParams.get("doc")

  console.log("[v0] URL params - docId:", docId, "docTitle:", docTitle)

  const foundDocument = documentsData.find((doc) => doc.id === docId)
  console.log("[v0] Found document:", foundDocument)

  if (foundDocument && foundDocument.available) {
    documentTitle.textContent = foundDocument.title
    documentMeta.innerHTML = `
            <span class="meta-item">
                <strong>Formato:</strong> ${foundDocument.format}
            </span>
            <span class="meta-item">
                <strong>Tamaño:</strong> ${foundDocument.size}
            </span>
            <span class="meta-item">
                <strong>Fecha:</strong> ${foundDocument.date}
            </span>
        `

    documentContent.innerHTML = `
            <div class="pdf-viewer">
                <iframe src="${foundDocument.filePath}" width="100%" height="600px" frameborder="0">
                    <p>Tu navegador no soporta la visualización de PDFs. 
                    <a href="${foundDocument.filePath}" target="_blank">Haz clic aquí para descargar el archivo</a>.</p>
                </iframe>
            </div>
        `

    downloadBtn.addEventListener("click", () => {
      const link = document.createElement("a")
      link.href = foundDocument.filePath
      link.download = `${foundDocument.title}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  } else {
    documentTitle.textContent = docTitle || "Documento no encontrado"
    documentMeta.innerHTML = `
            <span class="meta-item error">
                <strong>Estado:</strong> No disponible
            </span>
        `

    documentContent.innerHTML = `
            <div class="document-not-found">
                <div class="not-found-icon">
                    <svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5A1.5,1.5 0 0,1 10.5,9A1.5,1.5 0 0,1 12,7.5A1.5,1.5 0 0,1 13.5,9A1.5,1.5 0 0,1 12,10.5Z"/>
                    </svg>
                </div>
                <h3>Documento no encontrado</h3>
                <p>El documento solicitado no está disponible o no se pudo encontrar.</p>
                <button class="back-to-documents" onclick="window.location.href='/inicio_documentos/'">
                    Volver a Mis Documentos
                </button>
            </div>
        `

    downloadBtn.disabled = true
    downloadBtn.style.opacity = "0.5"
    downloadBtn.style.cursor = "not-allowed"
  }
})
