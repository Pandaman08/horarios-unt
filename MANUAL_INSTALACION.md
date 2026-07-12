# Manual de Instalación: Sistema de Gestión de Horarios UNT

## 1. Descripción general del sistema
**Nombre del proyecto:** `horarios-unt`
**Propósito:** Sistema web para la gestión de horarios, asignación de cargas lectivas y no lectivas, y declaración horaria para docentes de la UNT.
**Arquitectura:** Monolito full-stack utilizando [Next.js](https://nextjs.org/) con App Router (React). El backend está integrado mediante *Server Actions* y *API Routes* de Next.js. El acceso a la base de datos se maneja a través del ORM [Prisma](https://www.prisma.io/).

## 2. Requisitos previos
Para poder instalar y ejecutar este proyecto, necesitas contar con el siguiente software instalado en tu entorno de desarrollo local:
* **Node.js**: Versión 20.x (Requerido según `@types/node: ^20`).
* **Gestor de paquetes**: `npm` (se utiliza `package-lock.json`).
* **Base de datos**: PostgreSQL (Versión 14 o superior recomendada).
* **Git**: Para el control de versiones y clonado del repositorio.

## 3. Clonado del repositorio
Abre tu terminal y ejecuta el siguiente comando para obtener el código fuente:

```bash
git clone https://github.com/Pandaman08/horarios-unt.git
cd horarios-unt
```

## 4. Instalación de dependencias
El proyecto es un monolito, por lo que tanto las dependencias del frontend (React/Next) como las del backend (Prisma/NextAuth) se instalan juntas con un solo comando en la raíz del proyecto:

```bash
npm install
```

## 5. Configuración de variables de entorno
El sistema requiere configuraciones específicas para conectar la base de datos y manejar la autenticación y WebSockets.

1. En la raíz del proyecto, crea un archivo llamado `.env`.
2. Añade las siguientes variables de configuración:

```env
# URL de conexión a la base de datos PostgreSQL
# Reemplaza 'usuario', 'contrasena', 'localhost', 'puerto' y 'nombre_bd' con tus credenciales
DATABASE_URL="postgresql://usuario:contrasena@localhost:5432/nombre_bd?schema=public"

# URL base de la aplicación (usada por NextAuth para redirecciones de login)
NEXTAUTH_URL="http://localhost:3000"

# Secreto para la encriptación de sesiones JWT de NextAuth
NEXTAUTH_SECRET="cualquier_cadena_secreta_aleatoria_para_desarrollo"

# URL pública para la configuración de Sockets (Socket.io)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Nota:** Nunca subas el archivo `.env` real al repositorio de control de versiones.

## 6. Configuración de la base de datos
Una vez que el archivo `.env` está configurado con las credenciales correctas de PostgreSQL y la base de datos ha sido creada en tu gestor (ej. pgAdmin, DBeaver), ejecuta los siguientes comandos de Prisma:

1. **Empujar el esquema a la base de datos** (Crea las tablas según `prisma/schema.prisma`):
```bash
npx prisma db push
```

2. **Poblar la base de datos con datos de prueba (Seeders)**:
El proyecto cuenta con un archivo principal de *seed* (`prisma/seed.ts`) que inserta facultades, escuelas, usuarios, ciclos, periodos, docentes y simulaciones del flujo completo de declaraciones horarias.
```bash
npx prisma db seed
```
> El script de semilla ya está definido en el `package.json` utilizando `ts-node`.

## 7. Levantamiento del proyecto en entorno de desarrollo
Para iniciar el servidor local de desarrollo, ejecuta:

```bash
npm run dev
```
El servidor se ejecutará de forma predeterminada en el puerto `3000`. 
Accede a la aplicación en tu navegador web en la siguiente URL: **[http://localhost:3000](http://localhost:3000)**

## 8. Estructura de carpetas relevante
El repositorio sigue la convención de `src/` de Next.js:

* `/src/app`: Rutas del frontend y backend utilizando el App Router.
  * `/src/app/api`: Rutas de la API (Backend).
  * `/src/app/dashboard`: Módulos de la aplicación web y vistas del sistema.
* `/src/components`: Componentes reutilizables de UI (Shadcn, layouts, iconos).
* `/src/lib`: Utilidades, inicialización de Prisma, funciones compartidas y configuración de WebSockets.
* `/prisma`: Configuración del ORM.
  * `schema.prisma`: Definición de todos los modelos de la base de datos.
  * `/prisma/seeders`: Sub-archivos de inserción de datos iniciales agrupados por entidad.
* `/public`: Activos estáticos (imágenes, iconos, fuentes).

## 9. Build y despliegue en producción
Para preparar la aplicación para un entorno de producción (generar la compilación optimizada), debes usar:

```bash
npm run build
```
Una vez compilado satisfactoriamente, puedes levantar la versión de producción con:
```bash
npm run start
```
*Asegúrate de que tus variables de entorno estén correctamente definidas en el servidor de destino antes de ejecutar el build y el start.*

## 10. Solución de problemas comunes

* **Error `Database error code: 42601` o fallas al aplicar migraciones de Prisma:**
  Si encuentras errores de sintaxis o inconsistencias durante la migración (ej. al correr `npx prisma migrate dev`), es recomendable sincronizar la estructura directamente ejecutando:
  ```bash
  npx prisma db push --force-reset
  npx prisma db seed
  ```
* **Error de conexión a la Base de Datos (`P1001`):**
  Comprueba que tu motor de PostgreSQL esté corriendo y que los datos en `DATABASE_URL` (usuario, puerto, password) sean los correctos en el archivo `.env`.
* **Módulos no encontrados al iniciar `npm run dev`:**
  Asegúrate de haber instalado dependencias ejecutando `npm install`. Si persisten problemas, elimina la carpeta `node_modules` y `package-lock.json` e intenta instalarlas nuevamente.

## 11. Credenciales de Prueba (Generadas por los Seeders)
Al ejecutar el comando `npx prisma db seed`, el sistema crea automáticamente usuarios de prueba con diferentes roles para que puedas probar todo el flujo de aprobación y gestión de horarios.

* **Administrador del Sistema:**
  * **Correo:** `admin@unitru.edu.pe`
  * **Contraseña:** `00000000`

* **Operador de Horarios (Centro de Cómputo/Secretaría):**
  * **Correo:** `dvalerianorodriguez@unitru.edu.pe`
  * **Contraseña:** `80000001`

* **Director de Departamento (Ej. Departamento de Ing. de Sistemas):**
  * **Correo:** `lboychavil@unitru.edu.pe`
  * **Contraseña:** `18842081`

* **Decano (Ej. Facultad de Ingeniería):**
  * **Correo:** `ireyeslopez@unitru.edu.pe`
  * **Contraseña:** `17898446`

* **Docente Estándar:**
  * **Correo:** `eagredagamboa@unitru.edu.pe`
  * **Contraseña:** `18161457`
  *(Nota: Para todos los docentes generados, la contraseña por defecto es su número de DNI).*

## 12. Créditos / Autores
Desarrollado para la gestión del Sistema de Horarios UNT. 
Repositorio administrado en: [Pandaman08/horarios-unt](https://github.com/Pandaman08/horarios-unt)
