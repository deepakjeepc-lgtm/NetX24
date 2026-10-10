# Mobile Navigation & Sticky Header Redesign Plan

Redesign the mobile view (< md breakpoint) top header and bottom floating navigation bar according to the new visual and interaction specifications.

## 1. Mobile Top Header Redesign (Sticky Auto-Hide Strip)
- **Sticky Status Bar Placement**: Position the top mobile bar as a sticky header (`sticky top-0 left-0 right-0 z-[100]`) with background color matching the mobile status bar theme (`bg-[#121316]` dark / `bg-white` light with subtle bottom border).
- **Auto-Hide on Scroll Logic**:
  - Track scroll direction (`scrollY` delta).
  - Hide header (`-translate-y-full transition-transform duration-300`) when scrolling down.
  - Reappear (`translate-y-0`) immediately when scrolling up or at the top of the page.
- **Top Header Content**:
  - **Left**: ThemeToggle button (Dark/Light mode switch).
  - **Center**: NetX24 brand title.
  - **Right**: GlobalSearch SVG icon & Quick Downloads SVG icon button.

## 2. Mobile Bottom Floating Bar Redesign (Icon-Only & Enhanced Size)
- **Taller Roomier Capsule**: Increase capsule container height and depth (`h-16 px-5 max-w-[260px] mx-auto rounded-full bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl`).
- **Remove Gradient Circle**: Remove the active selection background gradient circle completely.
- **Remove Text Labels**: Omit text labels (`Home`, `IGNOU`, `Tools`, `My Cart`) completely to focus on clean minimalist icon navigation.
- **Enlarged 26px SVG Icons**:
  - Render clean enlarged icons (`w-[26px] h-[26px] stroke-[2]`).
  - **Active State**: Bright active color highlight (`text-indigo-400 dark:text-indigo-400 opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]`).
  - **Inactive State**: Soft faded opacity (`text-slate-500 opacity-45 hover:opacity-80`).
- **Compact Floating Panel Width**: Reduce gap spacing between icons to keep the floating pill bar compact left-to-right (`max-w-[260px] justify-between`).

## 3. Cart Counter & Empty Cart Handling
- **Dynamic Cart Badge**: Display cart item badge on Shopping Cart SVG only if `cartCount > 0`.
- **Empty Cart View**: Tapping Cart icon opens Cart drawer; if `cartCount === 0`, presents a clean "Your cart is empty" label state with a "Browse IGNOU Notes" button.

## 4. Verification
- Validate app build with `lint_applet` and `compile_applet`.
- Verify scroll behavior, dark/light theme matching, and icon active highlights.
