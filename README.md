# Monadssenger

Un messenger moderno inspirado en MSN Messenger, construido con Next.js y Supabase.

## 🚀 Características

- 💬 Chat en tiempo real con múltiples salas (Lobby, BNB, USA, Dev)
- 🎨 Interfaz inspirada en MSN Messenger con tema Monad
- 😊 Selector de emojis y atajos de teclado
- ⌨️ Indicadores de escritura en tiempo real
- 🛡️ Filtro de palabras ofensivas
- 📱 Diseño responsive

## 📋 Prerequisitos

- Node.js 18+ y pnpm (o npm/yarn)
- Una cuenta de Supabase (gratis) o PostgreSQL en Railway

## 🛠️ Configuración

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd monadssenger
pnpm install
```

### 2. Configurar Base de Datos

#### Opción A: Usar Supabase (Recomendado)

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API y copia:
   - Project URL
   - Anon/Public Key
3. En el SQL Editor de Supabase, ejecuta el script `scripts/001_create_chat_tables.sql`
4. Ve a Database > Replication y habilita Realtime para las tablas `messages` y `typing_indicators`

#### Opción B: Usar PostgreSQL en Railway

1. Crea una base de datos PostgreSQL en [Railway](https://railway.app)
2. Conecta a tu base de datos y ejecuta el script `scripts/001_create_chat_tables.sql`
3. Crea un proyecto en Supabase y conecta tu base de datos externa, o usa directamente PostgreSQL con las API routes

### 3. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Ejecutar en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🚢 Despliegue en Railway

1. Conecta tu repositorio a Railway
2. Railway detectará automáticamente Next.js
3. Agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Railway desplegará automáticamente tu aplicación

### Configurar Base de Datos en Railway

1. En Railway, crea un nuevo servicio PostgreSQL
2. Copia la connection string
3. Si usas Supabase, puedes conectar tu base de datos de Railway a Supabase, o usar directamente PostgreSQL
4. Ejecuta el script SQL en tu base de datos

## 📁 Estructura del Proyecto

```
monadssenger/
├── app/
│   ├── api/
│   │   ├── messages/      # API routes para mensajes
│   │   └── typing/        # API routes para indicadores de escritura
│   ├── page.tsx           # Componente principal del chat
│   └── layout.tsx
├── components/
│   ├── emoji-picker.tsx
│   └── ui/                # Componentes UI
├── lib/
│   ├── supabase/          # Cliente de Supabase
│   └── utils.ts
└── scripts/
    └── 001_create_chat_tables.sql  # Script de inicialización de BD
```

## 🔧 Tecnologías

- **Next.js 15** - Framework React
- **Supabase** - Base de datos PostgreSQL + Realtime
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes UI accesibles

## 📝 Notas

- Los mensajes se guardan en PostgreSQL y son visibles para todos los usuarios
- El chat funciona en tiempo real usando Supabase Realtime
- Si no hay configuración de Supabase, la app usa almacenamiento en memoria (solo para desarrollo)
- Los indicadores de escritura se limpian automáticamente después de 10 segundos

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor abre un issue o un pull request.

## 📄 Licencia

MIT
