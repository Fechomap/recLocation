# Documentación de la API de RegLocation Bot

## Índice
1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Endpoints](#endpoints)
4. [Integración](#integración)
5. [Códigos de respuesta](#códigos-de-respuesta)
6. [Ejemplos de uso](#ejemplos-de-uso)
7. [Consideraciones de seguridad](#consideraciones-de-seguridad)
8. [Troubleshooting](#troubleshooting)

## Introducción

La API de RegLocation Bot permite interactuar programáticamente con el sistema de seguimiento de ubicaciones en tiempo real. Esta API facilita la integración con aplicaciones externas para solicitar cálculos de rutas, distancias y tiempos estimados de llegada de las unidades registradas.

**URL Base:** `https://web-production-23d41.up.railway.app/`

**Características principales:**
- Solicitar reportes de timing (distancia y tiempo) hacia coordenadas específicas
- Envío automático de resultados a grupos de Telegram configurados
- Autenticación mediante tokens API
- Integración con HERE Maps para cálculo preciso de rutas

## Autenticación

Todas las solicitudes a la API requieren autenticación mediante un token de API que debe enviarse en el encabezado HTTP `X-API-Token`.

```
X-API-Token: token_1000_anios_jehova
```

> **Importante:** El token debe solicitarse al administrador del sistema. Las solicitudes sin token o con un token inválido recibirán un error 401 Unauthorized.

## Endpoints

### Verificación de estado

```
GET /health
```

**Descripción:** Verifica que el servicio esté funcionando correctamente.

**Autenticación:** No requerida

**Respuesta exitosa:**
```json
{
  "status": "ok",
  "time": "2025-05-15T12:34:56.789Z"
}
```

### Solicitar reporte de timing

```
POST /api/timing
```

**Descripción:** Calcula las distancias y tiempos estimados de llegada desde todas las unidades registradas hacia una coordenada de destino específica. El reporte generado se envía automáticamente al grupo de Telegram especificado.

**Autenticación:** Requerida (encabezado X-API-Token)

**Parámetros de solicitud:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| coordinates | string | Coordenadas de destino en formato "latitud,longitud" (por ejemplo, "19.395665,-99.195553") |
| chatId | string | ID del chat de Telegram donde se enviará el reporte (por ejemplo, "-1002420951714") |

**Ejemplo de cuerpo de solicitud:**
```json
{
  "coordinates": "19.395665,-99.195553",
  "chatId": "-1002420951714"
}
```

**Respuesta exitosa:**
```json
{
  "success": true
}
```

**Respuesta de error (sin ubicaciones registradas):**
```json
{
  "success": false,
  "message": "No hay datos de ubicación disponibles"
}
```

## Integración

### Ejemplo de integración con cURL

```bash
curl -X POST https://web-production-23d41.up.railway.app/api/timing \
  -H "Content-Type: application/json" \
  -H "X-API-Token: token_1000_anios_jehova" \
  -d '{"coordinates": "19.395665,-99.195553", "chatId": "-1002420951714"}'
```

### Ejemplo de integración con JavaScript (Node.js)

```javascript
const axios = require('axios');

async function requestTimingReport() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://web-production-23d41.up.railway.app/api/timing',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': 'token_1000_anios_jehova'
      },
      data: {
        coordinates: '19.395665,-99.195553',
        chatId: '-1002420951714'
      }
    });
    
    console.log('Respuesta:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

requestTimingReport();
```

### Ejemplo de integración con Python

```python
import requests
import json

def request_timing_report():
    url = "https://web-production-23d41.up.railway.app/api/timing"
    headers = {
        "Content-Type": "application/json",
        "X-API-Token": "token_1000_anios_jehova"
    }
    payload = {
        "coordinates": "19.395665,-99.195553",
        "chatId": "-1002420951714"
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()  # Lanza excepción si hay error HTTP
        print("Respuesta:", response.json())
        return response.json()
    except requests.exceptions.RequestException as e:
        print("Error:", e)
        if hasattr(e, 'response') and e.response is not None:
            print("Detalles:", e.response.json())
        raise

request_timing_report()
```

## Códigos de respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Solicitud exitosa |
| 400 | Solicitud inválida (parámetros faltantes o incorrectos) |
| 401 | No autorizado (token de API inválido o faltante) |
| 500 | Error interno del servidor |

## Ejemplos de uso

### Escenario 1: Sistema de despacho automatizado

Utiliza la API para solicitar automáticamente reportes de timing cada vez que se registra un nuevo pedido, enviando las coordenadas del cliente y recibiendo un reporte de las unidades más cercanas.

### Escenario 2: Integración con sistema de gestión de flotas

Integra la API con tu sistema de gestión de flotas para monitorear tiempos de entrega y optimizar rutas basándose en la ubicación actual de las unidades.

### Escenario 3: Panel de control web

Desarrolla un panel de control web que permita a los despachadores ver la ubicación de las unidades y solicitar reportes de timing con un clic en el mapa.

## Consideraciones de seguridad

1. **Protección del token API:** Nunca expongas el token API en código cliente (frontend). Realiza todas las solicitudes desde un servidor backend.

2. **HTTPS:** Todas las solicitudes deben realizarse mediante HTTPS para garantizar la encriptación de los datos.

3. **Validación de coordenadas:** La API valida que las coordenadas estén dentro de los rangos válidos (latitud: -90 a 90, longitud: -180 a 180).

4. **Limitación de acceso:** El token API solo debe compartirse con aplicaciones y desarrolladores autorizados.

## Troubleshooting

### Problema: Error "Token de API inválido"

**Solución:** Verifica que estás usando el token correcto y que lo estás enviando en el encabezado `X-API-Token`.

### Problema: Error "No hay datos de ubicación disponibles"

**Solución:** Asegúrate de que haya unidades activas que estén compartiendo su ubicación con el bot. Las unidades deben haber usado el comando `/loc` recientemente para que sus ubicaciones estén registradas.

### Problema: Las coordenadas no son aceptadas

**Solución:** Verifica que estás enviando las coordenadas en el formato correcto "latitud,longitud" y que los valores están dentro de los rangos válidos.

---

Para soporte técnico adicional, contacta al administrador del sistema o consulta la documentación detallada del bot RegLocation.