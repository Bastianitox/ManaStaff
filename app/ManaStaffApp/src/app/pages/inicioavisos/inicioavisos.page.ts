import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

interface Publicacion {
  id: string
  titulo: string
  resumen: string
  contenido: string
  tipo: "noticia" | "aviso"
  fecha_publicacion: string
}

const MOCK_PUBLICACIONES: Publicacion[] = [
  {
    id: "1",
    titulo: "Nueva política de trabajo remoto",
    resumen:
      "A partir del próximo mes, se implementará una nueva política de trabajo híbrido para todos los empleados.",
    contenido: "Contenido completo de la noticia...",
    tipo: "noticia",
    fecha_publicacion: "2024-10-28",
  },
  {
    id: "2",
    titulo: "Mantenimiento programado del sistema",
    resumen: "El sistema estará en mantenimiento el próximo sábado de 2:00 AM a 6:00 AM.",
    contenido: "Contenido completo del aviso...",
    tipo: "aviso",
    fecha_publicacion: "2024-10-27",
  },
  {
    id: "3",
    titulo: "Celebración aniversario de la empresa",
    resumen: "Este viernes celebraremos el 25° aniversario de nuestra empresa con un evento especial.",
    contenido: "Contenido completo de la noticia...",
    tipo: "noticia",
    fecha_publicacion: "2024-10-26",
  },
  {
    id: "4",
    titulo: "Actualización de políticas de seguridad",
    resumen: "Se han actualizado las políticas de seguridad informática. Por favor, revisa los nuevos lineamientos.",
    contenido: "Contenido completo del aviso...",
    tipo: "aviso",
    fecha_publicacion: "2024-10-25",
  },
  {
    id: "5",
    titulo: "Nuevo programa de capacitación",
    resumen: "Lanzamos un nuevo programa de capacitación continua para el desarrollo profesional de nuestro equipo.",
    contenido: "Contenido completo de la noticia...",
    tipo: "noticia",
    fecha_publicacion: "2024-10-24",
  },
  {
    id: "6",
    titulo: "Cambio en horario de atención",
    resumen: "A partir del lunes, el horario de atención al público será de 8:00 AM a 5:00 PM.",
    contenido: "Contenido completo del aviso...",
    tipo: "aviso",
    fecha_publicacion: "2024-10-23",
  },
]

@Component({
  selector: 'app-inicioavisos',
  templateUrl: './inicioavisos.page.html',
  styleUrls: ['./inicioavisos.page.scss'],
  standalone: false
})
export class InicioavisosPage implements OnInit {
  publicaciones: Publicacion[] = [...MOCK_PUBLICACIONES]
  filteredPublicaciones: Publicacion[] = [...MOCK_PUBLICACIONES]
  searchQuery = ""
  isLoading = false

  filters = {
    tipo: "todas" as "todas" | "noticia" | "aviso",
    sort: "desc" as "asc" | "desc",
  }

  showFilterModal = false

  constructor(private router: Router) {}

  ngOnInit() {
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value || ""
    this.applyFilters()
  }

  openFilterModal() {
    this.showFilterModal = true
  }

  closeFilterModal() {
    this.showFilterModal = false
  }

  applyFilters() {
    let filtered = [...this.publicaciones]

    // Filtrar por texto de búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (pub) => pub.titulo.toLowerCase().includes(query) || pub.resumen.toLowerCase().includes(query),
      )
    }

    // Filtrar por tipo
    if (this.filters.tipo !== "todas") {
      filtered = filtered.filter((pub) => pub.tipo === this.filters.tipo)
    }

    // Ordenar por fecha
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_publicacion).getTime()
      const dateB = new Date(b.fecha_publicacion).getTime()
      return this.filters.sort === "desc" ? dateB - dateA : dateA - dateB
    })

    this.filteredPublicaciones = filtered
    this.closeFilterModal()
  }

  clearFilters() {
    this.filters.tipo = "todas"
    this.filters.sort = "desc"
    this.searchQuery = ""
    this.applyFilters()
  }

  viewDetails(id: string) {
    this.router.navigateByUrl(`/tabs/noticias/detalle/`);
    //console.log("Ver detalles de publicación:", id)
  }
}