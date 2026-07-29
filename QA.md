# Registro de Control de Calidad (QA) - Neocare Health

Este documento detalla las pruebas sistemáticas realizadas, los incidentes detectados durante el desarrollo y las soluciones aplicadas para garantizar la estabilidad del núcleo del sistema de cara a la entrega final.

---

## 1. Casos de Prueba Principales (Test Cases)

| Módulo | Funcionalidad | Descripción de la Prueba | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Autenticación** | Registro e Inicio de Sesión | Registro de un nuevo usuario y posterior inicio de sesión (`/auth/register`, `/auth/login`). | Generación de token JWT y redirección correcta al tablero principal. | **Aprobado** |
| **Carga del Tablero** | Inicialización del Tablero | Acceso a la ruta principal tras autenticarse (`/boards/initial`). | Carga dinámica del tablero con sus columnas por defecto y sincronización con SQLite. | **Aprobado** |
| **Gestión de Tarjetas** | CRUD de Tareas | Creación, visualización y actualización de tarjetas de tarea desde la interfaz. | Persistencia correcta en base de datos y renderizado inmediato en el frontend. | **Aprobado** |
| **Flujo de Columnas** | Kanban Workflow | Visualización de las columnas del flujo de trabajo (*Pendiente, En Progreso, Revisión, Listo*). | Distribución limpia y coherente de las tarjetas según su estado. | **Aprobado** |

---

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

### Incidencia 4: Error de tipo de datos (`datatype mismatch`) al inicializar el tablero para nuevos usuarios
* **Descripción:** Tras registrar un nuevo usuario e iniciar sesión, el tablero principal aparecía completamente en blanco y la consola del navegador devolvía un error `500 Internal Server Error` en el endpoint `/boards/initial`.
* **Diagnóstico:** El backend intentaba poblar automáticamente las columnas por defecto (*Pendiente, En Progreso, Revisión, Listo*) asignándoles identificadores de tipo texto (`id="backlog"`, etc.). Sin embargo, el modelo relacional en SQLAlchemy y la base de datos tenían definido el campo `id` de la tabla `lists` estrictamente como un entero autoincremental (`Integer`), provocando una colisión de tipos en SQLite (`sqlite3.IntegrityError: datatype mismatch`).
* **Corrección aplicada:** Se refactorizó la lógica del endpoint de inicialización del tablero en `router.py`. Se eliminaron los IDs estáticos en texto al instanciar las listas por defecto para permitir que SQLite gestione los identificadores numéricos de manera automática, y se adaptó la respuesta para inyectar dinámicamente dichas columnas con sus respectivos IDs reales hacia la interfaz de React.

### Incidencia 5: Bloqueo de peticiones por políticas de origen cruzado (CORS)
* **Descripción:** Al iniciar la comunicación cliente-servidor, las peticiones HTTP realizadas desde el entorno de desarrollo de Vite (Frontend) hacia el servidor de FastAPI (Backend) eran rechazadas automáticamente por el navegador.
* **Diagnóstico:** Las políticas de seguridad predeterminadas de los navegadores bloquean solicitudes entre distintos puertos (`localhost:5173` y `localhost:8000`) si el servidor de API no declara explícitamente qué orígenes tienen autorización.
* **Corrección aplicada:** Se importó y configuró el middleware `CORSMiddleware` en el archivo principal del backend (`main.py`), habilitando de forma controlada las cabeceras, métodos y credenciales necesarios para permitir una comunicación fluida y segura.

### Incidencia 6: Conflictos de compilación en React por tipado estricto en TypeScript
* **Descripción:** Durante el desarrollo del componente del tablero, la aplicación presentaba fallos de compilación o comportamientos inesperados al mapear los identificadores y propiedades de las tarjetas y columnas.
* **Diagnóstico:** Incompatibilidad de tipos al alternar entre IDs numéricos de la base de datos SQLite y referencias de texto utilizadas en la interfaz, sumado a la falta de interfaces estrictas para los estados de las tarjetas.
* **Corrección aplicada:** Se establecieron interfaces tipadas (`Card`, `Column`, `BoardData`) y se implementó un sistema de mapeo robusto (`COLUMN_MAP` y `resolveNumericListId`) para garantizar la total compatibilidad de tipos entre el cliente y el servidor.

### Incidencia 7: Conflictos de CORS, peticiones *Preflight* y latencia de arranque tras el despliegue en la nube
* **Descripción:** Tras desplegar el frontend en Vercel y el backend en Render, las primeras peticiones de inicio de sesión y registro fallaban en el navegador mostrando errores de CORS (*"Access to fetch... has been blocked by CORS policy"*), fallos en las peticiones de comprobación previa (*preflight OPTIONS*), y una notable demora inicial al interactuar con el sistema.
* **Diagnóstico:** 
  1. El middleware de CORS en FastAPI no incluía inicialmente la URL de producción de Vercel y bloqueaba las cabeceras/métodos complejos necesarios para las peticiones con JSON.
  2. El plan gratuito del servicio de alojamiento en Render entra en suspensión (*spin down*) tras periodos de inactividad, provocando una latencia de entre 15 y 30 segundos en la primera petición para despertar el servidor.
* **Corrección aplicada:** 
  1. Se actualizó la configuración de `CORSMiddleware` en el archivo principal del backend (`main.py`), abriendo los orígenes, métodos y cabeceras mediante `allow_origins=["*"]` para garantizar una comunicación fluida entre Vercel y Render sin bloqueos de seguridad.
  2. Se documentó la latencia de arranque inicial como un comportamiento esperado del entorno de producción gratuito para futuras pruebas y presentaciones.

---

## 3. Limitaciones Conocidas y Alcance

Siguiendo las recomendaciones de priorizar la estabilidad del sistema y asegurar un producto sólido para la fecha de entrega, se han acotado las funcionalidades accesorias complejas para garantizar que el flujo principal (autenticación, tablero y gestión de tarjetas) funcione de manera impecable y sin errores en consola.