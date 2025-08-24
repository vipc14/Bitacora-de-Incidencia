# Bitácora de Incidencias
## 📜 Introducción

La **Bitácora de Incidencias** es una aplicación web integral desarrollada para modernizar y optimizar el registro, seguimiento y gestión de incidencias. Este sistema reemplaza el método tradicional de registro en hojas de cálculo de Excel, ofreciendo una solución centralizada, segura y eficiente.

Construida sobre la plataforma de **Google Apps Script** y utilizando **Google Sheets** como base de datos, la aplicación proporciona una interfaz de usuario intuitiva y robusta para diferentes roles, desde administradores hasta usuarios de proveedores específicos.

## 🎯 El Problema Resuelto: De Excel a una Aplicación Web

El uso de hojas de Excel para registrar incidencias críticas presentaba varios desafíos que este sistema soluciona de manera efectiva:

| Característica | Antes (Con Excel) | ✅ Ahora (Con la Aplicación Web) || :--- | :--- | :--- |
| **Acceso y Concurrencia** | Difícil acceso concurrente, riesgo de corrupción de datos. | Acceso web centralizado y seguro para múltiples usuarios simultáneos. |
| **Validación de Datos** | Propenso a errores humanos de tipeo y formato. | Validación de datos en tiempo real y menús desplegables dinámicos. |
| **Seguridad y Permisos** | Todos los usuarios con acceso podían ver y modificar todo. | **Sistema de roles (Superadmin, Usuario)** con permisos definidos. |
| **Lógica de Negocio** | Cálculos manuales y complejos para horas laborables. | **Cálculo automático de la duración de incidencias** basado en los horarios específicos de cada proveedor. |
| **Búsqueda y Filtrado** | Lenta y poco práctica en archivos grandes. | Búsqueda instantánea y eficiente por número de registro. |
| **Reportes** | Generación de reportes manual y tediosa. | **Exportación de datos a Excel con un solo clic**, filtrando por proveedor o descargando la base de datos completa. |
| **Trazabilidad** | Difícil saber quién y cuándo hizo un cambio. | (Funcionalidad futura) Se puede implementar un log de cambios por registro. |

## ✨ Características Principales

### Para todos los usuarios:
* **🔐 Sistema de Autenticación:** Inicio de sesión seguro para proteger el acceso a la información.
* **📝 Registro y Edición de Incidencias:** Un formulario completo e intuitivo para registrar todos los detalles de un evento, incluyendo fechas, responsables y descripciones.
* **🔍 Búsqueda Inteligente:** Modal de búsqueda para localizar rápidamente cualquier registro por su número único.
* **🔄 Actualización de Registros:** Carga y modifica registros existentes, con campos bloqueados para evitar la alteración de datos históricos clave.
* **📊 Exportación a Excel:** Descarga los datos de la bitácora en formato `.xlsx`, ideal para análisis y reportes externos.

### Para Administradores:
* **👤 Gestión de Usuarios:** Panel de administración para crear, ver, editar y eliminar usuarios del sistema.
* **🛂 Asignación de Roles y Proveedores:** Capacidad para asignar roles (`user`) y proveedores específicos a cada usuario, garantizando que solo accedan a la información pertinente.
* **🌐 Visibilidad Completa:** Acceso sin restricciones a todos los registros y a la funcionalidad de descarga de datos de cualquier proveedor.

### Lógica de Negocio Avanzada:
* **⏰ Validación de Horarios:** El sistema valida que los registros de inicio o solución de incidencias se realicen dentro del horario laboral configurado para cada proveedor, asegurando la integridad de los datos de gestión.
* **Cascada de Opciones Dinámica:** Los menús desplegables de "Proveedor", "Tipo de Incidencia" y "Nombre del Evento" se actualizan dinámicamente según la selección anterior, guiando al usuario y minimizando errores.

## 🛠️ Pila Tecnológica y Arquitectura

Este proyecto aprovecha el ecosistema de Google para ofrecer una solución robusta y de bajo costo de mantenimiento.

* **Backend:** **Google Apps Script** (`Código.gs`)
    * Maneja toda la lógica del servidor, incluyendo la autenticación, las operaciones CRUD (Crear, Leer, Actualizar, Borrar) en la hoja de cálculo, y las validaciones de negocio.
    * Expone funciones al frontend de manera segura a través de la API `google.script.run`.

* **Frontend:** **HTML, CSS y JavaScript** (`Index.html`, `Css.html`, `Js.html`)
    * Interfaz de usuario limpia, responsiva y fácil de usar.
    * Manipulación del DOM para crear una experiencia de aplicación de una sola página (SPA) fluida.
    * Comunicación asíncrona con el backend para realizar operaciones sin necesidad de recargar la página.

* **Base de Datos:** **Google Sheets**
    * Actúa como la base de datos principal, almacenando todos los registros de incidencias en la hoja `BD` y los datos de usuarios en la hoja `Usuarios`.
    * Permite una fácil visualización y respaldo de los datos directamente desde la hoja de cálculo.

## 🚀 Instalación y Despliegue

Para desplegar tu propia instancia de esta aplicación, sigue estos pasos:

1.  **Crea una Hoja de Cálculo de Google:** Ve a [Google Sheets](https://sheets.new) y crea un nuevo documento.
2.  **Abre el Editor de Scripts:** En el menú, ve a `Extensiones` > `Apps Script`.
3.  **Copia el Código:**
    * Pega el contenido del archivo `code.txt` en el archivo `Código.gs`.
    * Crea tres archivos HTML desde el menú `+` > `HTML`:
        * Nombra uno `Index.html` y pega el contenido del archivo `Index.html`.
        * Nombra otro `Js.html` y pega el contenido del archivo `Js.html`.
        * Nombra el último `Css.html` y pega el contenido del archivo `Css.html`.
4.  **Configura el Logo (Opcional):** Sube tu logo a Google Drive, obtén su ID y actualízalo en la función `loadImageBytes` dentro de `Código.gs`.
5.  **Despliega la Aplicación:**
    * Haz clic en `Implementar` > `Nueva implementación`.
    * Selecciona el tipo `Aplicación web`.
    * En la configuración:
        * **Ejecutar como:** `Yo`
        * **Quién tiene acceso:** `Cualquier usuario` (o restringe según tus necesidades).
    * Haz clic en `Implementar` y autoriza los permisos necesarios.
    * Copia la URL de la aplicación web proporcionada. ¡Esa es tu bitácora!

## 👨‍💻 Autor

Desarrollado con dedicación por:
**Jose A Paredes**
