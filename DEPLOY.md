# Despliegue gratuito (proyecto escolar)

Guía paso a paso para subir los 3 servicios **gratis** y con poco esfuerzo.

| Servicio        | Plataforma | Plan      |
|-----------------|------------|-----------|
| Frontend Next.js| **Vercel** | Free      |
| Inventory API   | **Render** | Free      |
| Alerts Service  | **Render** | Free      |
| Cola / Redis    | **Upstash**| Free tier |

---

## Requisitos previos

1. **Cuentas gratuitas**
   - [Vercel](https://vercel.com/signup) (GitHub)
   - [Render](https://render.com/register) (GitHub)
   - [Upstash](https://console.upstash.com/) (Redis)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (si no lo tienes)

2. **Código en GitHub**  
   Sube este proyecto a un repo (p. ej. `tu-usuario/legacyappUpdated`).

---

## 1. Redis en Upstash (cola)

1. Entra en [Upstash Console](https://console.upstash.com/).
2. **Create Database** → región cercana → Create.
3. En la base creada, pestaña **REST API**.
4. Copia:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**  
   Los usarás en los dos backends (Render).

---

## 2. Inventory API en Render

> Recomendado: usa el archivo `render.yaml` de la raíz del repo (Blueprint) para que Render tome automáticamente `rootDir`, `buildCommand` y `startCommand` correctos en monorepo.

1. [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service**.
2. Conecta tu **repositorio de GitHub** y selecciona el repo del proyecto.
3. Configuración:
   - **Name:** `inventory-api` (o el que quieras).
   - **Root Directory:** `services/inventory-api`
   - **Runtime:** `Node`
   - **Build Command:** `pnpm install && pnpm run build`  
     (Si falla, prueba: `npm install && npm run build` y **Start Command:** `npm start`.)
   - **Start Command:** `pnpm start`
4. **Environment Variables** (Add):
   - `MONGODB_URI` = tu URI de MongoDB Atlas (la misma que en local).
   - `UPSTASH_REDIS_REST_URL` = valor de Upstash.
   - `UPSTASH_REDIS_REST_TOKEN` = valor de Upstash.
   - `NODE_VERSION` = `20` (opcional, recomendado).
5. **Create Web Service**.
6. Cuando termine el deploy, copia la **URL** del servicio (ej. `https://inventory-api-xxxx.onrender.com`). La usarás en el frontend y en el siguiente paso mental.

---

## 3. Alerts Service en Render

1. De nuevo **New** → **Web Service**, mismo repo.
2. Configuración:
   - **Name:** `alerts-service`
   - **Root Directory:** `services/alerts-service`
   - **Runtime:** `Node`
   - **Build Command:** `pnpm install && pnpm run build`  
     (Si falla, usa `npm install && npm run build` y **Start Command:** `npm start`.)
   - **Start Command:** `pnpm start`
3. **Environment Variables**:
   - `UPSTASH_REDIS_REST_URL` = mismo de Upstash.
   - `UPSTASH_REDIS_REST_TOKEN` = mismo de Upstash.
   - `NODE_VERSION` = `20` (opcional).
4. **Create Web Service**.
5. Copia la **URL** del servicio (ej. `https://alerts-service-xxxx.onrender.com`).

---

## 4. Frontend en Vercel

1. [Vercel](https://vercel.com) → **Add New** → **Project**.
2. Importa el **mismo repo** de GitHub.
3. Configuración:
   - **Root Directory:** deja por defecto (raíz del repo).
   - **Framework Preset:** Next.js (lo detecta solo).
   - **Build Command:** `pnpm build` (o el que venga por defecto).
4. **Environment Variables** (añade antes de desplegar):
   - `MONGODB_URI` = tu URI de MongoDB Atlas (para login y usuarios).
   - `NEXT_PUBLIC_INVENTORY_API_URL` = **URL completa** del Inventory API en Render (ej. `https://inventory-api-xxxx.onrender.com`).
   - `NEXT_PUBLIC_ALERTS_API_URL` = **URL completa** del Alerts Service en Render (ej. `https://alerts-service-xxxx.onrender.com`).
5. **Deploy**.

Cuando termine, tendrás la URL del frontend (ej. `https://legacyapp-updated.vercel.app`).

---

## 5. (Opcional) Procesar la cola de alertas

En Render free, no hay cron integrado. Para que las alertas se generen puedes:

- **Opción A:** Usar [cron-job.org](https://cron-job.org) (gratis). Creas un cron que cada 5 minutos haga:
  - Método: **POST**
  - URL: `https://tu-alerts-service.onrender.com/api/internal/process`
- **Opción B:** Llamar a mano cuando quieras probar:
  ```bash
  curl -X POST https://tu-alerts-service.onrender.com/api/internal/process
  ```

---

## Resumen de URLs

Al terminar tendrás algo así:

| Componente     | URL (ejemplo) |
|----------------|----------------|
| Frontend      | `https://tu-proyecto.vercel.app` |
| Inventory API | `https://inventory-api-xxxx.onrender.com` |
| Alerts Service| `https://alerts-service-xxxx.onrender.com` |

**Importante:** En Render (plan free) el servicio se “duerme” tras ~15 min sin tráfico. La primera petición después de eso puede tardar 30–60 s (cold start). Es normal en plan gratuito.

---

## Si algo falla

- **Build en Render:** Revisa que **Root Directory** sea exactamente `services/inventory-api` o `services/alerts-service` y que el **Build Command** use `pnpm`.
- **Frontend no ve los backends:** Comprueba que las URLs en Vercel no lleven barra final (ej. `https://inventory-api-xxxx.onrender.com` sin `/` al final) y que empiecen por `https://`.
- **MongoDB:** En Atlas, en **Network Access**, añade `0.0.0.0/0` para permitir conexiones desde cualquier IP (Vercel y Render).
