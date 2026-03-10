# Frontend - Tablero Colaborativo en Tiempo Real

## Descripción del Proyecto

Frontend desarrollado en React + Vite para el Laboratorio 5 de ARSW (Arquitectura y Desarrollo de Software Web). Esta aplicación proporciona una interfaz de usuario interactiva para un tablero de dibujo colaborativo en tiempo real, donde múltiples usuarios pueden dibujar simultáneamente con colores asignados dinámicamente.

## Arquitectura y Decisiones de Diseño

### 1. **Tecnologías Seleccionadas**

- **React 19.2.0**: Framework moderno con hooks para manejo de estado y efectos secundarios
- **Vite 7.3.1**: Build tool rápido para desarrollo y producción
- **p5.js 2.2.2**: Librería especializada en gráficos y dibujo interactivo
- **UUID 13.0.0**: Generación de identificadores únicos para usuarios y trazos

**Justificación**: React proporciona un manejo eficiente del estado con hooks, esencial para la sincronización en tiempo real. p5.js ofrece capacidades de dibujo superiores a Canvas API nativo, con mejor rendimiento para gráficos interactivos.

### 2. **Estructura de Componentes**

#### `App.jsx` - Componente Principal
- **Gestión de estado centralizada**: userId, color, strokes, isConnected
- **Sincronización con backend**: Polling cada 500ms para obtener actualizaciones
- **Lógica de conexión**: Manejo del flujo de unión al tablero

#### `Board.jsx` - Componente de Dibujo
- **Integración p5.js**: Wrapper React para el sketch de p5
- **Manejo de eventos de mouse**: mousePressed, mouseDragged, mouseReleased
- **Renderizado eficiente**: Separación entre trazos actuales y almacenados

#### `api.js` - Servicio de Comunicación
- **Abstracción HTTP**: Funciones puras para cada endpoint del backend
- **Manejo de errores**: Validación de respuestas y logging detallado
- **Configuración flexible**: URL configurable mediante variables de entorno

### 3. **Estrategia de Sincronización**

#### Polling Activo
```javascript
// Sincronización cada 500ms
const interval = setInterval(syncBoard, 500);
```

**Justificación**: Se implementó polling en lugar de WebSockets porque:
- Simplifica la arquitectura del backend
- Es más robusto ante desconexiones de red
- Cumplimiento con requisitos del LAB 5 (REST API)
- Latencia aceptable (500ms) para experiencia colaborativa

#### Optimización de Renderizado
```javascript
// Comparación inteligente de cambios
const prevIds = prevStrokes.map(s => s.id).sort();
const newIds = boardData.map(s => s.id).sort();
if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
    return boardData;
}
```

**Justificación**: Evita re-renders innecesarios comparando solo IDs de trazos, mejorando el rendimiento.

### 4. **Manejo de Estado y Datos**

#### Estructura de Trazo
```javascript
{
    id: crypto.randomUUID(),
    userId: userId || 'unknown',
    color: color || '#000000',
    width: width || 4,
    points: [{ x, y, t }]  // Timestamp incluido para análisis futuro
}
```

#### Estado Reactivo
- **strokes**: Array inmutable con todos los trazos del tablero
- **currentPathRef**: Referencia mutable para el trazo en curso
- **strokesRef**: Referencia para acceso desde p5.js sin re-renders

### 5. **Conexión con Backend**

#### Endpoints Implementados
- `POST /api/join`: Registro de usuario y asignación de color
- `GET /api/board`: Obtención del estado actual del tablero
- `POST /api/draw`: Envío de nuevos trazos
- `POST /api/clear`: Limpieza del tablero

#### Flujo de Conexión
1. Generación de UUID único para el usuario
2. Llamada a `/join` para registro y asignación de color
3. Inicio de polling para sincronización
4. Manejo de errores y reconexión

## Cumplimiento de Requisitos LAB 5

### ✅ **Arquitectura REST**
- Comunicación exclusiva mediante HTTP/REST
- Sin estado en el cliente (stateless)
- Recursos bien definidos: users, board, strokes

### ✅ **Concurrencia y Sincronización**
- Múltiples usuarios concurrentes
- Sincronización automática cada 500ms
- Manejo de conflictos (último escritor gana)

### ✅ **Manejo de Estado**
- Estado centralizado en backend
- Cliente como caché temporal
- Actualizaciones atómicas

### ✅ **Interfaz de Usuario Reactiva**
- Actualizaciones en tiempo real
- Feedback visual inmediato
- Indicadores de conexión y usuarios activos

### ✅ **Robustez**
- Manejo de errores de red
- Reconexión automática
- Validación de datos

## Características Adicionales

### **Experiencia de Usuario**
- Indicador visual del color asignado
- Contador de usuarios conectados
- Botón de limpiar tablero
- Estado de conexión claro

### **Optimizaciones de Rendimiento**
- Renderizado optimizado con p5.js
- Evitar re-renders innecesarios
- Lazy loading de servicios

### **Extensibilidad**
- Arquitectura modular
- Fácil adición de nuevas herramientas de dibujo
- Preparado para WebSocket futuro

## Configuración y Ejecución

### **Variables de Entorno**
```bash
VITE_API_URL=http://localhost:8080/api  # URL del backend
```

### **Instalación**
```bash
npm install
```

### **Desarrollo**
```bash
npm run dev
```

### **Producción**
```bash
npm run build
npm run preview
```

## Arquitectura de Comunicación

```
Frontend (React)                    Backend (Spring Boot)
     │                                   │
     ├─ POST /api/join ──────────────────►
     │◄─────────────────── {userId, color}─┤
     │                                   │
     ├─ GET /api/board ──────────────────►
     │◄─────────────────── [strokes]──────┤
     │                                   │
     ├─ POST /api/draw ──────────────────►
     │◄─────────────────── 200 OK ────────┤
     │                                   │
     ├─ POST /api/clear ─────────────────►
     │◄─────────────────── 200 OK ────────┤
```

## Conclusiones

El frontend implementa exitosamente todos los requisitos del LAB 5 mediante una arquitectura React moderna con sincronización REST. Las decisiones de diseño priorizan:

1. **Simplicidad**: Polling sobre WebSockets para cumplir con REST
2. **Rendimiento**: p5.js para gráficos eficientes
3. **Escalabilidad**: Arquitectura modular y stateless
4. **Experiencia**: UI reactiva con feedback inmediato

La solución demuestra comprensión de conceptos clave de desarrollo web moderno: manejo de estado, comunicación asíncrona, renderizado eficiente y arquitectura de componentes.
