# Notas de Migración: React Router → Next.js

## ✅ Proyecto Next.js Completado

El nuevo proyecto Next.js está completamente implementado en la carpeta `/src`:

```
src/
├── app/              ← Nueva estructura Next.js
├── entities/         ← Modelos de dominio
├── dataAccess/       ← Repositorios
└── services/         ← Use-cases
```

## 🗑️ Archivos Obsoletos (React Router)

Los siguientes archivos/carpetas son del proyecto anterior React Router y pueden eliminarse:

- `app/` (carpeta raíz, NO confundir con `src/app/`)
- `react-router.config.ts`
- `vite.config.ts`
- `.react-router/`

**NOTA**: No los eliminé automáticamente por precaución. Puedes borrarlos manualmente con:

```bash
rm -rf app/ react-router.config.ts vite.config.ts .react-router/
```

## 🚀 Comenzar a Usar

```bash
# 1. Instalar dependencias (Next.js, React 19, TypeScript)
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir http://localhost:3000
```

## ⚠️ Importante

- El proyecto ahora usa **Next.js 15 App Router**
- La carpeta activa es `src/app/`, NO la carpeta `app/` de la raíz
- Todo persiste en localStorage (claves: `ffpb:v1:playbooks`, `ffpb:v1:formations`)

## 🏗️ Estructura del Código

Ver README.md para documentación completa de arquitectura y uso.
