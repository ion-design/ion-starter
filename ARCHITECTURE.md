# ion-starter Architecture

Next.js 16 (App Router) + React 19 + Tailwind CSS starter project used as the base for an AI design agent. The key piece is the `.ion` compiler pipeline that decorates every React element with source location metadata, enabling an external tool to click on any rendered element and map it back to the exact file and line in source code.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (html/body, loads ion injection script)
│   │   ├── page.tsx            # Home page (placeholder, gets replaced by AI)
│   │   └── globals.css         # Tailwind directives
│   └── lib/
│       └── utils.ts            # cn() utility (clsx + tailwind-merge)
├── .ion/
│   ├── babel/
│   │   ├── babel-processor.js  # Clones project to .ion-target/, transforms JSX/TSX
│   │   └── ion-babel-plugin.js # Babel plugin that adds data-ion-id attributes
│   └── scripts/
│       ├── watch.js            # Chokidar watcher, syncs changes to .ion-target/
│       └── injection-script.js # Browser script for element selection UI
├── .ion-target/                # Generated clone (gitignored, this is what gets served)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── package.json
```

## How the Ion Pipeline Works

The app is never served directly. Instead:

1. **Clone & Transform** (`babel-processor.js`): The entire project is recursively copied into `.ion-target/`. During this copy, every `.jsx`/`.tsx` file is run through Babel with the `ion-babel-plugin`, which adds two attributes to every JSX element:
   - `data-ion-id` — base64 JSON containing `{ path, startTag: { start: {line, column}, end: {line, column} }, component }` pointing to the **original source file**
   - `data-ion-caller-id` — base64 JSON tracking the component hierarchy (`{ caller, depth }`)
   - All other files (config, css, assets) are copied unchanged
   - Ignored directories: `node_modules`, `.git`, `.ion`, `.ion-target`, `.next`, `dist`, `build`, `.cache`

2. **Dev Server** runs from inside `.ion-target/` — it's a complete self-contained Next.js project. Turbopack handles HMR from there.

3. **File Watcher** (`watch.js`): Chokidar monitors the original source. On any file change, it re-transforms (JSX/TSX) or re-copies (everything else) just that file into `.ion-target/`, with 100ms debouncing. Turbopack picks up the change automatically.

4. **Injection Script** (`injection-script.js`): Copied to `.ion-target/public/ion-injection.js` and loaded via `next/script` in `layout.tsx`. This ~660-line IIFE runs in the browser and provides:
   - Element selection with hover (green) and click (blue) overlays
   - State machine: `DEFAULT` → `SELECT` → `SELECTED`
   - Decodes `data-ion-id` on click to get source file + line range
   - Extracts computed CSS styles (40+ properties) for the selected element
   - Double-click to edit text content inline
   - `postMessage` communication with parent window (the design agent UI runs the app in an iframe)
   - Events sent: `select-node`, `current-node-styles`, `text-content-updated`, `ion-injection-ready`, `did-navigate-in-page`, `key-pressed`
   - Events received: `enter-select-mode`, `reset-state`, `highlight-node`, `update-node-style`, `update-node-text`

## Dev Command Flow

```
bun run dev
  → babel-processor.js           # Full clone + transform to .ion-target/
  → cp injection-script.js → .ion-target/public/
  → concurrently:
      watch.js                    # Incremental sync on file changes
      cd .ion-target && bun install && bun next dev -p 3000
```

## Key Design Decisions

- **Shadow copy architecture**: Original source is never mutated. All transformation happens in the clone. This makes the pipeline framework-agnostic — the same babel-processor works regardless of project structure.
- **Babel runs before the framework**: The ion-babel-plugin strips TypeScript (via `@babel/preset-typescript`) and injects `data-ion-id` attributes. The output is valid JSX that Next.js/Turbopack compiles normally. `retainLines: true` keeps line numbers stable.
- **Source paths in attributes point to original files** (not `.ion-target/`), so the design agent can map selections back to editable source code.
- **The injection script is framework-agnostic**: It only cares about `data-ion-id` attributes in the DOM. Works with any framework that renders to HTML.

## Adding Pages / Components

This is a standard Next.js 16 App Router project. Add pages in `src/app/`, components anywhere in `src/`. The `@/` path alias maps to `./src/`. All JSX/TSX files automatically get ion instrumentation when served through the dev pipeline.
