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
| DEST_LATITUDE | Latitud del destino | null |
| DEST_LONGITUDE | Longitud del destino | null |

## 📱 Comandos del Bot

| Comando | Descripción | Permisos |
|---------|-------------|-----------|
| /loc | Registrar ubicación en tiempo real | Todos |
| /timing | Calcular distancias y tiempos | Admin |
| /geo | Obtener ubicación actual de unidades | Admin |
| /setdestination | Establecer coordenadas de destino | Admin |
| /getdestination | Ver coordenadas de destino actuales | Todos |
| /changeOP | Asignar nombre a un usuario | Admin |
| /changeOPs | Registrar múltiples operadores | Admin |
| /help | Mostrar ayuda | Todos |

## 🚀 Deployment en Heroku

1. Crear nueva aplicación en Heroku:
```bash
heroku create tu-app-name
```

2. Configurar variables de entorno:
```bash
heroku config:set TELEGRAM_BOT_TOKEN=xxx
heroku config:set HERE_API_KEY=xxx
heroku config:set ADMIN_GROUP_ID=xxx
heroku config:set ADMIN_IDS=xxx
heroku config:set NODE_ENV=production
heroku config:set APP_URL=$(heroku info -s | grep web_url | cut -d= -f2)
```

3. Desplegar la aplicación:
```bash
git push heroku main
```

## 📝 Comandos Útiles para Heroku

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

## 🔍 Monitoreo y Logs
El sistema utiliza Winston para logging con los siguientes niveles:
- ERROR: Errores críticos que requieren atención inmediata
- WARN: Advertencias sobre posibles problemas
- INFO: Información general sobre el funcionamiento
- DEBUG: Información detallada para desarrollo

## 🛠️ Solución de Problemas

### El bot no responde
1. Verificar que el bot está activo en Telegram
2. Comprobar TELEGRAM_BOT_TOKEN
3. Revisar logs de Heroku
4. Verificar que el webhook está configurado correctamente

### Errores en cálculo de rutas
1. Verificar HERE_API_KEY
2. Comprobar formato de coordenadas
3. Verificar conectividad con API de HERE

### Problemas con permisos de administrador
1. Verificar ADMIN_IDS
2. Comprobar ADMIN_GROUP_ID
3. Asegurar que el bot es administrador en el grupo

## 🔒 Seguridad
- Rotar periódicamente los tokens
- No compartir las variables de entorno
- Mantener actualizada la lista de administradores
- Verificar regularmente los accesos

## 📄 Licencia
[Especificar tipo de licencia]

## 👥 Contribución
[Especificar guías de contribución]

## 📞 Soporte
[Especificar información de contacto para soporte]