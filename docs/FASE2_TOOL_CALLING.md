# FASE 2: Tool Calling y Acceso a Datos Reales
## Documentación Técnica

---

## 1. Archivos Nuevos
| Archivo | Ruta | Propósito |
|---------|------|-----------|
| ToolRegistry.ts | `src/services/ai/` | Registro formal de herramientas, validación y generación de definiciones para Groq |
| AuditLogger.ts | `src/services/ai/` | Logger de auditoría para todas las llamadas a herramientas (usa `AuditoriaHorario`) |
| index.ts (tools) | `src/services/ai/tools/` | Implementación de las 4 herramientas de lectura |

---

## 2. Archivos Modificados
| Archivo | Cambios Realizados |
|---------|---------------------|
| AIToolDispatcher.ts | Reemplazado el placeholder por implementación completa con permisos, validación y auditoría |
| GroqClient.ts | Integrado Tool Calling: detección de tool calls, ejecución via AIToolDispatcher, segunda llamada a Groq con resultados |
| route.ts (chatbot API) | Añadido obtención de docenteId (para docentes), ipAddress, y paso de contexto completo a GroqClient |

---

## 3. Flujo Completo de Ejecución

1. **Usuario envía mensaje** → `ChatWidget` → `ChatbotService.processMessage()`
2. **API Route `/api/chatbot`**:
   - Valida sesión via `getServerSession()`
   - Obtiene docenteId (si es docente) via Prisma
   - Obtiene IP address
3. **GroqClient.generateResponse()**:
   - Registra herramientas via `import('./tools/index')`
   - Primera llamada a Groq con `tools:` (definiciones del ToolRegistry)
4. **Si hay tool calls**:
   - Construye `ToolContext`
   - `AIToolDispatcher.dispatchMultiple()`:
     - Valida existencia de herramienta
     - Valida permisos por rol
     - Valida parámetros via Zod
     - Ejecuta handler de la herramienta
     - Registra auditoría via `AuditLogger`
   - Construye array de mensajes incluyendo resultados de herramientas
   - Segunda llamada a Groq para obtener respuesta final
5. **Respuesta final** → `ChatWidget` → UI

---

## 4. Herramientas Implementadas
| Nombre | Roles Permitidos | Descripción |
|--------|------------------|-------------|
| `obtenerHorarioPropio` | docente | Obtiene horario personal del docente autenticado |
| `consultarAulasLibres` | administrador_sistema, operador_horarios | Consulta ambientes disponibles en horario específico |
| `obtenerEstadisticasGestion` | administrador_sistema, operador_horarios | Obtiene estadísticas generales del período |
| `validarCambioHorario` | *todos* | Valida conflictos de un posible cambio de horario |

---

## 5. Riesgos de Seguridad y Mitigaciones
| Riesgo | Mitigación |
|--------|------------|
| Ejecución de herramientas sin permisos | Cada herramienta define `requiredRoles`, `AIToolDispatcher` valida antes de ejecutar |
| Parámetros maliciosos | Validación de parámetros via Zod schemas |
| No hay registro de acciones | Todas las tool calls se registran en `AuditoriaHorario` |
| Exposición de datos sensibles | Las herramientas solo devuelven datos necesarios, según rol |

---

## 6. Estrategia para `confirmarAsignacion()` (Fase Futura)
Para herramientas de escritura (como confirmar una asignación de horario), se recomienda:
1. **Añadir paso de confirmación explícito**: En ChatWidget, mostrar resumen de la acción y botón "Confirmar"
2. **Tool con 2 pasos**:
   - Paso 1: `simularAsignacion()` (solo lectura, muestra conflictos)
   - Paso 2: `confirmarAsignacion(simulacionId)` (requiere confirmación del usuario)
3. **Registro de auditoría detallado**: Incluir datos anteriores y nuevos
4. **Validación adicional**: Verificar que la simulación sea reciente (< 5 minutos)
5. **Permisos restrictivos**: Solo `operador_horarios` y `administrador_sistema`

---

## 7. Estado
✅ **Fase 2 Completa** - Tool Calling y acceso a datos reales implementados
