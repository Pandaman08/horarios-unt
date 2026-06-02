# Resumen de Cambios: Microfase de Ajustes Académicos (2026-I)

Este documento detalla las modificaciones realizadas en el sistema para la optimización de la carga horaria y la generación de reportes institucionales.

## 1. Cambios en la Base de Datos (Prisma)
- **Modelo `Curso`**: 
  - Se eliminaron los campos individuales de horas (teoría, práctica, lab) para simplificar la estructura.
  - Se añadió el campo `maximo_docentes` (default: 1) para controlar la capacidad de asignación por asignatura.
- **Relaciones**: Se optimizó la consulta de horarios para filtrar correctamente por `id_ciclo` a través de las relaciones con `Curso` y `Grupo`.

## 2. Gestión de Cursos y Docentes
- **Validación de Capacidad**: En el módulo de asignación, ahora se valida en tiempo real si un curso ha alcanzado su `maximo_docentes`. Las celdas se deshabilitan y muestran el estado "Lleno" automáticamente.
- **Simplificación UI**: Se eliminó la opción redundante de "Asignar Cursos" en el perfil del docente para centralizar la gestión en la carga horaria.
- **Mejoras en Carga Lectiva**: 
  - Los nombres largos de cursos ahora se truncan con un "..." y muestran el nombre completo al pasar el mouse (Popover).
  - El selector de grupos ahora es dinámico y solo muestra los grupos correspondientes al curso seleccionado.

## 3. Generación de Reportes PDF (Nivel Institucional)
Se ha reestructurado completamente el motor de reportes en `src/app/api/reportes/pdf/route.ts`:
- **Agrupación de Horas (Rowspan)**: Las clases que duran 2 o más horas consecutivas ahora se muestran en una sola celda unificada, eliminando las divisiones horizontales.
- **Clases Paralelas**: Se implementó una lógica de visualización "lado a lado" para cuando dos o más cursos comparten el mismo horario y ambiente, utilizando contenedores flexbox que ocupan el 100% de la celda.
- **Conversión Real a PDF**: Se integró **Puppeteer** en el backend para generar archivos PDF binarios reales. Esto soluciona el error de "No se puede abrir el archivo" y permite que los documentos sean compatibles con cualquier visor de PDF.
- **Estética y Centrado**: 
  - Todo el contenido de las celdas (Número de curso, Ambiente, Tipo de clase) está perfectamente centrado.
  - Se utiliza la tipografía 'Inter' para una apariencia moderna y profesional.
  - El reporte general se genera automáticamente en formato horizontal (Landscape).

## 4. Actualización de Datos (Seeders)
- Se actualizaron los seeders para el periodo **2026-I**.
- Se incluyó el `CargaLectivaSeeder` para poblar el sistema con datos de prueba realistas para la nueva estructura.

## 5. Instrucciones para Sincronización
Para que estos cambios se reflejen en los entornos locales de los demás compañeros, deben ejecutar:
```bash
# Instalar nuevas dependencias (Puppeteer)
npm install

# Sincronizar el esquema de la base de datos
npx prisma db push

# (Opcional) Recargar datos de prueba
npx prisma db seed
```

---
*Generado por el Asistente de Desarrollo - Junio 2026*
