# Sistema de Gestión de Horarios Académicos - UNT

Este es el sistema de gestión de horarios para la Escuela de Ingeniería de Sistemas de la Universidad Nacional de Trujillo. Permite la asignación de horarios en tiempo real, con validaciones automáticas de cruces, gestión de colas por jerarquía docente y notificaciones multicanal.

## � Estrategia de Trabajo en Equipo

Para el desarrollo colaborativo, hemos establecido una **Estrategia Unificada de Datos** y un plan de división de tareas. Consulta el archivo [ESTRATEGIA_EQUIPO.md]

1. **Seed Centralizado**: Uso de `prisma/seed.ts` con secciones modulares.
2. **División de Tareas**: Roles específicos para Reportes, Conflictos, Notificaciones y Diseño.
3. **Flujo de Git**: Guía para fusión de ramas y resolución de conflictos.

## �🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (v18 o superior)
- [PostgreSQL](https://www.postgresql.org/) (Base de datos)
- [Git](https://git-scm.com/)

## 🛠️ Configuración del Proyecto

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y completa los siguientes campos:
   ```env
   # Base de Datos
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/horarios_unt?schema=public"

   # Autenticación (NextAuth)
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="tu_secreto_super_seguro"

   # Sockets
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Notificaciones (Opcional para pruebas básicas)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="tu_correo@gmail.com"
   SMTP_PASS="tu_contraseña_de_aplicacion"
   TELEGRAM_BOT_TOKEN="tu_token_de_bot"
   ```

3. **Preparar la Base de Datos:**
   Ejecuta las migraciones de Prisma para crear las tablas:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Cargar Datos de Prueba (Demo):**
   He preparado scripts para que puedas probar el sistema inmediatamente con usuarios y datos reales:
   ```bash
   node scripts/seed_demo.js
   node scripts/seed_horarios.js
   ```

## 💻 Ejecución del Sistema

Para iniciar el servidor de desarrollo:
```bash
npm run dev
```
El sistema estará disponible en [http://localhost:3000](http://localhost:3000).

## 🔑 Cuentas de Prueba (Demo)

He implementado botones de **Autocompletado** en la página de Login para facilitar las pruebas. Todos los usuarios tienen la contraseña: `123456`.

| Rol | Correo de Prueba | Descripción |
| :--- | :--- | :--- |
| **Admin** | `admin@unt.edu.pe` | Gestión total, KPIs, Catálogos y Ventanas. |
| **Operador** | `operador@unt.edu.pe` | Llamado de docentes y asignación asistida. |
| **Docente** | `roberto@unt.edu.pe` | Selección autónoma (requiere ventana activa). |

## 🏗️ Estructura de Fases Implementadas

- **Fase 3**: Catálogos (CRUDs de Docentes, Cursos, Ambientes).
- **Fase 4**: Ventanas de Atención y Jerarquía.
- **Fase 5**: Matriz de Disponibilidad (Socket.IO) y 8 Validaciones en Tiempo Real.
- **Fase 6**: Atención por Operador y Cola de Espera.
- **Fase 7**: Dashboard Administrativo con Gráficos (Recharts).
- **Fase 8**: Reportes PDF oficiales (Puppeteer).
- **Fase 9**: Notificaciones (Correo y Bot de Telegram).

## 📄 Licencia

Desarrollado para la Universidad Nacional de Trujillo - Escuela de Ingeniería de Sistemas.
