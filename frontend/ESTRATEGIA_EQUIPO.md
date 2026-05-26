# 🏛️ Guía de Arquitectura y Estrategia de Equipo - SGH UNT

Este documento establece la estrategia unificada para que los 4 integrantes del equipo trabajen en paralelo de manera eficiente.

## 🧬 Estrategia de Datos (Seed Centralizado)

Para evitar duplicidad y conflictos, usaremos un **único archivo de semilla**: [seed.ts]

### Cómo trabajar con el Seed:
1. **Datos Base**: No modifiques la primera sección (Usuarios, Docentes, Cursos) a menos que sea estrictamente necesario para todo el equipo.
2. **Secciones Modulares**: Agrega tus datos específicos dentro de los bloques `if (process.env.SEED_MODULO === 'true')`.
3. **Ejecución**: 
   - Solo base: `npx prisma db seed`
   - Con tu módulo: `$env:SEED_REPORTES='true'; npx prisma db seed` (Windows PowerShell)

---

## 📅 Plan de Trabajo por Integrante

### **Integrante 1: Reporte de Gestión PDF**
- **Objetivo**: Generar reporte con estadísticas descriptivas y observaciones automáticas.
- **Archivos Clave**:
  - `src/services/reportes/ServicioEstadisticas.ts` (Creado)
  - `src/app/api/reportes/route.ts` (Modificar para incluir `tipo=gestion`)
  - `src/services/reportes/GeneradorPDF.ts` (Asegurar compatibilidad con tablas estadísticas)
- **Integración Seed**: Agregar asignaciones masivas en la sección `SEED_REPORTES`.

### **Integrante 2: Validaciones y Conflictos**
- **Objetivo**: Completar los 8 tipos de validación y registrar incidentes en la tabla `conflicto_horario`.
- **Archivos Clave**:
  - `src/services/horarios/ValidadorHorario.ts` (Modificado para registro de conflictos)
  - `src/app/api/dashboard/stats/route.ts` (Asegurar que los KPIs de conflictos se cuenten correctamente)
- **Integración Seed**: Crear escenarios de cruces en `SEED_CONFLICTOS`.

### **Integrante 3: Notificaciones (Telegram + Cola)**
- **Objetivo**: Webhook funcional para registro de `chat_id` y procesamiento de cola cada minuto.
- **Archivos Clave**:
  - `src/app/api/telegram/webhook/route.ts`
  - `src/services/notificaciones/ServicioNotificador.ts`
  - `src/lib/programadorTareas.ts` (Configuración de `node-cron`)
- **Integración Seed**: Agregar docentes con teléfonos y ventanas próximas en `SEED_NOTIFICACIONES`.

### **Integrante 4: Mejoras de Diseño y UX**
- **Objetivo**: Matriz responsiva, estados de carga (skeletons) y feedback (toasts).
- **Archivos Clave**:
  - `src/components/horarios/MatrizDisponibilidad.tsx`
  - `src/components/ui/` (Añadir skeletons)
  - `src/app/globals.css` (Estilos de la matriz)

---

---

## 🚀 Cómo Iniciar
1. Clonar repositorio.
2. `npm install`
3. Configurar `.env` (Ver README principal).
4. Ejecutar el seed base.
5. Iniciar desarrollo en tu rama asignada.
