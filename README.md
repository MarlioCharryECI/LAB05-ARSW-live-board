# LAB05-ARSW-live-board

## Descripción del Proyecto

Tablero colaborativo en tiempo real que permite a múltiples usuarios dibujar simultáneamente en un lienzo compartido. El sistema implementa comunicación bidireccional utilizando WebSockets para sincronización instantánea de trazos entre todos los clientes conectados.

## Cumplimiento de Requisitos LAB 5

### 1. Tablero Interactivo
- **Implementación**: Componente `Board.jsx` con canvas HTML5 utilizando P5.js
- **Funcionalidad**: Dibujo mediante eventos `mousePressed`, `mouseDragged`, `mouseReleased`
- **Validación**: Todos los trazos se validan y sanitizan antes de procesar

### 2. Múltiples Usuarios Simultáneos
- **Identificación**: Cada usuario recibe un UUID único mediante endpoint `/join`
- **Sesiones**: Gestión de sesiones WebSocket concurrentes en backend
- **Visualización**: Contador de usuarios únicos conectados en tiempo real

### 3. Botón de Borrado Compartido
- **Implementación**: Botón "Limpiar Tablero" con función `handleClear`
- **Sincronización**: Envío de mensaje WebSocket tipo `clear` a todos los clientes
- **Confirmación**: Actualización inmediata del estado local y broadcast a remotos

### 4. Colores Diferentes por Usuario
- **Asignación**: Sistema backend asigna color único automáticamente al conectar
- **Persistencia**: Color mantenido durante la sesión del usuario
- **Visualización**: Indicador visual del color asignado en la interfaz

### 5. Sincronización en Tiempo Real
- **Tecnología**: WebSockets con fallback automático a polling
- **Mensajes**: Tipos `stroke` para trazos individuales, `clear` para borrado
- **Latencia**: Actualización instantánea sin necesidad de refresh manual

## Arquitectura Técnica

### Frontend (React + P5.js)
```
src/
├── components/
│   └── Board.jsx          # Canvas de dibujo con P5.js
├── hooks/
│   ├── useWebSocket.js     # Gestión conexión WebSocket
│   ├── useConnection.js    # Estado de conexión
│   └── useBoardSync.js    # Sincronización de tablero
├── services/
│   └── api.js           # Comunicación API y WebSocket
├── utils/
│   ├── logger.js         # Logging estructurado
│   ├── retry.js          # Reintentos automáticos
│   └── validation.js     # Validación de datos
└── App.jsx              # Componente principal
```

### Backend (Spring Boot + WebSocket)
```
├── config/
│   └── WebSocketConfig.java    # Configuración endpoints WebSocket
├── strategy/
│   └── WebSocketBoardStrategy.java # Lógica de broadcast
├── services/
│   └── BoardService.java        # Gestión estado tablero
└── controllers/
    └── BoardController.java       # Endpoints REST
```

## Patrones de Diseño Implementados

### React Hooks Personalizados
- **useWebSocket**: Gestión ciclo de vida WebSocket con reconexión automática
- **useConnection**: Estado centralizado de conexión y fallback
- **useBoardSync**: Sincronización eficiente de estado entre componentes

### Estrategia de Comunicación
- **Strategy Pattern**: `BoardCommunicationStrategy` con implementaciones WebSocket y REST
- **Observer Pattern**: Suscripción a eventos de WebSocket para actualizaciones
- **Circuit Breaker**: Manejo de fallos con reintentos exponenciales

### Gestión de Estado
- **Fuente Única de Verdad**: Backend mantiene estado autoritativo del tablero
- **Sincronización Bidireccional**: Cambios locales se propagan y remotos se reciben
- **Resolución de Conflictos**: Detección y manejo de trazos duplicados

## Características Técnicas Avanzadas

### Resiliencia y Confiabilidad
- **Auto-reconexión**: Reconexión automática con backoff exponencial
- **Fallback Mode**: Cambio automático a polling si WebSocket falla
- **Retry Manager**: Reintentos configurables para operaciones de red

### Validación y Seguridad
- **Sanitización de Entrada**: Todos los trazos se validan antes de procesar
- **Prevención XSS**: Limpieza de datos de usuario
- **Validación Estructural**: Verificación de formato de mensajes WebSocket

### Optimización de Rendimiento
- **Debouncing**: Prevención de actualizaciones excesivas del estado
- **Memoización**: Uso eficiente de React.memo y useMemo
- **Batch Updates**: Agrupación de actualizaciones de estado

## Configuración y Despliegue

### Variables de Entorno
```bash
# Para desarrollo local
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws

# Para producción (configurado en frontend/src/services/api.js)
API_URL=https://live-board-backend-hfhff6b0f6cvf3h8.westus3-01.azurewebsites.net/api
WS_URL=wss://live-board-backend-hfhff6b0f6cvf3h8.westus3-01.azurewebsites.net/ws
```

### Comandos de Desarrollo
```bash
# Instalación de dependencias
npm install

# Servidor de desarrollo
npm run dev

# Formateo de código
npm run format

# Verificación de linting
npm run check:fix

# Build para producción
npm run build
```

### Configuración Biome
El proyecto utiliza Biome para formateo y linting con las siguientes reglas:
- Indentación: 2 espacios
- Límite de línea: 100 caracteres
- Comillas dobles para strings
- Punto y coma siempre
- Organización automática de imports

## Protocolo de Comunicación

### Mensajes WebSocket
```json
{
  "type": "stroke",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "color": "#hex",
    "width": number,
    "points": [{"x": number, "y": number, "t": timestamp}]
  }
}
```

```json
{
  "type": "clear",
  "data": null
}
```

### Endpoints REST
- `POST /api/join` - Registro de usuario y asignación de color
- `GET /api/board` - Obtener estado actual del tablero
- `POST /api/draw` - Enviar trazo individual
- `POST /api/clear` - Limpiar tablero

## Requisitos de Sistema

### Frontend
- Node.js 16+
- React 18+
- P5.js 2.2+
- Navegador con soporte WebSocket

### Backend
- Java 11+
- Spring Boot 2.7+
- Maven 3.6+

## Despliegue en Producción

### URLs de Producción
- **Frontend**: https://live-board-fcb6a0eedtdcgfh6.westus3-01.azurewebsites.net
- **Backend**: https://live-board-backend-hfhff6b0f6cvf3h8.westus3-01.azurewebsites.net/api
- **WebSocket**: wss://live-board-backend-hfhff6b0f6cvf3h8.westus3-01.azurewebsites.net/ws

### Azure Web Apps
El proyecto está desplegado en Azure Web Services:
- **Frontend**: App Service estático con React
- **Backend**: App Service con Spring Boot y WebSocket
- **Región**: West US 3
- **Protocolos**: HTTPS/WSS seguros

### GitHub Actions
Despliegue automatizado mediante GitHub Actions:
- **Trigger**: Push a rama main
- **Build**: npm install y build en board-frontend/
- **Deploy**: Azure Web Apps Deploy action
- **Artefactos**: board-frontend/dist/

### Consideraciones de Producción
- **CORS**: Configurado para permitir dominio del frontend
- **HTTPS**: Configuración SSL/TLS para WebSocket seguro
- **Escalabilidad**: Arquitectura sin estado para balanceo de carga
- **Monitoreo**: Logs estructurados para debugging en producción

## Testing y Validación

### Pruebas Funcionales
- Conexión simultánea de múltiples usuarios
- Sincronización de trazos en tiempo real
- Funcionamiento del botón de borrado compartido
- Asignación correcta de colores por usuario

### Pruebas de Estrés
- Reconexión automática ante desconexiones
- Comportamiento con alta latencia
- Manejo de mensajes malformados
- Límite de usuarios concurrentes

## Métricas de Calidad

### Código
- Formato consistente con Biome
- Cobertura de validación de entrada
- Manejo completo de errores
- Documentación inline apropiada

### Rendimiento
- Latencia de sincronización < 100ms
- Uso eficiente de memoria con React hooks
- Optimización de renderizado con P5.js
- Gestión adecuada de conexiones WebSocket


El proyecto cumple implementando un tablero colaborativo robusto con características avanzadas de resiliencia, seguridad y rendimiento. La arquitectura modular facilita el mantenimiento y escalabilidad, mientras que la experiencia de usuario proporciona feedback claro y funcionamiento intuitivo.

**Autor:** Marlio Jose Charry Espitia  
**Versión:** 1.0.0  
**Última actualización:** Marzo 2026