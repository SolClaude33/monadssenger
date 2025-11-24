# 🚀 Guía Rápida: Desplegar en Vercel

Vercel es mucho más fácil que Railway para Next.js y dominios personalizados.

## 📋 Paso 1: Conectar Repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta (gratis)
2. Haz clic en **"Add New Project"**
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio: `SolClaude33/monadssenger`
5. Vercel detectará automáticamente que es Next.js

## 🔧 Paso 2: Configurar Variables de Entorno

En la configuración del proyecto, agrega estas variables de entorno:

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

**Importante:** Copia los valores de tu proyecto Firebase (los mismos que usaste en Railway).

## 🚀 Paso 3: Desplegar

1. Haz clic en **"Deploy"**
2. Vercel construirá y desplegará automáticamente
3. En 1-2 minutos tendrás tu app funcionando en `monadssenger.vercel.app`

## 🌐 Paso 4: Configurar Dominio Personalizado (MUY FÁCIL)

1. En tu proyecto de Vercel, ve a **Settings** → **Domains**
2. Ingresa: `monadssenger.fun`
3. Vercel te dará instrucciones específicas para GoDaddy

### Para GoDaddy:

Vercel te dará algo como esto:
- **Tipo:** CNAME
- **Nombre:** `@` o `monadssenger.fun`
- **Valor:** `cname.vercel-dns.com`

**PERO** como GoDaddy no permite CNAME en `@`, Vercel te dará una solución alternativa:

1. Vercel detectará que usas GoDaddy
2. Te dará instrucciones específicas
3. Usualmente te pedirá agregar un registro A con una IP específica
4. O te dirá que uses `www` primero y luego redirija

**La ventaja:** Vercel tiene mejor soporte para GoDaddy y te guía paso a paso.

## ✅ Ventajas de Vercel vs Railway

- ✅ Detección automática de Next.js
- ✅ Configuración de dominio más fácil
- ✅ Mejor soporte para GoDaddy
- ✅ Despliegues más rápidos
- ✅ SSL automático
- ✅ CDN global incluido
- ✅ Plan gratuito generoso

## 🔥 Firebase sigue funcionando igual

No necesitas cambiar nada del código, Firebase funciona igual en Vercel.

---

¡Listo! En 5 minutos deberías tener todo funcionando. 🎉

