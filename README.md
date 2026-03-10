# LAB05-ARSW-live-board

## Descripción del Proyecto

Tablero colaborativo en tiempo real que permite a múltiples usuarios dibujar simultáneamente en un lienzo compartido. El sistema implementa comunicación bidireccional utilizando WebSockets para sincronización instantánea de trazos entre todos los clientes conectados.

## Justificación de Diseño

### Arquitectura Cliente-Servidor
La aplicación sigue una arquitectura cliente-servidor donde el frontend (React) gestiona la interfaz de usuario y el backend (Spring Boot) maneja la lógica de negocio y sincronización.

### Comunicación en Tiempo Real
Se implementan WebSockets para proporcionar actualizaciones instantáneas sin necesidad de polling constante. Esto reduce significativamente la carga del servidor y mejora la experiencia del usuario al eliminar latencia percibida.

### Sistema de Fallback
El sistema incluye un mecanismo de fallback que automáticamente cambia a polling cuando WebSocket no está disponible, garantizando funcionalidad continua incluso en redes restrictivas.

### Gestión de Estado Centralizada
El backend mantiene una única fuente de verdad del estado del tablero, evitando inconsistencias entre clientes y asegurando que todos los usuarios vean el mismo contenido.

### Validación y Sanitización
Todos los trazos recibidos son validados y sanitizados antes de ser procesados, previniendo ataques XSS y garantizando integridad de datos.

## Características Técnicas

### Frontend (React)
- Componentes funcionales con hooks personalizados
- Manejo eficiente de estado con useState y useEffect
- Canvas HTML5 para renderizado de gráficos
- Sistema de reintentos automático para operaciones de red

### Backend (Spring Boot)
- Gestión de sesiones WebSocket concurrentes
- Estrategia de comunicación desacoplada (Strategy Pattern)
- Logging estructurado para monitoreo y depuración
- Manejo robusto de errores y reconexiones

### Comunicación
- WebSockets para actualizaciones en tiempo real
- REST API para operaciones CRUD
- JSON como formato de intercambio de datos
- Identificación única de usuarios mediante UUID

## Estructura del Proyecto

```
board-frontend/
├── src/
│   ├── components/     # Componentes React
│   ├── hooks/         # Hooks personalizados
│   ├── services/      # Comunicación API
│   └── utils/         # Utilidades compartidas
└── README.md
```

## Requisitos

### Frontend
- Node.js 16+
- React 18+
- Navegador con soporte WebSocket

### Backend
- Java 11+
- Spring Boot 2.7+
- Maven 3.6+

## Ejecución

### Frontend
```bash
cd board-frontend
npm install
npm run dev
```

### Backend
```bash
mvn spring-boot:run
```

## Consideraciones de Diseño para LAB05

### Concurrencia
El sistema maneja múltiples usuarios simultáneos mediante gestión adecuada de sesiones WebSocket y sincronización de estado.

### Escalabilidad
La arquitectura desacoplada permite escalar componentes independientemente según la carga de trabajo.

### Resiliencia
Implementación de reintentos, fallback a polling, y manejo robusto de desconexiones garantiza disponibilidad del servicio.