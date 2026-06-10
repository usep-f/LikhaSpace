"For React/Next.js frontend tasks, strictly adhere to the following architectural, formatting, and security rules:

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

"Read CLAUDE.md and web/AGENTS.md for coding guidelines before starting."

"For any frontend, UI/UX, or styling tasks, you must run the `ui-ux-pro-max` skill. Start by generating a design system:
python .agent/skills/ui-ux-pro-max/scripts/search.py \"<product_type> <industry> <keywords>\" --design-system --persist -p \"<Project Name>\"
Adhere to the generated MASTER.md rules, color palettes, spacing guidelines, typography, and interactive hover states."

1. **Directory Structure (`web/src/`)**:
   - `/components` for reusable UI components.
   - `/hooks` for custom React hooks.
   - `/lib` for utility functions and clients (e.g. Horizon/RPC client instances).
   - `/context` for React context providers.
   - `/app` for App Router routes & pages.
2. **Component Organization & Reusability**:
   - Put UI primitives (buttons, inputs, status badges) in `/components/ui`.
   - Put structure layouts or section blocks in `/components/layout`.
   - Put shared compound/complex components directly in `/components`.
   - Always declare explicit TypeScript interfaces for component props using the naming pattern `{ComponentName}Props`.
3. **Safety & Security**:
   - Prohibit committing secret keys or adding sensitive credentials to variables prefixed with `NEXT_PUBLIC_`. Keep secret keys in `.env` only (never expose client-side).
   - Keep interactive wallet actions and SDK operations within Client Components (`'use client'`).
   - Wrap all async SDK calls in robust try-catch blocks with helpful user-facing error state/notification feedback.
   - Use React Server Components (RSC) for page skeletons, static wrapper content, and layout frames.
   - Enforce comprehensive input sanitation and validation. Use Zod schemas for validation, parsing, and type-safety of all form submissions, URL parameters, and API inputs.
4. **File Naming & Exports**:
   - Use PascalCase for component files (e.g., `SendPayment.tsx`).
   - Use camelCase for hooks and utility files (e.g., `useWallet.ts`).
   - Use named exports for all reusable components, hooks, and utilities (to prevent import name collisions and support IDE auto-imports).
   - Reserve default exports exclusively for Next.js routing files (`page.tsx`, `layout.tsx`, `route.ts`).
5. **Code Splitting & Size Limits**:
   - Avoid monolithic files. Always split code into small, reusable functions and modules to simplify code structures and facilitate testing/debugging.
   - **File limit**: No file may exceed 300 lines of code. If a component or helper file exceeds this, it must be broken down into sub-components or separate utility modules.
   - **Function limit**: No individual function may exceed 30 lines (excluding inline comments and TypeScript definitions). Any function that reaches this limit must be refactored and split into smaller helper functions.
6. **Code Verification & Linting**:
   - **Mandatory Linting Check**: You must run ESLint (e.g. `npm run lint` inside `web/` directory) and verify there are no compilation or syntax errors before presenting code to the user or declaring a task complete."
     "For all development tasks, strictly adhere to international security and structural quality standards (OWASP Top 10 & ISO/IEC 25010/5055):
7. **OWASP Web Security Standards**:
   - **XSS Prevention**: Prohibit the use of React's `dangerouslySetInnerHTML` unless the target data is explicitly sanitized using a robust sanitization library (e.g. `DOMPurify`).
   - **Injection Prevention**: Never construct queries or external payload structures using raw string concatenation. Always use structured inputs, parameterized binding, or Zod validation schemas.
   - **Broken Access Control**: Enforce server-side authorization checks on all Next.js API Routes and server actions. Client-side state/visual hiding is purely for UX, never for security.
   - **Security Misconfiguration**: Enforce strict security headers (e.g., CSP, HSTS, X-Frame-Options) via application routing/configuration, and configure all cookies with `HttpOnly`, `Secure`, and `SameSite` flags.
   - **Software Integrity**: Restrict the installation of unpinned dependency versions. Run `npm audit` to address vulnerability issues prior to shipping.
8. **OWASP Smart Contract Security Standards**:
   - **Authorization Checks**: Every function that modifies user assets, balances, or state variables in Soroban contracts must explicitly invoke native authorization checks using `address.require_auth()`.
   - **Reentrancy & Math Safety**: Always verify that Cargo release builds have `overflow-checks = true` enabled in `Cargo.toml`.
   - **State Preservation**: Prevent state depletion attacks in Soroban by always implementing TTL extensions (`extend_ttl`) for contract instances and data storage items.
9. **ISO/IEC 25010 & 5055 Software Quality Standards**:
   - **Modularity & Single Responsibility**: Code must be separated by concerns. Avoid combining business logic, math calculations, and UI presentation states. Extract logic into independent unit-testable modules in `/lib` or `/hooks`.
   - **Fault Tolerance**: Implement React Error Boundaries at page or feature-block boundaries to isolate component failures.
   - **Error Handling Integrity**: Standardize all async exception handling. Suppress raw system exceptions or internal stack traces from being displayed to users; log them securely and display human-readable fallback interfaces."
     "For all UI, UX, styling, and design implementation tasks, strictly adhere to the following design system rules:
10. **Icons & Visual Consistency**:
    - **No Emoji Icons**: Prohibit the use of emojis (e.g. 🎨, 🚀, ⚙️) as UI icons. Always use SVG icons from a unified library (e.g., Lucide React or Heroicons).
    - **Icon Sizing**: Maintain consistent sizing bounds for all icons (e.g., standard `w-5 h-5` or `w-6 h-6`).
    - **Brand Representation**: Use verified SVG paths for brand logos (e.g., from Simple Icons or official resources) instead of placeholders or approximations.
11. **Interactivity & Hover States**:
    - **Pointer Cursor**: Explicitly apply `cursor-pointer` to all clickable or hoverable elements, cards, and buttons.
    - **Stable Transitions**: All hover states must provide clear visual feedback using smooth transitions (e.g., `transition-colors duration-200` or `transition-all duration-150`).
    - **No Layout Shifts**: Prohibit hover transform scales or borders that cause surrounding content blocks to shift or flicker.
12. **Contrast & Theme Rules (Light & Dark Mode)**:
    - **Contrast Standards**: Adhere to WCAG AA guidelines (4.5:1 minimum contrast for body text). Use dark text (e.g., slate-900 `#0F172A`) and secondary text (e.g., slate-600 `#475569`) on light backgrounds.
    - **Glassmorphism Opacity**: Use a minimum backdrop opacity of `bg-white/80` for light-mode glass cards to ensure readability (avoid low opacity elements like `bg-white/10` on light screens).
    - **Visible Borders**: Ensure borders and dividers are clearly visible in both light mode (e.g. `border-gray-200`) and dark mode (e.g. `border-zinc-800`).
13. **Keyboard Accessibility**:
    - **Focus Rings**: Ensure focus states are highly visible for keyboard navigation. Always apply focus styles such as `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none` on all inputs, buttons, and links.
14. **Layout & Responsiveness**:
    - **Outer Containment**: Enforce standard outer layout constraints (e.g., `max-w-lg` for card/form views, and `max-w-7xl` with `mx-auto` for complete page layouts) to maintain visual alignment.
    - **Viewport Testing**: Test layouts across standard viewport breakpoints (375px mobile, 768px tablet, 1024px desktop, 1440px widescreen).
    - **Mobile Responsiveness**: Enforce a strict "no horizontal scrolling" policy on mobile viewports."
