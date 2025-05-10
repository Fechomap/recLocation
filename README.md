# Bot de Seguimiento de Ubicación en Tiempo Real

## 📝 Descripción
Bot de Telegram diseñado para el seguimiento en tiempo real de ubicaciones, cálculo de rutas y tiempos estimados de llegada. Ideal para la gestión de flotas y seguimiento de unidades móviles.

## 🚀 Características
- Seguimiento de ubicación en tiempo real
- Cálculo de distancias y tiempos de llegada
- Reportes de geolocalización detallados
- Sistema de administración de usuarios
- Integración con HERE Maps para cálculo de rutas
- Soporte para múltiples grupos y usuarios
- Interfaz a través de comandos de Telegram
- **Nueva**: Arquitectura modular para fácil mantenimiento y extensión
- **Nueva**: Alternancia automática entre webhook (producción) y polling (desarrollo)

## 🛠️ Tecnologías Utilizadas
- Node.js
- Express.js
- API de Telegram Bot
- HERE Maps API
- Winston (para logging)
- Heroku (para deployment)

## ⚙️ Requisitos Previos
- Node.js (versión recomendada: 14.x o superior)
- NPM (incluido con Node.js)
- Cuenta en Telegram
- Cuenta en HERE Developer Portal
- Cuenta en Heroku

## 📦 Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd [NOMBRE_DEL_DIRECTORIO]
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo .env en la raíz del proyecto:
```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
HERE_API_KEY=tu_api_key_aqui
ADMIN_GROUP_ID=-100xxxxxxxxxx
ADMIN_IDS=id1,id2,id3,id4
APP_URL=https://tu-app.herokuapp.com/
NODE_ENV=production
```

## 🔑 Variables de Entorno

### Variables Requeridas
| Variable | Descripción | Ejemplo |
|----------|-------------|----------|
| TELEGRAM_BOT_TOKEN | Token del bot de Telegram | 123456789:ABCdefGHIjklMNOpqrsTUVwxyz |
| HERE_API_KEY | API Key de HERE Maps | abc123def456ghi789 |
| ADMIN_GROUP_ID | ID del grupo de administradores | -1001234567890 |
| ADMIN_IDS | IDs de usuarios administradores | 123456789,987654321 |
| APP_URL | URL de la aplicación en Heroku | https://myapp.herokuapp.com |
| NODE_ENV | Entorno de ejecución | production |

### Variables Opcionales
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| PORT | Puerto del servidor | 8443 |
| LOG_LEVEL | Nivel de detalle para logs | info |

## 📱 Comandos del Bot

| Comando | Descripción | Permisos |
|---------|-------------|-----------|
| /loc | Registrar ubicación en tiempo real | Todos |
| /timing | Calcular distancias y tiempos | Admin |
| /geo | Obtener ubicación actual de unidades | Admin |
| /changeOP | Asignar nombre a un usuario | Admin |
| /changeOPs | Registrar múltiples operadores | Admin |
| /diagnostico | Mostrar estado del sistema | Admin |
| /help | Mostrar ayuda | Todos |
| /test | Verificar respuesta del bot | Todos |

## 🔄 Flujo de Desarrollo y Producción

### 📱 Desarrollo Local (Polling)

1. **Preparar entorno de desarrollo**:
   ```bash
   # Asegurarse de que NODE_ENV=development
   echo "NODE_ENV=development" > .env.dev
   # Añadir el resto de variables de entorno a .env.dev
   ```

2. **Iniciar en modo desarrollo**:
   ```bash
   # Iniciar con configuración de desarrollo
   npm run dev
   # O con logging detallado
   LOG_LEVEL=debug npm run dev
   ```

3. **Características del modo desarrollo**:
   - El bot **elimina automáticamente** cualquier webhook existente
   - Inicia en modo polling sin necesidad de configuración adicional
   - No requiere URL pública ni configuración de puerto

### 🚀 Producción en Heroku (Webhook)

1. **Preparar para producción**:
   ```bash
   # Asegurarse de que los cambios están guardados
   git add .
   git commit -m "Mensaje descriptivo de los cambios"
   ```

2. **Desplegar a Heroku**:
   ```bash
   # Subir cambios a Heroku
   git push heroku main
   ```

3. **Escalar dynos**:
   ```bash
   # Asegurarse de tener al menos un dyno activo
   heroku ps:scale web=1
   ```

4. **Verificar estado**:
   ```bash
   # Ver logs para confirmar inicio correcto
   heroku logs --tail
   ```

### 🔄 Alternar entre Entornos

#### De Producción a Desarrollo:

1. **Bajar los dynos en Heroku**:
   ```bash
   heroku ps:scale web=0
   ```

2. **Iniciar localmente**:
   ```bash
   npm run dev
   ```
   - El bot elimina automáticamente el webhook al iniciar

#### De Desarrollo a Producción:

1. **Detener el bot local**:
   - Presionar `Ctrl+C` en la terminal

2. **Subir los dynos en Heroku**:
   ```bash
   heroku ps:scale web=1
   ```
   - El webhook se configura automáticamente al iniciar

## 🏗️ Estructura del Proyecto

La aplicación sigue una arquitectura modular para facilitar el mantenimiento:

```
📁 src/
├── 📁 bot/              # Configuración del bot
├── 📁 commands/         # Comandos del bot
├── 📁 handlers/         # Manejadores de eventos
├── 📁 services/         # Servicios externos (HERE Maps)
├── 📁 middlewares/      # Verificación de permisos
├── 📁 utils/            # Utilidades
├── 📁 config/           # Configuración de entorno
└── 📁 storage/          # Gestión centralizada de almacenamiento
```

## 🔍 Diagnóstico y Solución de Problemas

### Comando de Diagnóstico
El bot incluye un comando `/diagnostico` que muestra información detallada sobre:
- Grupos registrados
- Ubicaciones almacenadas
- Usuarios configurados
- Última actividad

Usa este comando cuando:
- Los reportes no muestran todas las unidades
- Los comandos `/geo` o `/timing` no funcionan correctamente
- Sospechas que hay problemas con el registro de ubicaciones

### Problemas Comunes

#### El bot no responde en producción
1. **Verificar estado de los dynos**:
   ```bash
   heroku ps
   ```
2. **Revisar logs**:
   ```bash
   heroku logs --tail
   ```
3. **Verificar webhook**:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```

#### El bot no responde en desarrollo
1. **Verificar que no hay webhook configurado**:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```
2. **Eliminar webhook manualmente si existe**:
   ```bash
   curl -X POST https://api.telegram.org/bot<TOKEN>/deleteWebhook
   ```
3. **Verificar que no hay otro proceso usando polling**:
   ```bash
   ps aux | grep node
   ```

## 🚀 Comandos Útiles para Heroku

### Ver logs
```bash
heroku logs --tail
```

### Ver variables configuradas
```bash
heroku config
```

### Reiniciar la aplicación
```bash
heroku restart
```

### Escalar dynos (apagar/encender)
```bash
# Apagar (para desarrollo local)
heroku ps:scale web=0

# Encender (para producción)
heroku ps:scale web=1
```

## 🔒 Seguridad
- Rotar periódicamente los tokens
- No compartir las variables de entorno
- Mantener actualizada la lista de administradores
- Verificar regularmente los accesos

## 📞 Soporte
[Especificar información de contacto para soporte]