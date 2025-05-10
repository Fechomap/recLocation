# Heroku Cheatsheet - Alternancia Desarrollo/Producción

## 🔄 Flujo de Trabajo Optimizado para Desarrollo/Producción

### Para trabajar localmente (bajar Heroku):

```bash
# 1. Desactivar dynos en Heroku
heroku ps:scale web=0

# 2. Verificar que los dynos estén desactivados
heroku ps

# 3. Iniciar bot en modo desarrollo
npm run dev
# O para mayor detalle en los logs:
LOG_LEVEL=debug npm run dev

# 4. El bot automáticamente eliminará cualquier webhook existente
# y se iniciará en modo polling sin pasos adicionales
```

### Para volver a producción (subir Heroku):

```bash
# 1. Detener el bot local (Ctrl+C)

# 2. Commitear cambios si es necesario
git add .
git commit -m "Descripción de los cambios"

# 3. Subir cambios a Heroku (opcional si hay cambios)
git push heroku main

# 4. Activar dynos en Heroku
heroku ps:scale web=1

# 5. Verificar inicio correcto
heroku logs --tail
```

## 📊 Monitoreo Rápido

```bash
# Ver logs en tiempo real
heroku logs --tail

# Ver variables de entorno
heroku config

# Ver estado de los dynos
heroku ps

# Ver última versión desplegada
heroku releases
```

## 🩺 Diagnóstico Rápido

```bash
# Reiniciar la aplicación en Heroku
heroku restart

# Forzar un rebuild
git commit --allow-empty -m "Forzar rebuild"
git push heroku main

# Verificar estado del webhook en Telegram
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo

# Eliminar webhook manualmente (rara vez necesario)
curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook
```

## 🚫 Solución de Problemas Comunes

1. **"Error R10 (Boot timeout)"**: Los dynos en Heroku tienen 60 segundos para iniciar
   ```bash
   # Optimizar el código de inicio o
   heroku config:set WEB_CONCURRENCY=1
   ```

2. **Webhook no se configura**:
   ```bash
   # Verificar que APP_URL sea correcta
   heroku config:get APP_URL
   
   # Establecer si es necesario
   heroku config:set APP_URL=https://<app-name>.herokuapp.com/
   ```

3. **Conflicto entre webhook y polling**:
   ```bash
   # Nunca debería ser necesario con la nueva implementación
   # Si ocurre, eliminar webhook manualmente
   curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook
   ```

## 🚀 Comandos de Desarrollo Local

```bash
# Iniciar con diferentes niveles de log
LOG_LEVEL=debug npm run dev   # Detallado
LOG_LEVEL=info npm run dev    # Normal
LOG_LEVEL=warn npm run dev    # Solo advertencias y errores

# Ejecutar comando de diagnóstico
# Usar /diagnostico en el chat con el bot
```

¡Guarda este archivo como referencia rápida para mantener un flujo de trabajo eficiente!