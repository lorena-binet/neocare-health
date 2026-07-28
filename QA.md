# Registro de Control de Calidad (QA) - Neocare Health

Este documento detalla las pruebas sistemáticas realizadas, los incidentes detectados durante el desarrollo y las soluciones aplicadas para garantizar la estabilidad del núcleo del sistema de cara a la entrega final.

## 1. Casos de Prueba Principales (Test Cases)

| Módulo / Funcionalidad | Descripción de la Prueba | Resultado Esperado | Estado |

| **Autenticación** | Registro de un nuevo usuario y posterior inicio de sesión (`/auth/register`, `/auth/login`). | Generación de token JWT y redirección correcta al tablero principal. | **Aprobado** |
| **Carga del Tablero** | Acceso a la ruta principal tras autenticarse (`/boards/initial`). | Carga dinámica del tablero con sus columnas por defecto y sincronización con SQLite. | **Aprobado** |
| **Gestión de Tarjetas** | Creación, visualización y actualización de tarjetas de tarea desde la interfaz. | Persistencia correcta en base de datos y renderizado inmediato en el frontend. | **Aprobado** |
| **Flujo de Columnas** | Visualización de las columnas del flujo de trabajo (Pendiente, En Progreso, Revisión, Listo). | Distribución limpia y coherente de las tarjetas según su estado. | **Aprobado** |

---

## 2. Registro de Incidencias y Correcciones (Bugs & Fixes)

### Incidencia 1: Error 404 al intentar crear tarjetas ("La lista o columna especificada no existe")
* **Descripción:** Al pulsar sobre el botón de crear tarjeta, el frontend enviaba la petición al backend, pero este respondía con un error `404 Not Found` indicando que las listas del tablero no existían.
* **Diagnóstico:** Mediante la inspección directa de la base de datos utilizando **DB Browser for SQLite**, comprobamos que las tablas (`boards`, `cards`, `lists`) **se encontraban completamente vacías** y los registros iniciales no se estaban generando de forma automática al arrancar el componente.
* **Corrección aplicada:** Se modificó el endpoint de inicialización del tablero en el backend (`boards/router.py`) para que verifique si las listas existen físicamente en SQLite. En caso de estar vacías, el sistema las inserta automáticamente con los IDs y nombres correspondientes en castellano ("Pendiente", "En Progreso", "Revisión", "Listo"), solucionando la validación y permitiendo el guardado fluido de las tarjetas.
## 2. Registro de Incidencias y Correcciones (Bugs & Fixes)

### Incidencia 1: Error 404 al intentar crear tarjetas ("La lista o columna especificada no existe")
* **Descripción:** Al pulsar sobre el botón de crear tarjeta, el frontend enviaba la petición al backend, pero este respondía con un error `404 Not Found` indicando que las listas del tablero no existían.
* **Diagnóstico:** Mediante la inspección directa de la base de datos utilizando **DB Browser for SQLite**, comprobamos que las tablas (`boards`, `cards`, `lists`) **se encontraban completamente vacías** y los registros iniciales no se estaban generando de forma automática al arrancar el componente.
* **Corrección aplicada:** Se modificó el endpoint de inicialización del tablero en el backend (`boards/router.py`) para que verifique si las listas existen físicamente en SQLite. En caso de estar vacías, el sistema las inserta automáticamente con los IDs y nombres correspondientes en castellano ("Pendiente", "En Progreso", "Revisión", "Listo"), solucionando la validación y permitiendo el guardado fluido de las tarjetas.

### Incidencia 2: Fallo de atributo en SQLAlchemy con la tabla `Card` (`board_id`)
* **Descripción:** Al intentar cargar las tarjetas asociadas a un tablero, FastAPI devolvió un error interno de servidor con traza `AttributeError: type object 'Card' has no attribute 'board_id'`.
* **Diagnóstico:** El modelo de base de datos relacionaba las tarjetas directamente con las listas (`list_id`) y no de forma directa con los tableros (`board_id`), generando un conflicto en la consulta inicial.
* **Corrección aplicada:** Se refactorizó la lógica en el router de tableros para que primero recupere las listas pertenecientes al tablero del usuario (`list_id`) y posteriormente filtre las tarjetas haciendo uso de una consulta optimizada con `.in_(list_ids)`, respetando la integridad del modelo relacional.

### Incidencia 3: Error de autenticación al iniciar sesión tras un registro exitoso
* **Descripción:** El usuario podía registrarse correctamente en la base de datos, pero al intentar hacer el login desde la interfaz, el sistema devolvía un error de validación impidiendo el acceso.
* **Diagnóstico:** Desajuste en el formato de recepción de datos: el backend estaba configurado para recibir peticiones tipo formulario con `username`, mientras que el frontend de React enviaba un objeto JSON estructurado con `email` y `password`.
* **Corrección aplicada:** Se adaptó el esquema Pydantic de autenticación y el endpoint de login en FastAPI para procesar correctamente las credenciales JSON enviadas desde el cliente, unificando el flujo de acceso con el token JWT.

---

## 3. Limitaciones Conocidas y Alcance

Siguiendo las recomendaciones de priorizar la estabilidad del sistema y asegurar un producto sólido para la fecha de entrega, se han acotado las funcionalidades accesorias complejas para garantizar que el flujo principal (autenticación, tablero y gestión de tarjetas) funcione de manera impecable y sin errores en consola.