import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

interface Publicacion {
  id: string
  titulo: string
  contenido: string
  tipo: "noticia" | "aviso"
  fecha_publicacion: string
}

@Component({
  selector: 'app-detalleavisos',
  templateUrl: './detalleavisos.page.html',
  styleUrls: ['./detalleavisos.page.scss'],
  standalone: false
})
export class DetalleavisosPage implements OnInit {
  // Datos mock de la publicación
  publicacion: Publicacion = {
    id: "1",
    titulo: "Actualización del sistema de gestión documental",
    contenido: `Estimados colaboradores,

Nos complace informarles que el próximo lunes 15 de enero se implementará una actualización importante en nuestro sistema de gestión documental.

Esta actualización incluye:
- Mejoras en la velocidad de carga de documentos
- Nueva interfaz más intuitiva y moderna
- Funcionalidad de búsqueda avanzada
- Integración con herramientas de colaboración

El sistema estará temporalmente fuera de servicio entre las 6:00 AM y 8:00 AM para realizar la actualización. Les recomendamos descargar cualquier documento importante antes de ese horario.

Para cualquier consulta o soporte técnico, pueden contactar al equipo de TI a través del correo soporte@empresa.com

Agradecemos su comprensión y colaboración.

Atentamente,
Equipo de Tecnología`,
    tipo: "noticia",
    fecha_publicacion: "2024-01-15",
  }

  constructor(private router: Router) {}

  ngOnInit() {
  }

  goBack() {
    this.router.navigateByUrl("/tabs/noticias")
  }
}