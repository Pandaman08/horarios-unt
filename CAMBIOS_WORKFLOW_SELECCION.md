# 📋 Cambios Implementados: Nuevo Workflow de Selección de Horarios

**Fecha**: 2026
**Objetivo**: Migrar de validación dependiente de estado APROBADO a validación basada en CargaLectiva + Ventana de Atención activa

---

## 🎯 Cambios Realizados

### 1. **ValidadorHorario.ts** - Desactivación de validaciones basadas en APROBADO

**Archivo**: `src/services/horarios/ValidadorHorario.ts`

#### 1.1 - Eliminación de `validarDeclaracionAprobada` del pipeline
- **Línea 48**: Se comentó la llamada a `validarDeclaracionAprobada()` en el array de validaciones
- **Razón**: Según el nuevo workflow, los docentes pueden seleccionar horarios sin esperar aprobación de declaración

**Antes**:
```typescript
const validaciones = [
  // ... otras validaciones ...
  this.validarDeclaracionAprobada(solicitud),  // ❌ Se ejecutaba
];
```

**Después**:
```typescript
const validaciones = [
  // ... otras validaciones ...
  // COMENTADO: La validación de APROBADO ya no es requerida por el nuevo flujo
  // this.validarDeclaracionAprobada(solicitud),  // ✅ Desactivada
];
```

#### 1.2 - Modificación de `validarCursoAsignable`
- **Línea 345**: Se removió la condición `estado: 'APROBADO'` de la búsqueda de `cargaLectiva`
- **Mensaje actualizado**: "en su carga horaria" (en lugar de "dentro de su carga horaria aprobada")

**Antes**:
```typescript
const habilitadoDeclaracion = await prisma.cargaLectiva.findFirst({
  where: {
    id_curso: s.cursoId,
    tipo_clase: s.tipoClase,
    declaracion: {
      id_docente: s.docenteId,
      id_periodo: s.periodoId,
      estado: 'APROBADO'  // ❌ Obligatorio
    }
  }
});
```

**Después**:
```typescript
const habilitadoDeclaracion = await prisma.cargaLectiva.findFirst({
  where: {
    id_curso: s.cursoId,
    tipo_clase: s.tipoClase,
    declaracion: {
      id_docente: s.docenteId,
      id_periodo: s.periodoId
      // ✅ Sin restricción de estado
    }
  }
});
```

#### 1.3 - Desactivación de `validarDeclaracionAprobada` como método
- **Línea 451**: Método mantenido pero su lógica comentada para compatibilidad futura
- **Documentación añadida**: Explicación de por qué se desactiva

---

### 2. **API Endpoints - Validación de Tipos TypeScript**

#### 2.1 - `src/app/api/horarios/disponibilidad-matriz/route.ts`
- **Línea 54**: Agregado tipo `any` al parámetro `v` en método `find()`
- **Línea 60**: Agregado tipo `any` al parámetro `v` en método `map()`

#### 2.2 - `src/app/api/horarios/seleccionar-celda/route.ts`
- **Línea 44**: Agregado tipo `any` al parámetro `v` en método `find()`
- **Línea 50**: Agregado tipo `any` al parámetro `v` en método `map()`

#### 2.3 - `src/services/reportes/GeneradorExcel.ts`
- **Línea 154 y 205**: Cambio de cast `as Buffer` a `as unknown as Buffer` para satisfacer TypeScript strict mode

---

## 📊 Flujo de Validación - ANTES vs DESPUÉS

### ❌ ANTES (Bloqueado por APROBADO)
```
Docente selecciona horario
    ↓
¿Tiene CargaLectiva?
    ↓
¿Estado declaración = APROBADO? ← BLOQUEA SI NO
    ↓
¿Dentro de ventana de atención?
    ↓
Validaciones adicionales (cruces, ambientes, etc)
    ↓
✅ Horario seleccionado
```

### ✅ DESPUÉS (Solo CargaLectiva + Ventana)
```
Docente selecciona horario
    ↓
¿Tiene CargaLectiva? (cualquier estado) ← PERMITE BORRADOR, ENVIADO, etc
    ↓
¿Dentro de ventana de atención?
    ↓
Validaciones adicionales (cruces, ambientes, etc)
    ↓
✅ Horario seleccionado (temporal)
    ↓
En confirmar-seleccion: declaración → LECTIVA_CONFIRMADA
```

---

## 🔄 Endpoints Afectados

### 1. `/api/horarios/disponibilidad-matriz` (GET)
**Estado**: ✅ Modificado
- Mantiene validación de CargaLectiva
- Mantiene validación de ventana de atención
- Devuelve `tienePermiso: true` si ambas validaciones pasan

### 2. `/api/horarios/seleccionar-celda` (POST)
**Estado**: ✅ Modificado por ValidadorHorario
- Validador ya no verifica APROBADO
- Solo valida presencia de CargaLectiva (sin restricción de estado)
- Valida ventana de atención
- Crea `SeleccionTemporalHorario`

### 3. `/api/horarios/confirmar-seleccion` (POST)
**Estado**: ⚠️ Requiere verificación
- Convierte temporales a `HorarioAsignado`
- Debe actualizar declaración a `LECTIVA_CONFIRMADA`
- Actualmente ya tiene lógica para esto

### 4. `/dashboard/horarios/seleccion` (Cliente)
**Estado**: ⚠️ Puede necesitar actualizar mensajes de error
- Mensaje "Su carga horaria aún no está aprobada" ya no debería mostrarse
- Mostrar: "No tienes cursos asignados para este período" o "Estás fuera de tu ventana de atención"

---

## ✅ Validaciones que SÍ se Mantienen

Los siguientes validadores siguen activos y funcionan normalmente:

1. **validarCruceDocente**: Evita que un docente se asigne a dos lugares a la vez
2. **validarCruceGrupo**: Evita que un grupo tenga dos docentes en mismo bloque
3. **validarOcupacionAmbiente**: Evita que un ambiente esté doble asignado
4. **validarExcesoCargaDiaria**: Limita máx 8 horas diarias
5. **validarFranjaInstitucional**: Bloque de almuerzo 12:00-13:00
6. **validarAmbienteValido**: Ambiente existe y está activo
7. **validarHorasCompletadas**: Ya se completó la carga requerida del curso

---

## 📝 Notas Importantes

### Para Operadores
- ✅ Docentes ahora pueden seleccionar horarios sin esperar aprobación administrativo
- ⚠️ Pueden cambiar selecciones múltiples veces antes de confirmar
- ✅ Confirmación sigue requiriendo CargaLectiva + ventana activa
- ✅ Cambios aparecen inmediatamente tras confirmar

### Para Decanos/Directores
- La aprobación de carga horaria ya no bloquea selecciones
- Las selecciones temporales expiran tras 24 horas
- Necesitan confirmar selecciones antes de terminar período

### Para Administradores
- `confirmar-seleccion` crea declaración con `LECTIVA_CONFIRMADA`
- Las validaciones core siguen funcionando
- Ningún cambio en BD schema

---

## 🧪 Testing Recomendado

```bash
# 1. Verificar que docente en BORRADOR puede seleccionar
GET  /api/horarios/disponibilidad-matriz?id_docente=X&id_periodo=Y
# Debe retornar tienePermiso: true

# 2. Verificar selección temporal
POST /api/horarios/seleccionar-celda
{
  "id_docente": X,
  "id_curso": Y,
  "id_grupo": Z,
  "id_ambiente": A,
  "dia_semana": 0,
  "hora_inicio": "08:00",
  "hora_fin": "09:00",
  "tipo_clase": "TEORÍA",
  "id_periodo": P
}
# Debe retornar selección temporal

# 3. Verificar confirmación
POST /api/horarios/confirmar-seleccion
{
  "id_periodo": P,
  "id_docente": X
}
# Debe actualizar declaración a LECTIVA_CONFIRMADA
```

---

## 📋 Checklist de Validación

- [x] TypeScript compila sin errores
- [x] `ValidadorHorario` removió validación APROBADO
- [x] `validarCursoAsignable` permite cualquier estado
- [x] API endpoints compilados correctamente
- [ ] Testar con docente en estado BORRADOR
- [ ] Testar con docente fuera de ventana
- [ ] Testar confirmación → LECTIVA_CONFIRMADA
- [ ] Actualizar mensajes frontend
