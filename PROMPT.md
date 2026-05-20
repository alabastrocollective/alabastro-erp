# Prompt para crear un nuevo ERP

Copia este prompt y pásaselo al agente de Cursor cuando quieras crear un nuevo ERP basado en este template.

---

## Prompt

```
Estoy creando un nuevo ERP usando un template base que ya tiene:

### Stack tecnológico
- React Router v7 (SSR habilitado, Vite)
- Tailwind CSS v4 + tw-animate-css
- shadcn/ui (estilo new-york, lucide icons)
- Supabase (auth + base de datos + storage)
- Zustand (estado global: auth, loading)
- Recharts (gráficos)
- Sonner (toasts)
- date-fns (fechas)
- PWA con Service Worker y Web Push
- Deploy en Vercel

### Estructura del proyecto
```
app/
├── app.css              — Estilos globales (Tailwind theme tokens + scrollbar)
├── erp-branding.config.json — Nombre, colores, logo del ERP
├── root.tsx             — Layout HTML raíz (meta, PWA, fuentes, toaster)
├── routes.ts            — Definición de rutas
├── routes/              — Archivos de ruta (auth, dashboard, home, módulos)
├── dashboard/           — Layout autenticado (sidebar + main content)
├── components/
│   ├── ui/              — Componentes shadcn/ui (button, card, dialog, select, etc.)
│   ├── root/Loading/    — Pantalla de carga global
│   ├── PwaServiceWorker.tsx
│   ├── VersionUpdateBanner.tsx
│   └── FullPageLoader.tsx
├── services/            — Lógica de negocio + llamadas Supabase
├── store/               — Zustand stores (authStore, loadingStore)
├── lib/                 — Utilidades (cn, branding, device, dateUtils)
├── hooks/               — Custom hooks (use-mobile)
└── utils/               — Supabase client singleton
public/
├── manifest.webmanifest
├── sw.js
├── icono.png            — Logo/icono del ERP (base para PWA icons)
└── icons/               — Generados automáticamente por tools/generate-pwa-icons.mjs
tools/
├── generate-pwa-icons.mjs
└── write-build-version.mjs
supabase/
└── migrations/          — SQL migrations
```

### Convenciones clave
1. **Branding configurable** vía `app/erp-branding.config.json` — cambia appName, colores, logo y se refleja en toda la app (sidebar, login, PWA).
2. **Colores del tema** definidos en app.css como CSS custom properties:
   - `--color-primary-blue: #2a4945` (verde oscuro, sidebar, textos)
   - `--color-accent-blue: #abd9cd` (verde claro, botones, hover)
   - `--color-secondary-blue: #d8dfd6` (fondo suave)
3. **Sidebar** con fondo `primary-blue`, texto blanco, items con hover verde claro. Soporta secciones colapsibles con subitems.
4. **Login** pantalla completa con fondo `primary-blue`, logo centrado, form con inputs translúcidos.
5. **Componentes UI** todos en `app/components/ui/` — usar `npx shadcn@latest add [componente]` para agregar más.
6. **Servicios** en `app/services/` — cada módulo tiene su archivo (ej: `finanzasService.ts`).
7. **Auth**: Supabase Auth con email+password. Store persistido con zustand/persist. Roles en `user_metadata.role`.
8. **Responsive**: mobile-first, sidebar colapsable en móvil.
9. **Idioma**: toda la UI en español.
10. **Base de datos**: tablas con RLS (Row Level Security) habilitado. Migraciones SQL en `supabase/migrations/`.

### Para crear un módulo nuevo:
1. Crear service en `app/services/miModuloService.ts`
2. Crear migración SQL en `supabase/migrations/NNN_mi_modulo.sql`
3. Crear página en `app/dashboard/mi-modulo/Page.tsx`
4. Crear ruta en `app/routes/mi-modulo.tsx` que importa el Page
5. Registrar en `app/routes.ts`
6. Agregar al sidebar en `app/components/ui/app-sidebar.tsx`

### Variables de entorno necesarias (.env):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

Ahora, el ERP que necesito es para: [DESCRIBE AQUÍ EL NEGOCIO Y LOS MÓDULOS QUE NECESITAS]

Por ejemplo:
- Nombre del ERP: "Clínica XYZ"
- Módulos: Pacientes, Citas, Historiales, Facturación, Reportes
- Roles: admin, doctor, recepcionista

Crea los módulos necesarios siguiendo la estructura y convenciones del template.
```

---

## Pasos para iniciar un nuevo ERP

1. Copia la carpeta `erp-template` con un nuevo nombre
2. Edita `app/erp-branding.config.json` (nombre, colores, logo)
3. Coloca tu logo en `public/icono.png` (y opcionalmente `logo.png`, `logo-light.png`)
4. Crea un proyecto en Supabase y copia las credenciales al `.env`
5. Ejecuta `npm install`
6. Ejecuta `npm run dev`
7. Pasa el prompt de arriba al agente con la descripción de tu negocio

## Notas

- El template viene **sin módulos de negocio** (sin finanzas, ventas, etc.) — solo auth + layout + home vacío.
- Los componentes shadcn/ui incluidos son los más usados. Si necesitas más, el agente puede agregarlos con `npx shadcn@latest add [componente]`.
- La migración SQL base de auth la maneja Supabase automáticamente. Tus tablas van en `supabase/migrations/`.
