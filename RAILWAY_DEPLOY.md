# 🚂 Guía de Despliegue en Railway con PostgreSQL

Esta guía te ayudará a desplegar Monadssenger en Railway con PostgreSQL directamente (sin Supabase).

## 📋 Prerequisitos

1. Cuenta en [Railway](https://railway.app)
2. Repositorio en GitHub: https://github.com/SolClaude33/monadssenger

## 🗄️ Paso 1: Crear Base de Datos PostgreSQL en Railway

### 1.1 Crear el Servicio PostgreSQL

1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Haz clic en **"New Project"**
3. Selecciona **"Empty Project"** o crea un proyecto nuevo
4. Haz clic en **"+ New"** → **"Database"** → **"Add PostgreSQL"**
5. Railway creará automáticamente una base de datos PostgreSQL
6. Espera a que se cree (tarda 1-2 minutos)

### 1.2 Obtener la Connection String

1. Haz clic en el servicio PostgreSQL que acabas de crear
2. Ve a la pestaña **"Variables"**
3. Busca la variable **`DATABASE_URL`** (Railway la crea automáticamente)
4. Copia el valor completo (ej: `postgresql://postgres:password@hostname:5432/railway`)

### 1.3 Ejecutar el Script SQL

Tienes dos opciones:

#### Opción A: Usar Railway CLI (Recomendado)

1. Instala Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Inicia sesión:
   ```bash
   railway login
   ```

3. Conecta a tu proyecto:
   ```bash
   railway link
   ```

4. Conecta a la base de datos:
   ```bash
   railway connect postgres
   ```

5. Ejecuta el script SQL:
   ```bash
   psql < scripts/001_create_chat_tables.sql
   ```
   O copia y pega el contenido del archivo `scripts/001_create_chat_tables.sql` directamente en la terminal de psql.

#### Opción B: Usar un Cliente SQL (pgAdmin, DBeaver, etc.)

1. Usa la connection string de Railway para conectarte con tu cliente SQL favorito
2. Abre el archivo `scripts/001_create_chat_tables.sql`
3. Ejecuta todo el script en tu base de datos

#### Opción C: Usar Railway Web Interface

1. En Railway, haz clic en tu servicio PostgreSQL
2. Ve a la pestaña **"Data"** o **"Query"**
3. Copia y pega el contenido de `scripts/001_create_chat_tables.sql`
4. Ejecuta el script

## 🚀 Paso 2: Desplegar la Aplicación Next.js

### 2.1 Conectar Repositorio

1. En el mismo proyecto de Railway (o crea uno nuevo)
2. Haz clic en **"+ New"** → **"GitHub Repo"**
3. Autoriza Railway a acceder a tu GitHub si es necesario
4. Selecciona el repositorio: `SolClaude33/monadssenger`
5. Railway detectará automáticamente que es un proyecto Next.js

### 2.2 Configurar Variables de Entorno

En la configuración del servicio Next.js:

1. Ve a la pestaña **"Variables"**
2. Agrega la siguiente variable de entorno:

```
DATABASE_URL=tu_connection_string_de_postgresql
```

**Importante:** Railway debería crear automáticamente esta variable si ambos servicios están en el mismo proyecto. Si no, cópiala del servicio PostgreSQL.

**Ejemplo:**
```
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

### 2.3 Configurar Build Settings

Railway debería detectar automáticamente Next.js ya que el proyecto está en la raíz del repositorio.

**Verificación:**
- Railway detectará automáticamente `package.json` y configurará los comandos de build
- **Build Command**: `pnpm install && pnpm build` (o `npm install && npm run build`)
- **Start Command**: `pnpm start` (o `npm start`)

**Si Railway no detecta automáticamente:**
1. Ve a **Settings** → **Build & Deploy**
2. Verifica que los comandos estén configurados correctamente
3. Asegúrate de que el **Root Directory** esté vacío o sea `/` (raíz)

### 2.4 Desplegar

1. Railway comenzará a construir y desplegar automáticamente
2. Puedes ver el progreso en la pestaña **"Deployments"**
3. Una vez completado, Railway te dará una URL (ej: `monadssenger-production.up.railway.app`)

## ✅ Paso 3: Verificar el Despliegue

1. Abre la URL proporcionada por Railway
2. Deberías ver la aplicación Monadssenger
3. Intenta enviar un mensaje para verificar que la base de datos funciona
4. Abre otra pestaña/ventana para verificar que los mensajes se actualizan (polling cada 2 segundos)

## 🔧 Solución de Problemas

### Error: "DATABASE_URL environment variable is not set"
- Verifica que la variable `DATABASE_URL` esté configurada en el servicio Next.js
- Asegúrate de que ambos servicios (PostgreSQL y Next.js) estén en el mismo proyecto de Railway
- Railway puede compartir variables automáticamente si están en el mismo proyecto

### Error: "relation 'messages' does not exist"
- El script SQL no se ejecutó correctamente
- Verifica que ejecutaste `scripts/001_create_chat_tables.sql` en la base de datos
- Conéctate a la base de datos y verifica que las tablas existan:
  ```sql
  \dt
  ```

### Los mensajes no se actualizan en tiempo real
- Esto es normal - estamos usando polling cada 2 segundos en lugar de WebSockets
- Los mensajes se actualizarán automáticamente cada 2 segundos
- Si quieres actualización más rápida, puedes reducir el intervalo en `app/page.tsx` (línea ~200)

### Error de build en Railway
- Verifica que `package.json` tenga todos los scripts necesarios
- Revisa los logs de build en Railway para ver el error específico
- Asegúrate de que `pg` esté en las dependencias

### Error de conexión a la base de datos
- Verifica que el servicio PostgreSQL esté corriendo
- Asegúrate de que la `DATABASE_URL` sea correcta
- Verifica que las políticas de firewall de Railway permitan la conexión

## 🌐 Configurar Dominio en Railway

### Dominio Gratuito Automático

Railway asigna automáticamente un dominio gratuito a cada servicio:

1. Ve a tu servicio Next.js en Railway
2. Haz clic en la pestaña **"Settings"**
3. Busca la sección **"Networking"** o **"Domains"**
4. Verás un dominio automático tipo: `tu-servicio-production.up.railway.app`
5. Este dominio ya está activo y funcionando - puedes usarlo directamente

### Configurar Dominio Personalizado (Opcional)

Si quieres usar tu propio dominio:

1. En la misma sección **"Networking"** o **"Domains"**
2. Haz clic en **"Generate Domain"** o **"Custom Domain"**
3. Ingresa tu dominio (ej: `monadssenger.tudominio.com`)
4. Railway te dará un registro CNAME o A que debes configurar en tu proveedor de DNS
5. Una vez configurado, Railway verificará y activará el dominio

**Nota:** El dominio gratuito de Railway (`*.up.railway.app`) funciona inmediatamente sin configuración adicional.

## 📝 Notas Adicionales

- Railway ofrece un dominio gratuito automático (`*.up.railway.app`) que funciona inmediatamente
- Puedes configurar un dominio personalizado si lo deseas
- El plan gratuito de Railway incluye PostgreSQL con límites generosos
- Los mensajes se guardan permanentemente en la base de datos PostgreSQL
- Todos los usuarios pueden ver todos los mensajes (chat público)
- El polling se ejecuta cada 2 segundos para simular tiempo real (más eficiente que WebSockets para este caso)

## 🔗 Enlaces Útiles

- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)

## 📊 Estructura de la Base de Datos

Después de ejecutar el script SQL, tendrás:

- **Tabla `messages`**: Almacena todos los mensajes del chat
- **Tabla `typing_indicators`**: Almacena indicadores de escritura (se limpian automáticamente después de 10 segundos)

---

¡Listo! Tu Monadssenger debería estar funcionando en Railway con PostgreSQL. 🎉
