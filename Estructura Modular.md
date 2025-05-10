# Estructura Modular - Guía de Referencia

## 🏗️ Visión General de la Arquitectura

La aplicación ha sido refactorizada siguiendo principios de diseño modular, separando claramente las responsabilidades y facilitando el mantenimiento y la extensión.

```
📁 proyecto-bot-telegram/
│
├── 📁 src/
│   ├── 📁 bot/               # Inicialización y configuración del bot
│   ├── 📁 commands/          # Comandos individuales del bot
│   ├── 📁 handlers/          # Manejadores de eventos (location, etc.)
│   ├── 📁 services/          # Servicios externos (HERE Maps, reportes)
│   ├── 📁 middlewares/       # Autenticación y autorización
│   ├── 📁 utils/             # Herramientas de utilidad
│   ├── 📁 config/            # Configuración de entorno
│   └── 📁 storage/           # Gestión de datos en memoria
│
├── 📄 index.js               # Punto de entrada principal
├── 📄 .env                   # Variables de entorno (producción)
├── 📄 .env.dev               # Variables de entorno (desarrollo)
└── 📄 package.json           # Dependencias y scripts
```

## 📋 Descripción de cada módulo

### 1. `src/bot/`
- **index.js**: Inicializa el bot con detección automática de entorno (webhook/polling)
- **commands.js**: Registra todos los comandos disponibles

### 2. `src/commands/`
- **locationCmd.js**: Comando `/loc` para solicitar ubicación
- **timingCmd.js**: Comando `/timing` para calcular distancias y tiempos
- **geoCmd.js**: Comando `/geo` para obtener ubicaciones actuales
- **adminCmd.js**: Comandos administrativos (`/changeOP`, `/changeOPs`)
- **helpCmd.js**: Comando `/help` para mostrar ayuda

### 3. `src/handlers/`
- **locationHandler.js**: Procesa actualizaciones de ubicación
- **index.js**: Registra todos los manejadores de eventos

### 4. `src/services/`
- **hereService.js**: Integración con HERE Maps API
- **reportService.js**: Formato y generación de reportes

### 5. `src/middlewares/`
- **authMiddleware.js**: Verificación de permisos de administrador

### 6. `src/utils/`
- **diagnosticTool.js**: Herramienta de diagnóstico del sistema

### 7. `src/config/`
- **index.js**: Gestión de variables de entorno
- **logger.js**: Configuración de Winston para logging

### 8. `src/storage/`
- **index.js**: Almacenamiento centralizado de datos (reemplaza variables globales)

## 🔄 Flujo de una Solicitud

1. El usuario envía un comando (ej: `/timing`)
2. El bot recibe el mensaje y lo procesa mediante el sistema de polling o webhook
3. La función registrada en `src/bot/commands.js` captura el comando
4. Se llama al manejador específico en `src/commands/timingCmd.js`
5. El comando verifica permisos usando `src/middlewares/authMiddleware.js`
6. Accede a datos mediante `src/storage/index.js`
7. Utiliza servicios externos mediante `src/services/hereService.js`
8. Formatea respuesta con `src/services/reportService.js`
9. Envía la respuesta al usuario

## 📝 Guía para Añadir Nuevos Comandos

1. **Crear el archivo del comando**:
   ```bash
   touch src/commands/miNuevoCmd.js
   ```

2. **Implementar la lógica del comando**:
   ```javascript
   // src/commands/miNuevoCmd.js
   const logger = require('../config/logger');

   module.exports = (bot) => {
     return (msg) => {
       // Implementar lógica aquí
       logger.info(`Comando ejecutado por usuario ${msg.from.id}`);
       bot.sendMessage(msg.chat.id, 'Respuesta al comando');
     };
   };
   ```

3. **Registrar el comando**:
   ```javascript
   // En src/bot/commands.js
   const miNuevoCmd = require('../commands/miNuevoCmd');
   
   // Añadir en la función registerCommands
   bot.onText(/\/miNuevo/, (msg) => {
     try {
       miNuevoCmd(bot)(msg);
     } catch (error) {
       logger.error(`Error en comando: ${error.message}`);
     }
   });
   ```

## 🛠️ Ventajas de la Nueva Arquitectura

1. **Fácil diagnóstico**: El comando `/diagnostico` permite ver el estado del sistema
2. **Aislamiento de problemas**: Cada componente está separado y puede probarse individualmente
3. **Escalabilidad**: Añadir nuevas funciones es más simple y no afecta al código existente
4. **Gestión de entornos**: Alternancia automática entre desarrollo y producción
5. **Mejor logging**: Sistema centralizado para facilitar la depuración