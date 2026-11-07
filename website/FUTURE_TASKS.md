# Future Tasks

## Upgrade the frontend toolchain to current major versions

**Status:** Planned — not started  
**Priority:** Maintenance  
**Recorded:** 2026-10-25

The project is intentionally pinned to the versions that were tested for the current design and behavior. Do **not** solve this by only changing version numbers in `package.json`; several of these upgrades require code and configuration migrations.

### Current pinned baseline

| Package | Current version |
| --- | --- |
| Vite | 5.4.21 |
| Tailwind CSS | 3.4.17 |
| React Router DOM | 6.30.2 |
| React / React DOM | 18.3.1 |
| TypeScript | 5.x |
| PostCSS | 8.5.31 |
| Autoprefixer | 10.6.1 |

Newer major versions observed on 2026-10-25 were Vite 8.3.5, Tailwind CSS 4.3.3, and React Router DOM 7.18.4.

### Why this is a separate task

A previous attempt to run with the newer versions failed at build time:

```text
"./base" is not exported under the conditions [...] from package tailwindcss
```

The current `src/index.css` uses Tailwind 3 imports:

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
```

Tailwind 4 no longer supports that setup. Vite 8 and React Router 7 also introduce config and API changes. The versions were restored to keep the prototype stable.

### Migration checklist

1. Create a branch or backup before changing dependencies.
2. Read the official upgrade guides for every major version being adopted.
3. Upgrade Tailwind CSS 3 → 4:
   - Switch to the current Tailwind Vite plugin or `@tailwindcss/postcss`.
   - Replace the three Tailwind 3 imports with the Tailwind 4 import.
   - Migrate `tailwind.config.js` to CSS-first configuration or use `@config`.
   - Verify custom color tokens, alpha values, `darkMode: 'class'`, fonts, radii, shadows, and animations.
   - Check Tailwind 4 default changes such as border colors, ring widths, spacing, and container behavior.
4. Upgrade Vite 5 → current:
   - Update `@vitejs/plugin-react` to its compatible version.
   - Review `vite.config.ts`, especially `server.watch.ignored`.
   - Confirm the `public/` assets and `public/_redirects` are still copied.
   - Consider replacing the `npx` prefixes in npm scripts with direct local binaries.
5. Upgrade React Router 6 → 7:
   - Confirm `BrowserRouter`, `Routes`, `Route`, `Link`, `useLocation`, and `ScrollManager` behavior.
   - Remove obsolete v6 future-flag warnings.
   - Re-test direct loading of `/privacy` and `/terms` with the SPA fallback.
6. If upgrading React 18 → 19, verify compatibility with `framer-motion`, `recharts`, `lucide-react`, and `@emotion/react`, including TypeScript types.
7. Upgrade TypeScript, ESLint, and related plugins together. ESLint 9 requires the flat-config migration.
8. Delete `node_modules`, run a clean `npm install`, and regenerate `package-lock.json` from the updated `package.json`.
9. Run:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
   - `npm run preview`
10. Re-run visual and interaction QA at desktop and mobile widths:
    - Light and dark themes
    - Keyboard navigation and mobile menu Escape/focus return
    - Demo lead-form validation and reset behavior
    - Pricing plan selection
    - `/privacy` and `/terms`
    - SEO metadata, favicon, and sample dashboard figures
11. Update `README.md` and this task list with the new tested baseline.

### Acceptance criteria

- The production build succeeds from a clean install without dependency hacks.
- No Tailwind styling or theme regressions.
- All routes work on a static host via `public/_redirects`.
- The form remains validation-only and clearly labelled as an academic demo.
- All sample dashboard calculations remain unchanged.
- `tsc`, lint, build, and preview checks pass.
- The lockfile is committed and the tested versions are documented.

### Likely files affected

- `package.json`
- `package-lock.json`
- `src/index.css`
- `tailwind.config.js`
- `postcss.config.js`
- `vite.config.ts`
- `src/` components if React or React Router APIs change
- `README.md`

## Reduce the production bundle and split large chunks

**Status:** Planned — not started  
**Priority:** Performance  
**Recorded:** 2026-10-25

The production build currently emits this non-blocking warning:

```text
(!) Some chunks are larger than 500 kB after minification.
dist/assets/index-*.js  ~727.80 kB  | gzip: ~215.86 kB
```

This warning must not be hidden only by raising `build.chunkSizeWarningLimit`. The goal is to reduce the initial JavaScript payload and load heavy dashboard/chart code only when it is needed.

### Proposed approach

1. Record a baseline with `npm run build` and inspect the generated chunk sizes.
2. Lazy-load route-level pages with `React.lazy` and a suitable `Suspense` fallback, especially:
   - `src/pages/Home.tsx`
   - `src/pages/PrivacyPolicy.tsx`
   - `src/pages/TermsOfService.tsx`
3. Ensure the sample dashboard and its Recharts dependency are not part of the initial marketing-page bundle.
4. Consider `build.rollupOptions.output.manualChunks` for stable vendor groups such as React, React Router, Framer Motion, Recharts, and icons. Avoid creating too many tiny chunks.
5. Review imports for tree-shaking:
   - Import only the Lucide icons actually used.
   - Import only the required Recharts components.
   - Avoid barrel imports that pull in unused dashboard code.
6. Keep the static hero and primary content fast to render. Use a lightweight loading fallback that does not shift layout or break anchor scrolling.
7. Re-test direct loading of `/`, `/privacy`, and `/terms`, plus all dashboard interactions and chart rendering.
8. Confirm `public/_redirects` and SEO metadata still work after code splitting.

### Acceptance criteria

- No JavaScript chunk exceeds 500 kB, or any remaining exception is documented with a measured reason.
- The homepage does not download Recharts or dashboard-only code.
- Initial load is smaller than the current ~215.86 kB gzip JavaScript payload.
- The production build completes without the chunk-size warning.
- No visual, routing, accessibility, chart, or calculation regressions.

### Likely files affected

- `vite.config.ts`
- `src/App.tsx`
- `src/pages/Home.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/TermsOfService.tsx`
- `src/components/dashboard/DashboardPreview.tsx`
- `src/components/dashboard/ExpenseChart.tsx`
- `src/components/dashboard/` components that import charting code
- `package.json` if dependency optimization is required
