# Memoria Técnica y Documentación Final - Neocare Health

---

## 1. Propósito del Proyecto y Visión General
Neocare Health es una plataforma web full-stack de gestión de proyectos, control de tareas mediante tableros Kanban y seguimiento de productividad laboral. El sistema ha sido concebido para optimizar los flujos de trabajo corporativos e individuales, permitiendo la asignación dinámica de estados a las tareas, el registro cronológico de horas trabajadas y la explotación de métricas analíticas avanzadas. El desarrollo prioriza la modularidad, la seguridad en las transacciones de datos y una experiencia de usuario fluida y receptiva.

---

## 2. Arquitectura del Proyecto y Pila Tecnológica
El proyecto se estructura bajo un modelo de arquitectura desacoplada (Monorepo con separación estricta de responsabilidades entre cliente y servidor):

- Capa de Servidor (Backend):
  - Framework principal: Python con FastAPI, seleccionado por su alta velocidad de ejecución, validación automática de esquemas mediante Pydantic y generación interactiva de documentación (Swagger UI / OpenAPI).
  - ORM (Mapeo Objeto-Relacional): SQLAlchemy, encargado de gestionar las entidades relacionales y las consultas tipadas a base de datos.
  - Servidor WSGI/ASGI de Producción: Gunicorn combinado con workers de Uvicorn para garantizar concurrencia y estabilidad ante peticiones masivas.
  - Seguridad y Cifrado: Implementación de hashing de contraseñas mediante Passlib (algoritmo Bcrypt) y autenticación basada en tokens web seguros (JWT - JSON Web Tokens).

- Capa de Cliente (Frontend):
  - Librería base: React (con soporte completo para TypeScript y JavaScript moderno), optimizado para ofrecer tipado estático y prevenir errores de ejecución en tiempo de desarrollo.
  - Empaquetador y Entorno: Vite, para compilaciones ultrarrápidas y gestión de módulos de desarrollo HMR (Hot Module Replacement).
  - Gestión de Estado y Rutas: Enrutamiento dinámico mediante controladores de navegación y sincronización asíncrona con el backend mediante clientes HTTP configurados con interceptores de tokens.

- Bases de Datos y Persistencia:
  - Entorno de Desarrollo Local: Base de datos relacional ligera SQLite (neocare.db), ideal para pruebas unitarias y validaciones rápidas sin dependencias externas.
  - Entorno de Producción: PostgreSQL alojado en la nube mediante Neon, garantizando concurrencia, persistencia robusta, integridad referencial estricta y soporte para secuencias e índices avanzados.

- Infraestructura de Despliegue:
  - Backend: Desplegado en Render, configurado como servicio web con auto-start y variables de entorno seguras.
  - Frontend: Desplegado en Vercel, aprovechando su red de distribución de contenido global (CDN) y despliegues automáticos conectados directamente con el repositorio de GitHub.

---

## 3. Configuración del Entorno de Desarrollo (Guía de Instalación)

### 3.1. Requisitos Previos
- Python 3.10 o superior instalado en el sistema.
- Node.js (versión 18 o superior) y npm instalados.
- Git para el control de versiones.

### 3.2. Configuración y Arranque del Backend
Para configurar el servidor en tu equipo local, ejecuta los siguientes comandos en tu terminal:

cd backend
python -m venv venv
# En Windows (Git Bash / CMD):
venv\Scripts\activate
# En macOS / Linux:
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

*(Nota: No olvides configurar tu archivo de variables de entorno .env en la raíz del backend con los parámetros de conexión oportunos).*

### 3.3. Configuración y Arranque del Frontend
Para levantar la interfaz de usuario en local, abre otra terminal y ejecuta:

cd frontend
npm install
npm run dev

---

## 4. Variables de Entorno y Seguridad
- DATABASE_URL: Cadena de conexión URI completa hacia la base de datos PostgreSQL o SQLite.
- SECRET_KEY: Clave criptográfica de alta entropía para firmar tokens JWT.
- ACCESS_TOKEN_EXPIRE_MINUTES: Expiración de credenciales (30 minutos por defecto).
- VITE_API_URL: Dirección base del backend consumida por el cliente React en producción.

---

## 5. Esquema de Base de Datos y Modelos
| Entidad | Atributos Principales | Descripción |
| :--- | :--- | :--- |
| users | id, email, hashed_password | Identidad digital y credenciales cifradas. |
| boards | id, title, owner_id | Tablero principal de trabajo asociado al usuario. |
| lists | id, title, position, board_id | Fases o columnas del flujo Kanban (Pendiente, En Progreso, etc.). |
| cards | id, title, description, position, list_id | Tareas específicas contenidas dentro de cada columna. |
| work_logs | id, user_id, hours, date, description | Control cronológico de horas trabajadas. |

---

## 6. Endpoints Principales (API REST)
- POST /auth/register: Registro de usuario con inicialización automática de tablero y listas estándar.
- POST /auth/login: Autenticación OAuth2 y emisión de token JWT.
- GET /boards/initial: Obtención de la estructura jerárquica completa del tablero del usuario.
- POST /cards/ y PUT /cards/{id}: Creación, actualización y reubicación de tarjetas.
- POST /work-logs/ y GET /work-logs/: Gestión y consulta de registros de control de tiempos.

---

## 7. Pasos de Despliegue en Producción
1. Base de Datos (Neon): Creación del cluster PostgreSQL y ejecución de sincronizaciones de secuencias.
2. Backend (Render): Configuración del directorio raíz backend y comando WSGI con Gunicorn.
3. Frontend (Vercel): Importación del repositorio web, compilación con Vite y enlace con la API de Render.

---

## 8. Notas Técnicas Especializadas
- Estrategia de Ordenación de Tarjetas: Gestión mediante índices numéricos enteros (position) recalculados por el backend al mover elementos entre listas.
- Cálculo de Informes: Agrupación de entradas en work_logs por rangos temporales para computar totales y medias de rendimiento.
- Mejoras de Productividad: Automatización del onboarding generando un tablero preconfigurado de 4 columnas de forma desatendida.

---

## 9. Documentación de Usuario Final
Bienvenido a la guía oficial de uso de Neocare Health. Esta documentación describe los flujos operativos básicos para aprovechar al máximo las capacidades de la plataforma:

1. Creación de Cuenta e Inicio de Sesión: Accede a la pantalla de registro introduciendo un correo electrónico válido y una contraseña segura. Una vez completado el proceso, el sistema configurará automáticamente tu entorno de trabajo inicial.
2. Navegación por el Tablero Kanban: Al iniciar sesión, haz clic en la sección Tablero del menú superior. Visualizarás tus tareas distribuidas en columnas organizadas por fases de progreso.
3. Creación y Edición de Tareas: Pulsa sobre el botón de añadir tarea dentro de cualquier columna para registrar una nueva actividad especificando su título y descripción detallada.
4. Actualización de Estados: Desplaza o actualiza el estado de tus tareas a lo largo de las columnas del tablero a medida que vayas completando las distintas fases del proyecto.
5. Control y Registro de Horas: Accede al módulo de control de tiempo para registrar las horas dedicadas a tus actividades diarias de manera estructurada.
6. Consulta de Informes Semanales: Dirígete al apartado de informes analíticos para visualizar métricas acumuladas de rendimiento y el histórico de tus horas de trabajo.
7. Optimización del Flujo: Utiliza la automatización de tableros iniciales para empezar a gestionar tus proyectos de inmediato sin necesidad de configuraciones técnicas complejas.
