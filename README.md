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
- Railway (para deployment)

## ⚙️ Requisitos Previos
- Node.js (versión recomendada: 18.x o superior)
- NPM (incluido con Node.js)
- Cuenta en Telegram
- Cuenta en HERE Developer Portal
- Cuenta en Railway

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
| NODE_ENV | Entorno de ejecución | production |

### Variables Opcionales
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| PORT | Puerto del servidor (Railway lo configura automáticamente) | 8443 |
| RAILWAY_PORT | Puerto asignado por Railway (automaático) | - |
| RAILWAY_STATIC_URL | URL asignada por Railway (automático) | - |
| APP_URL | URL personalizada (opcional) | - |
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

### 🚀 Producción en Railway (Webhook)

1. **Conectar repositorio a Railway**:
   - Conecta tu repository de GitHub a Railway
   - Railway detectará automáticamente la configuración de Node.js
   - Configura las variables de entorno en Railway Dashboard

2. **Configurar variables de entorno en Railway**:
   - Ve a tu proyecto en Railway
   - Ve a la pestaña "Variables"
   - Añade todas las variables requeridas

3. **Desplegar a Railway**:
   ```bash
   # Subir cambios a GitHub (Railway lo detectará automáticamente)
   git add .
   git commit -m "Mensaje descriptivo de los cambios"
   git push origin main
   ```

4. **Verificar deployment**:
   - Railway asignará automáticamente una URL pública
   - El webhook se configurará automáticamente usando la URL de Railway
   - Revisa los logs en Railway Dashboard para confirmar el inicio correcto

### 🔄 Alternar entre Entornos

#### De Producción a Desarrollo:

1. **Pausar el deployment en Railway**:
   - En Railway Dashboard, puedes pausar el deployment
   - O simplemente iniciar localmente (el webhook será eliminado automáticamente)

2. **Iniciar localmente**:
   ```bash
   npm run dev
   ```
   - El bot elimina automáticamente el webhook al iniciar

#### De Desarrollo a Producción:

1. **Detener el bot local**:
   - Presionar `Ctrl+C` en la terminal

2. **Asegurarse de que Railway esté activo**:
   - Railway reanudará automáticamente el deployment
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
1. **Verificar estado del deployment**:
   - Revisa el estado en Railway Dashboard
   - Ve a la pestaña "Deployments"
2. **Revisar logs**:
   - Abre los logs en Railway Dashboard
   - Busca errores o advertencias
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

## 🚀 Comandos Útiles para Railway

### Usando Railway CLI (opcional)
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login a Railway
railway login

# Ver logs en tiempo real
railway logs

# Ver variables configuradas
railway vars

# Restart el servicio
railway up

# Abrir dashboard en el navegador
railway open
```

### Sin Railway CLI (usando Railway Dashboard)
- Accede a [Railway Dashboard](https://railway.app)
- Selecciona tu proyecto
- Usa la pestaña "Deployments" para ver el estado
- Usa la pestaña "Logs" para monitoreo en tiempo real
- Usa la pestaña "Variables" para configurar el entorno

## 🔒 Seguridad
- Rotar periódicamente los tokens
- No compartir las variables de entorno
- Mantener actualizada la lista de administradores
- Verificar regularmente los accesos

## 📞 Soporte
[Especificar información de contacto para soporte]

## 🆕 Novedades con Railway

Railway ofrece varias ventajas sobre Heroku:
- No necesita `Procfile` - detecta automáticamente Node.js
- Asigna automáticamente `RAILWAY_PORT` y `RAILWAY_STATIC_URL`
- Mejor integración con GitHub para deployments automáticos
- Logs en tiempo real más fáciles de acceder
- Variables de entorno más fáciles de gestionar