# ERP Template

Template base para crear ERPs con la misma estructura y estilo visual.

## Stack

- **Framework**: React Router v7 (SSR) + Vite
- **Estilos**: Tailwind CSS v4 + shadcn/ui (new-york)
- **Backend**: Supabase (Auth, Database, Storage)
- **Estado**: Zustand
- **Gráficos**: Recharts
- **Deploy**: Vercel

## Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# 3. Personalizar branding
# Edita app/erp-branding.config.json (nombre, colores)
# Coloca tu logo en public/icono.png

# 4. Iniciar desarrollo
npm run dev
```

## Personalización

### Branding (`app/erp-branding.config.json`)
```json
{
  "appName": "Mi ERP",
  "shortName": "ERP",
  "primaryColor": "#2a4945",
  "accentColor": "#abd9cd",
  "logoPath": "/logo.png",
  "faviconPath": "/icono.png"
}
```

### Agregar módulos

Ver `PROMPT.md` para instrucciones detalladas y un prompt listo para pasarle al agente de IA.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build de producción |
| `npm run start` | Servir build |
| `npm run icons` | Regenerar iconos PWA |

## Estructura

```
app/
├── components/ui/    — Componentes shadcn/ui
├── dashboard/        — Layout autenticado
├── routes/           — Páginas
├── services/         — Lógica de negocio
├── store/            — Estado global
├── lib/              — Utilidades
└── utils/            — Cliente Supabase
```
