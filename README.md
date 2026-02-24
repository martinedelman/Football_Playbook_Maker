# Flag Football Playbook Maker

MVP de aplicación para crear y gestionar playbooks de Flag Football con arquitectura limpia y persistencia en localStorage.

## 🏈 Características

- ✅ Crear y gestionar playbooks
- ✅ Diseñar jugadas de ofensiva y defensiva
- ✅ Canvas interactivo con cancha de football
- ✅ 5 jugadores configurables por jugada
- ✅ Drag & drop para posicionar jugadores
- ✅ Dibujar rutas para cada jugador
- ✅ Anotaciones freehand sobre la cancha
- ✅ Guardar y cargar formaciones reutilizables
- ✅ Persistencia automática en localStorage
- ✅ Arquitectura limpia lista para backend

## 🏗️ Arquitectura

```
src/
├── app/                    # Next.js App Router
│   ├── components/         # Componentes React UI
│   │   ├── FieldCanvas.tsx      # Canvas SVG con drag & drop
│   │   ├── PlayEditor.tsx       # Editor principal de jugadas
│   │   ├── PlaybookList.tsx     # Lista lateral de playbooks
│   │   └── Toolbar.tsx          # Herramientas del editor
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página home
│   └── globals.css         # Estilos globales
│
├── entities/               # Modelos de dominio (sin UI)
│   └── index.ts            # Playbook, Play, Formation, etc.
│
├── dataAccess/             # Capa de acceso a datos
│   ├── repositories.ts           # Interfaces (contratos)
│   ├── localStorageRepositories.ts  # Implementación localStorage
│   └── container.ts              # Dependency injection (DI)
│
└── services/               # Lógica de aplicación (use-cases)
    ├── playbookService.ts
    ├── playService.ts
    └── formationService.ts
```

### Principios de diseño

- **Separation of Concerns**: UI, lógica de negocio y datos completamente separados
- **Dependency Injection**: Container centralizado para cambiar implementaciones
- **Repository Pattern**: Interfaces abstractas para facilitar migración a backend
- **TypeScript Strict**: Sin `any`, tipado completo
- **Clean Architecture**: Preparado para escalar

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo desarrollo
npm run dev

# 3. Abrir en navegador
# http://localhost:3000
```

### Scripts disponibles

```bash
npm run dev        # Desarrollo (hot reload)
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run typecheck  # Verificar tipos TypeScript
npm run lint       # Linter
```

## 📦 Deploy en Vercel

### Opción 1: Deploy automático desde GitHub

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Click en "Add New Project"
4. Importa tu repositorio
5. Vercel detectará Next.js automáticamente
6. Click en "Deploy"

### Opción 2: Deploy con Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

La configuración de Next.js ya está optimizada para Vercel (`output: 'standalone'` en next.config.js).

## 🎮 Uso de la Aplicación

### 1. Crear un Playbook

- En el panel izquierdo, click en "+ New" bajo "Playbooks"
- Ingresa un nombre y guarda

### 2. Crear una Jugada (Play)

- Selecciona un playbook
- Click en "+ New Play"
- Ingresa nombre y selecciona tipo (Offense/Defense)
- La jugada se abre automáticamente en el editor

### 3. Herramientas del Editor

#### 🖐️ Select/Drag

- **Uso**: Posicionar jugadores
- **Acción**: Arrastra los círculos numerados por la cancha

#### 🏈 Route

- **Uso**: Dibujar rutas de jugadores
- **Acción**:
  1. Click en un jugador para seleccionarlo
  2. Click en la cancha para agregar puntos de ruta
  3. Doble-click para finalizar la ruta

#### ✏️ Pen

- **Uso**: Anotaciones freehand
- **Acción**: Click y arrastra para dibujar sobre la cancha

### 4. Formaciones

#### Guardar formación

- Posiciona los jugadores como desees
- Click en "💾 Save Formation"
- Ingresa un nombre
- La formación se guarda para reutilizar

#### Cargar formación

- Abre el dropdown "Load Formation..."
- Selecciona una formación guardada
- Los jugadores se posicionan automáticamente

### 5. Limpiar Anotaciones

- Click en "🗑️ Clear Annotations" para borrar todas las anotaciones

## 💾 Persistencia de Datos

Todos los datos se guardan automáticamente en **localStorage** con claves versionadas:

```
ffpb:v1:playbooks   → [Playbook[]]
ffpb:v1:formations  → [Formation[]]
```

Los datos persisten entre sesiones del navegador en el mismo dominio.

## 🔌 Migración a Backend (Futuro)

La arquitectura está diseñada para migrar fácilmente a backend:

### 1. Crear implementaciones HTTP

```typescript
// src/dataAccess/httpRepositories.ts
export class HttpPlaybookRepository implements PlaybookRepository {
  async getAll(): Promise<Playbook[]> {
    const res = await fetch("/api/playbooks");
    return res.json();
  }
  // ... resto de métodos
}
```

### 2. Actualizar el Container

```typescript
// src/dataAccess/container.ts
const USE_HTTP = process.env.NEXT_PUBLIC_USE_BACKEND === 'true'

static getPlaybookRepository(): PlaybookRepository {
  if (!this._playbookRepo) {
    this._playbookRepo = USE_HTTP
      ? new HttpPlaybookRepository()
      : new LocalStoragePlaybookRepository()
  }
  return this._playbookRepo
}
```

### 3. Sin cambios en UI o Services

Los servicios y componentes UI **no necesitan cambios** porque trabajan contra interfaces abstractas.

## 🧪 Testing (Sugerencias)

Para agregar tests en el futuro:

```typescript
// Mock repositories para testing
class MockPlaybookRepository implements PlaybookRepository {
  private data: Playbook[] = [];

  async getAll() {
    return this.data;
  }
  async create(dto) {
    /* ... */
  }
  // ...
}

// Inyectar en tests
Container.setPlaybookRepository(new MockPlaybookRepository());
```

## 🛠️ Tecnologías

- **Next.js 15** (App Router)
- **React 18**
- **TypeScript 5** (strict mode)
- **Tailwind CSS 3**
- **localStorage** (persistencia MVP)

## 📝 Modelos de Datos

### Playbook

```typescript
{
  id: string
  name: string
  plays: Play[]
  createdAt: string
  updatedAt: string
}
```

### Play

```typescript
{
  id: string
  name: string
  side: "offense" | "defense"
  formationId?: string
  players: PlayerState[]
  routes: PlayerRoute[]
  annotations: AnnotationStroke[]
  createdAt: string
  updatedAt: string
}
```

### Formation

```typescript
{
  id: string
  name: string
  side: "offense" | "defense"
  players: PlayerState[]
  createdAt: string
  updatedAt: string
}
```

## 🐛 Troubleshooting

### El canvas no renderiza

- Verifica que estás en un navegador moderno con soporte SVG
- Abre la consola del navegador para ver errores

### Los datos no persisten

- Verifica que localStorage esté habilitado en el navegador
- Evita modo incógnito (puede limpiar localStorage al cerrar)

### Errores de TypeScript

```bash
npm run typecheck
```

## 📄 Licencia

Este proyecto es un MVP educativo. Úsalo libremente.

## 🤝 Contribuir

Este es un MVP. Para agregar features:

1. **Modelos**: Actualiza `src/entities/`
2. **DataAccess**: Actualiza interfaces y repositorios
3. **Services**: Agrega/modifica use-cases
4. **UI**: Crea componentes en `src/app/components/`

Mantén la separación de capas. La UI nunca debe acceder directamente a localStorage.

---

**¡A diagramar jugadas ganadoras! 🏈🎯**
