# 🗄️ Guía Rápida: Configurar PostgreSQL en Railway

## Paso 1: Crear Base de Datos PostgreSQL

1. En tu proyecto de Railway, haz clic en **"+ New"** (botón morado en la esquina superior derecha)
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente una base de datos PostgreSQL
4. Espera 1-2 minutos a que se cree completamente

## Paso 2: Obtener la Connection String

1. Haz clic en el servicio **PostgreSQL** que acabas de crear
2. Ve a la pestaña **"Variables"**
3. Busca la variable **`DATABASE_URL`** (Railway la crea automáticamente)
4. **Copia** el valor completo - lo necesitarás después

**Ejemplo de DATABASE_URL:**
```
postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

## Paso 3: Conectar la Base de Datos a tu Servicio Next.js

Railway debería compartir automáticamente la variable `DATABASE_URL` entre servicios del mismo proyecto. Verifica:

1. Ve a tu servicio **Next.js**
2. Pestaña **"Variables"**
3. Deberías ver **`DATABASE_URL`** listada ahí
4. Si NO está, haz clic en **"+ New Variable"** y agrega:
   - **Name:** `DATABASE_URL`
   - **Value:** (pega el valor que copiaste del servicio PostgreSQL)

## Paso 4: Ejecutar el Script SQL

Tienes varias opciones para ejecutar el script SQL:

### Opción A: Railway Web Interface (MÁS FÁCIL) ⭐

1. Haz clic en tu servicio **PostgreSQL**
2. Ve a la pestaña **"Data"** o **"Query"** (depende de la versión de Railway)
3. Si ves un editor SQL, copia y pega el contenido completo de `scripts/001_create_chat_tables.sql`
4. Haz clic en **"Run"** o **"Execute"**

### Opción B: Railway CLI

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

4. Conecta a PostgreSQL:
   ```bash
   railway connect postgres
   ```

5. Esto abrirá psql. Luego ejecuta:
   ```sql
   \i scripts/001_create_chat_tables.sql
   ```
   O copia y pega el contenido del archivo directamente.

### Opción C: Cliente SQL Externo (pgAdmin, DBeaver, etc.)

1. Usa la `DATABASE_URL` que copiaste
2. Conéctate con tu cliente SQL favorito
3. Ejecuta el contenido de `scripts/001_create_chat_tables.sql`

## Paso 5: Verificar que Funcionó

Después de ejecutar el script, verifica que las tablas se crearon:

1. En Railway PostgreSQL → **"Data"** o **"Query"**
2. Ejecuta:
   ```sql
   \dt
   ```
   O:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. Deberías ver las tablas:
   - `messages`
   - `typing_indicators`

## Paso 6: Reiniciar tu Servicio Next.js

1. Ve a tu servicio Next.js
2. Haz clic en los **tres puntos** (⋯) → **"Redeploy"**
3. O simplemente haz un nuevo commit a GitHub y Railway desplegará automáticamente

## ✅ Verificación Final

1. Abre tu dominio de Railway (ej: `monadssenger-production-xxxx.up.railway.app`)
2. Intenta enviar un mensaje
3. Si funciona, ¡listo! 🎉

## 🔧 Solución de Problemas

### Error: "DATABASE_URL environment variable is not set"
- Verifica que `DATABASE_URL` esté en las Variables del servicio Next.js
- Asegúrate de que ambos servicios (PostgreSQL y Next.js) estén en el mismo proyecto

### Error: "relation 'messages' does not exist"
- El script SQL no se ejecutó correctamente
- Vuelve al Paso 4 y ejecuta el script de nuevo
- Verifica que no haya errores en la ejecución del script

### Error: "connection refused" o "timeout"
- Verifica que el servicio PostgreSQL esté corriendo (debe estar en estado "Active")
- Asegúrate de que la `DATABASE_URL` sea correcta

---

**¿Listo?** Una vez que completes estos pasos, tu aplicación debería funcionar correctamente con la base de datos. 🚀

