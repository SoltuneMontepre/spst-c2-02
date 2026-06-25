# Design System Rules — Figma ↔ Code Integration

Rules for implementing Figma designs in this codebase using the Figma MCP. Read this before any design-to-code or code-to-Figma work.

## Figma Source of Truth

| Item                    | Value                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **File**                | [Design-Thanh-Long-Market](https://www.figma.com/design/R1oT2bmKxlIhvZ50JdSDCX/Design-Thanh-Long-Market) |
| **fileKey**             | `R1oT2bmKxlIhvZ50JdSDCX`                                                                                 |
| **Canvas page**         | `Dev-work` (`0:1`) — legacy; **`Dev-work-refactor`** (`64:2620`) for mobile + desktop frames |
| **Desktop section**     | `68:117` — `Desktop — 1440` (y≈5200 on `64:2620`)                                          |
| **Landing (logged-in)** | `5:2` / `64:2621` — `Landing / Logged In` (1440)                                             |
| **Session lobby**       | `38:422` mobile · `78:153` desktop — `Session / Lobby`                                       |

### Figma component library (off-canvas symbols)

Published symbols on the canvas (x≈1607) map to code primitives:

| Figma symbol                   | Code                                                                      |
| ------------------------------ | ------------------------------------------------------------------------- |
| `Brand` (`6:38`)               | `@/components/brand` → `Brand`                                            |
| `Button/primary/sm` (`6:43`)   | `buttonVariants({ variant: "primary", size: "sm" })`                      |
| `Button/primary/lg` (`6:45`)   | `buttonVariants({ variant: "primary", size: "lg" })`                      |
| `Button/outline/lg` (`6:47`)   | `buttonVariants({ variant: "outline", size: "lg" })`                      |
| `Button/secondary/lg` (`6:49`) | `buttonVariants({ variant: "secondary", size: "lg" })`                    |
| `Card` (`6:51`)                | `@/components/ui/card` → `Card`, `CardHeader`, `CardTitle`, `CardContent` |

Frame names in Figma intentionally mirror React component names: `LobbyView`, `SessionNav`, `BentoTile`, `GuidancePanel`, `LobbySetup`, `SetupParticipantRow`, `LobbyControls`, etc. Prefer matching these names when creating new components.

### MCP workflow

**Design → code**

1. `get_design_context` with `fileKey` + `nodeId` (convert `38-422` → `38:422`).
2. Treat returned React+Tailwind as **reference only** — adapt to project patterns below.
3. Check `get_code_connect_map` / Code Connect hints; none exist yet in this repo.
4. Use `download_assets` for raster/SVG exports when `get_design_context` returns asset URLs.

**Code → Figma**

1. Load `/figma-generate-design` and `/figma-use` skills before `use_figma` or `generate_figma_design`.
2. `search_design_system` first — reuse `Brand`, `Button/*`, `Card`, and color variables.
3. Bind fills/strokes to Figma variables; never hardcode hex in Figma when a variable exists.
4. For full pages: run `generate_figma_design` (screenshot capture) in parallel with `use_figma` (component assembly), then delete the screenshot reference frame.

Always pass `clientLanguages: "typescript"` and `clientFrameworks: "react,nextjs"`.

---

## 1. Token Definitions

### Where tokens live

Single source: `src/app/globals.css`. No `tailwind.config.*` — Tailwind v4 uses `@theme inline`.

```css
/* src/app/globals.css */
:root {
  --background: #fdf4f7;
  --foreground: #2b1f25;
  --surface: #ffffff;
  --muted: #f7e6ec;
  --muted-foreground: #7d6470;
  --border: #f0d4de;
  --ring: #e93970;
  --primary: #e93970;
  --primary-foreground: #ffffff;
  --secondary: #f7e6ec;
  --secondary-foreground: #2b1f25;
  --accent: #3aa76d;
  --accent-foreground: #ffffff;
  --value: #e93970;
  --price: #2563eb;
  --success: #3aa76d;
  --danger: #c0362c;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* …maps every --color-* to Tailwind utilities */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Palette semantics (dragonfruit theme)

- **Primary** `#e93970` — pink skin; CTAs, emphasis, ring focus.
- **Accent / success** `#3aa76d` — leaf green; role badges, online indicators.
- **Background** `#fdf4f7` — flesh tint; page canvas.
- **Surface** `#ffffff` — cards, inputs, nav bars.
- **Value** — same as primary; economic “giá trị” concept.
- **Price** `#2563eb` — market price charts only.
- **Danger** `#c0362c` — errors, destructive actions.

Dark mode: opt-in via `.dark` on `<html>` (tokens defined, app defaults to light).

### Figma variable mapping

Figma variables in file `R1oT2bmKxlIhvZ50JdSDCX` match CSS 1:1:

| Figma variable         | CSS / Tailwind                        |
| ---------------------- | ------------------------------------- |
| `background`           | `bg-background` / `var(--background)` |
| `foreground`           | `text-foreground`                     |
| `surface`              | `bg-surface`                          |
| `primary`              | `bg-primary`, `text-primary`          |
| `primary-foreground`   | `text-primary-foreground`             |
| `secondary`            | `bg-secondary`                        |
| `secondary-foreground` | `text-secondary-foreground`           |
| `muted-foreground`     | `text-muted-foreground`               |
| `border`               | `border-border`                       |
| `radius/lg` → 8        | `rounded-lg`                          |
| `radius/2xl` → 16      | `rounded-2xl`                         |
| `radius/3xl` → 24      | `rounded-3xl`                         |

No token transformation pipeline (no Style Dictionary, no Tokens Studio export). When adding tokens, update **both** `globals.css` `:root` and `@theme inline`, then sync Figma variables via `use_figma`.

### Typography

Fonts loaded in `src/app/layout.tsx`:

```tsx
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

| Role                 | Tailwind                               | Notes                         |
| -------------------- | -------------------------------------- | ----------------------------- |
| Body                 | `font-sans` (default)                  | Geist Sans                    |
| Mono (session codes) | `font-mono`                            | Geist Mono, `tracking-widest` |
| Page title           | `text-2xl font-bold tracking-tight`    | e.g. lobby h1                 |
| Section title        | `text-base font-semibold`              | BentoTile header              |
| Card title           | `text-lg font-semibold tracking-tight` | CardTitle                     |
| Muted body           | `text-sm text-muted-foreground`        | descriptions                  |
| Badge / meta         | `text-xs`                              | status, role badges           |

Figma uses **Geist** family (Regular, Medium, Semi Bold, Bold).

### Spacing & layout tokens

No dedicated spacing variables — use Tailwind scale:

| Pattern                 | Classes                                      |
| ----------------------- | -------------------------------------------- |
| Page horizontal padding | `px-4 sm:px-6`                               |
| Page max width          | `max-w-7xl` (app) or `max-w-6xl` (landing)   |
| Section vertical rhythm | `py-6`, `py-20 md:py-28` (hero)              |
| Card padding            | `p-5` (Card), `px-5 py-4` (BentoTile header) |
| Grid gap                | `gap-4` (bento), `gap-5` (feature grids)     |
| Nav height              | `h-14` (SessionNav)                          |

---

## 2. Component Library

### Architecture

- **Primitives** — `src/components/ui/` (shadcn-inspired, hand-rolled; no `components.json`).
- **Feature components** — grouped by domain under `src/components/`:
  - `landing/` — marketing page sections
  - `auth/` — login, register, forgot, reset
  - `lobby/` — waiting room
  - `session/` — in-game shell, map, nav, HUD
  - `roles/` — role-specific dashboards and panels
  - `host/` — host projector controls
  - `learning/` — tutorial, guidance, pedagogy widgets
  - `observatory/` — price/value charts
  - `home/`, `profile/` — account flows
- **Shared** — `brand.tsx`, `app-header.tsx`, `providers.tsx`

### UI primitives (`src/components/ui/`)

| Component   | Path             | Notes                                                                                                   |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `Button`    | `button.tsx`     | CVA variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`; sizes `sm`, `md`, `lg`, `icon` |
| `Card`      | `card.tsx`       | `rounded-2xl border border-border bg-surface shadow-sm`                                                 |
| `BentoTile` | `bento-tile.tsx` | Section container with header + body; accepts `colSpan` for grid                                        |
| `Input`     | `input.tsx`      | `h-11 rounded-lg`                                                                                       |
| `Label`     | `label.tsx`      | Form labels                                                                                             |
| `Field`     | `field.tsx`      | Label + children + error (`text-danger`)                                                                |
| `Stepper`   | `stepper.tsx`    | +/- numeric control with Lucide icons                                                                   |

### Component patterns

**CVA + `cn` utility** — standard for variants:

```tsx
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// cn = twMerge(clsx(...))  →  src/lib/utils.ts
```

**Link styled as button** — use `buttonVariants` on `<Link>`:

```tsx
<Link href={ctaHref} className={cn(buttonVariants({ size: "lg" }))}>
  {ctaLabel}
</Link>
```

**Bento grid layout** (lobby example from `lobby-view.tsx`):

```tsx
<div className="grid grid-cols-12 gap-4 lg:items-start">
  <BentoTile colSpan="col-span-12 lg:col-span-3" … />
  <BentoTile colSpan="col-span-12 lg:col-span-6 lg:col-start-4" … />
  <BentoTile colSpan="col-span-12 lg:col-span-3 lg:col-start-10" … />
</div>
```

### Documentation / Storybook

None. Component contracts are inferred from TypeScript props and Figma frame names. No `.figma.ts` Code Connect files exist yet — create them per `/figma-code-connect` skill when mapping stabilizes.

---

## 3. Frameworks & Libraries

| Layer           | Choice                                            |
| --------------- | ------------------------------------------------- |
| Framework       | **Next.js 16** App Router (`src/app/`)            |
| UI              | **React 19** (React Compiler enabled)             |
| Language        | **TypeScript** strict                             |
| Styling         | **Tailwind CSS v4** via `@tailwindcss/postcss`    |
| Variants        | `class-variance-authority`                        |
| Class merging   | `clsx` + `tailwind-merge`                         |
| Data fetching   | `@tanstack/react-query`                           |
| Forms           | `react-hook-form` + `@hookform/resolvers` + `zod` |
| Auth            | `next-auth` v5 beta                               |
| ORM             | Prisma 7 + PostgreSQL                             |
| Package manager | **Bun** (`bun dev`, `bun run build`)              |
| Bundler         | Next.js (Turbopack in dev)                        |

### Path aliases

```json
"@/*": ["./src/*"]
```

Import example: `import { Button } from "@/components/ui/button"`.

### Next.js specifics

- This is **not** stock Next.js — read `node_modules/next/dist/docs/` for v16 APIs.
- `output: "standalone"` in `next.config.ts`.
- `optimizePackageImports` for `lucide-react`, `react-icons`, `@tanstack/react-query`.

---

## 4. Asset Management

### Storage

Static assets: `app/public/` (served at `/`).

Currently only `public/dragonfruit.svg` — brand mark and hero image.

### Referencing assets

```tsx
// SVG/brand — next/image
<Image src="/dragonfruit.svg" alt="Thanh Long Market" width={28} height={28} priority />;

// Metadata icons — src/app/layout.tsx
icons: {
  icon: [{ url: "/dragonfruit.svg", type: "image/svg+xml" }];
}
```

QR codes are generated at runtime (`qrcode` package), not stored as static files.

### Optimization

- `next/image` for raster/SVG with explicit `width`/`height`.
- No CDN configuration; assets ship with the Next.js standalone build.
- Figma exports: use MCP `download_assets` → place in `public/` if needed.

---

## 5. Icon System

### Libraries

| Library            | Usage                                     |
| ------------------ | ----------------------------------------- |
| **lucide-react**   | Default for all UI icons (~30 components) |
| **react-icons/fc** | `FcGoogle` only (`google-button.tsx`)     |

### Import pattern

```tsx
import { Bot, Users, Sparkles } from "lucide-react";

<Bot className="size-3.5 shrink-0 text-muted-foreground" aria-label="Bot" />;
```

### Sizing convention

| Context         | Class                                                           |
| --------------- | --------------------------------------------------------------- |
| Inline / nav    | `size-4` (16px)                                                 |
| Small badge     | `size-3.5`                                                      |
| HUD / prominent | `size-4 sm:size-[1.125rem]`                                     |
| Feature card    | `size-7` (28px) in colored `rounded-lg bg-primary/10` container |

### Naming

Use Lucide's PascalCase export names. Role icons are centralized in `src/lib/game-zones.ts` (`ROLE_ICONS` map). Do not add new icon packs without updating `optimizePackageImports`.

---

## 6. Styling Approach

### Methodology

**Utility-first Tailwind** — no CSS Modules, no styled-components. Global tokens in `globals.css`; all component styling via `className`.

### Global styles

Only `globals.css` is imported (in `layout.tsx`). Sets `body { background, color }` from CSS variables.

### Semantic color usage

```tsx
// Surfaces
className = "bg-background"; // page
className = "bg-surface"; // cards, inputs
className = "bg-muted/10"; // subtle row backgrounds

// Text hierarchy
className = "text-foreground";
className = "text-muted-foreground";
className = "text-primary"; // emphasis words, badges

// Borders & focus
className = "border border-border";
className = "focus-visible:ring-2 focus-visible:ring-ring";

// State colors
className = "bg-success"; // online dot
className = "text-danger"; // form errors
className = "bg-accent/15"; // role badge fill
```

### Responsive design

Mobile-first Tailwind breakpoints:

| Breakpoint    | Typical use                                                    |
| ------------- | -------------------------------------------------------------- |
| default       | single column, stacked nav                                     |
| `sm:` (640px) | horizontal nav labels, `px-6`                                  |
| `md:`         | 2-col grids, inline auth links                                 |
| `lg:`         | 3-column bento lobby, 4-col feature grids, sticky side columns |

Common patterns:

```tsx
className = "hidden sm:block"; // show divider on sm+
className = "grid gap-5 md:grid-cols-4"; // features
className = "col-span-12 lg:col-span-6"; // bento spans
className = "lg:sticky lg:top-20 lg:self-start"; // sticky sidebar tiles
```

Sticky headers: `sticky top-0 z-10 border-b bg-surface/95 backdrop-blur`.

### Decorative effects

Soft blobs: `bg-primary/10 blur-3xl rounded-full` (hero).
Shadows: `shadow-sm` on cards, `shadow-lg` on floating HUD.
Opacity overlays: `bg-surface/95`, `supports-[backdrop-filter]:bg-surface/80`.

---

## 7. Project Structure

```
app/
├── public/                  # static assets
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   │   ├── layout.tsx       # root layout, fonts, providers
│   │   ├── globals.css      # design tokens
│   │   ├── page.tsx         # landing /
│   │   ├── auth/            # auth pages
│   │   ├── home/            # logged-in lobby list
│   │   ├── session/[id]/    # game session routes (lobby, map, task, …)
│   │   └── api/             # REST handlers
│   ├── components/
│   │   ├── ui/              # primitives
│   │   └── <feature>/       # domain components
│   ├── hooks/               # React Query + session hooks
│   ├── lib/                 # services, utils, game logic
│   └── generated/prisma/    # Prisma client (do not edit)
├── package.json
└── postcss.config.mjs
```

### Feature organization rules

1. **Page = thin wrapper** — `src/app/**/page.tsx` fetches params, renders one view component.
2. **View components** — `*-view.tsx` compose sections (`LobbyView`, `HomeView`, `ObservatoryView`).
3. **Domain logic stays in `lib/`** — components call hooks that wrap API routes.
4. **Vietnamese copy** — UI strings are inline in components; `src/lib/labels.ts` for shared enums.
5. **Game-specific tokens** — role labels in `role-badge.tsx` (`ROLE_LABELS`), zone config in `game-zones.ts`.

### Key screen → file map

| Screen | Mobile (`64:2620`) | Desktop (`68:117` or top row) | Code entry |
| ------ | ------------------ | ----------------------------- | ---------- |
| Landing | `64:2621` (1440) | — (reference) | `src/app/page.tsx` → `landing/*` |
| Auth / Login | `64:3072` | `78:117` | `src/app/auth/page.tsx` → `auth/*` |
| Auth / Forgot | `64:2754` | `78:2036` (top row) | `src/app/auth/forgot/page.tsx` |
| Auth / Reset | `64:3421` | `78:268` | `src/app/auth/reset/page.tsx` |
| Profile | `64:3425` | `78:280` | `src/app/profile/page.tsx` |
| Home / Hub | `100:97` | `98:97` | `src/app/home/page.tsx` → `home/home-view.tsx` |
| Create Room / Step 1 | — | `109:22` | `src/app/home/create/page.tsx` → `create-room/create-room-config-view.tsx` |
| Create Room / Step 2 | — | `110:22` | `src/app/home/create/[sessionId]/page.tsx` → `create-room/create-room-preview-view.tsx` |
| Host / Lobby Dashboard | — | `111:22` | `src/app/host/session/[id]/page.tsx` → `host/host-lobby-view.tsx` (LOBBY) |
| Session / Lobby | `64:3108` | `78:153` | `src/app/session/[id]/lobby/page.tsx` → `lobby/lobby-view.tsx` |
| Host / Control Panel | `64:2770` | `86:421` (top row) | `src/app/host/session/[id]/page.tsx` → `host/host-control.tsx` |
| Session / Map | `64:3454` | `82:1309` | `src/app/session/[id]/map/page.tsx` → `session/map-shell.tsx` |
| Session / Market | `64:3825` | `82:97` | `src/app/session/[id]/market/page.tsx` → `session/role-task.tsx` |
| Session / Task | `64:4166` | `82:470` | `src/app/session/[id]/task/page.tsx` → `session/role-task.tsx` |
| Session / Observatory | `64:4537` | `82:891` | `src/app/session/[id]/observatory/page.tsx` → `observatory/*` |
| Session / Debrief | `64:4913` | `86:97` | `src/app/session/[id]/debrief/page.tsx` → `session/debrief-view.tsx` |

---

## Implementation Checklist (design → code)

When implementing from Figma:

1. **Do not** paste raw `get_design_context` Tailwind output — map to existing components.
2. **Reuse** `Button`, `Card`, `BentoTile`, `Field`, `Input`, `Brand` before creating new primitives.
3. **Colors** — use semantic Tailwind tokens (`bg-primary`), not hex literals.
4. **Radii** — `rounded-lg` (buttons/inputs), `rounded-2xl` (cards/tiles), `rounded-full` (badges/pills).
5. **Copy** — preserve Vietnamese strings exactly as in Figma.
6. **Layout** — match Figma desktop width with `max-w-7xl mx-auto`; add responsive breakpoints per §6.
7. **Icons** — find Lucide equivalent; use `size-*` not fixed pixel font sizes.
8. **Images** — export via `download_assets`, add to `public/`, reference with `next/image`.
9. **Accessibility** — `aria-label` on icon-only buttons; `aria-hidden` on decorative elements.
10. **No new dependencies** for styling unless explicitly requested.

When pushing code → Figma, mirror component names and variable bindings so `search_design_system` finds them on the next pass.
