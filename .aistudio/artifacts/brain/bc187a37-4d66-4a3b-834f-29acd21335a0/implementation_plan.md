# LEKHIX — Mobile PWA Polish, Status Bar Theme Sync, Cart Fix & Per-Book Format Control

Resolve all mobile/PWA experience issues shown in your screenshots and configure flexible per-book edition formats (`eBook Only` by default, `Physical Only`, or `Both`).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions incorporate your screenshots and confirmed preferences:

- **Confirmed Decision 1 — Compact Side-by-Side Mobile Hero (Products Above the Fold)**: On mobile screens, the Hero section will arrange the `6×9` shadowed book cover and the title/synopsis/Buy CTA **side-by-side** in a compact editorial layout so the category filter bar (`All Products · Books · Stationery`) and the **2-column product grid** appear immediately above the fold on the home screen.
- **Confirmed Decision 2 — Per-Book Edition Type with `eBook (PDF)` as Default**: When adding a book in the Admin Console, **`eBook Only (PDF)`** is selected by default. The admin can set any individual book to **`eBook Only (PDF)`**, **`Physical Only (6×9 Hardcover)`**, or **`Both (Physical + eBook PDF)`**—and the storefront will strictly show only the format(s) enabled for that specific book.
- **Confirmed Decision 3 — Native Dark/Light Status Bar, Zero Left-Right Scroll & Cart Fix**:
  - **Status Bar**: Configure iOS/Android PWA status bar and safe-area top inset (`viewport-fit=cover` + `black-translucent` + synced `<meta name="theme-color">` and root/header background `#FAFAFA` in Light Mode, `#0A0A0C` in Dark Mode) so the top status bar is dark in Dark Mode and light in Light Mode.
  - **Zero Horizontal Scroll**: Fix the header button overflow (`CART (0)` clipping on 375px–390px screens) and enforce strict `overflow-x: hidden` and `max-w-[100vw]` across `html`, `body`, and `#root`.
  - **Mobile Cart Drawer Fix**: Prevent any crash from malformed `localStorage` cart entries and redesign the mobile Cart view with a clear header, structured item cards (or a framed empty-bag card with a **"Continue Browsing Collection"** CTA), and pinned bottom checkout actions so clicking `CART` never shows a blank white screen.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the mobile and installed Home Screen (PWA) experience of **LEKHIX** into a native-feeling luxury book & eBook app while giving the Admin full per-book control over whether a title is an **eBook (PDF)**, a **Physical 6×9 Book**, or **Both**.
- **Key Fixes Delivered**:
  1. **Dynamic Light / Dark Status Bar Background**: Eliminates the white strip behind the clock/5G icons in Dark Mode.
  2. **Zero Horizontal Scroll in Mobile / PWA**: Fits the entire top navigation bar comfortably inside mobile screens (`320px–430px`) and locks horizontal panning.
  3. **Polished App-Like Mobile Home Screen**: Replaces the oversized stacked mobile hero with a balanced side-by-side 6×9 showcase so customers immediately see the catalog grid upon opening the app.
  4. **Resilient Mobile Cart Drawer**: Fixes the blank white screen when tapping `CART (0)` on mobile.
  5. **Per-Book Format Architecture (`eBook` Default)**: Defaults new books to `eBook (PDF)` while supporting `Physical Only` and `Both` per book across the catalog.

---

## 2. User Experience & Visual Design

### 1. Status Bar & Safe-Area Theme Synchronization
- In `index.html` and `ThemeContext.tsx`:
  - Add `viewport-fit=cover` to the viewport meta tag and set `apple-mobile-web-app-status-bar-style` to `black-translucent`.
  - Add safe-area top padding (`pt-[env(safe-area-inset-top)]`) to the sticky `<header>` and dynamically sync `document.documentElement.style.backgroundColor`, `document.body.style.backgroundColor`, and `<meta name="theme-color">` between `#FAFAFA` (Light Mode) and `#0A0A0C` (Dark Mode).

### 2. Mobile Top Header & Horizontal Overflow Lock
- Reduce mobile header horizontal padding (`px-3.5 sm:px-6 md:px-12`) and utility icon spacing (`gap-1.5 sm:gap-4`) so `LEKHIX`, Search, Theme Toggle, `ADMIN`, and `CART (0)` fit cleanly inside a single 375px row without clipping the right border of `CART (0)`.
- Apply `overflow-x-hidden w-full max-w-[100vw] overscroll-x-none` on `html`, `body`, and `#root`.

### 3. Mobile Home Screen — Side-by-Side Hero & Above-the-Fold Grid
- **Mobile Hero (`< lg`)**:
  - Uses a 12-column horizontal split right on mobile:
    - **Left (5 cols)**: Shadowed `6×9` book cover inside a subtle pedestal frame.
    - **Right (7 cols)**: Format label (`EBOOK PDF` / `6×9 HARDCOVER`), serif title, concise 2-line description, `BUY ₹...` button, and slide counter (`01 — 04 →`).
  - **Desktop Hero (`lg:`)**: Preserves the existing spacious 12-column Alpine layout.
- Immediately below the compact mobile Hero, the sticky-feeling category filter pills (`All Products · Books · Stationery`) and the **2-column 6×9 product grid** are visible without scrolling.

### 4. Mobile Cart Drawer (`CheckoutModal`) Fix
- Sanitize persisted `localStorage` cart data on load so any legacy item missing `product` or `product.specs` is safely discarded instead of crashing React.
- On mobile, style the Cart drawer with a clear top bar, high-contrast item list, and—when `cartCount === 0`—a structured bordered card displaying the LEKHIX mark, *"Your shopping bag is currently empty"*, and a solid **"EXPLORE BOOKS & EBOOKS"** button that returns to the catalog.

### 5. Per-Book Edition Control (`eBook` Default, `Physical Only`, `Both`)
- **Admin Console (`CatalogManager`)**:
  - Clicking **`+ Add Book / Stationery`** defaults `bookFormat` to `'ebook'` (`eBook Only — PDF Download`).
  - The 3-option selector (`eBook Only (PDF)`, `Physical Only (6×9)`, `Both (Physical + eBook)`) lets the admin configure each book independently.
- **Catalog Variety & Storefront Behavior**:
  - Seeded catalog books include distinct examples of **`eBook Only (PDF)`**, **`Physical Only (6×9 Hardcover)`**, and **`Both (Physical + eBook PDF)`**.
  - On the **Product Grid**, each book card subtly indicates its edition availability (`EBOOK PDF`, `6×9 HARDCOVER`, or `HARDCOVER + PDF`) without adding pill clutter.
  - On the **Book Detail View**:
    - If a book is **`eBook Only`**, only the eBook PDF purchase option (`BUY EBOOK (PDF) ₹...`) is shown.
    - If a book is **`Physical Only`**, only the Physical 6×9 purchase option (`BUY ₹...`) is shown.
    - If a book is **`Both`**, the customer can toggle between `PHYSICAL (6×9 IN)` and `EBOOK (PDF)`.

---

## 3. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│                  Viewport & Theme Shell (index.html / CSS)                 │
│  • viewport-fit=cover + black-translucent iOS PWA status bar               │
│  • ThemeContext syncs html/body background & meta[name="theme-color"]      │
│    (#FAFAFA in Light Mode / #0A0A0C in Dark Mode)                          │
│  • html, body, #root: overflow-x: hidden; max-width: 100vw                 │
└───────────────┬─────────────────────────────┬──────────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────────┐
│      Mobile & Desktop Header      │ │     Compact Mobile Hero + 2x Grid    │
│ • Safe-area top inset padding     │ │ • Mobile: 5-col 6×9 cover + 7-col    │
│ • Compact spacing so CART (0)     │ │   title/CTA side-by-side             │
│   never clips on 375px screens    │ │ • 2-col product grid visible         │
└───────────────┬───────────────────┘ │   immediately above the fold         │
                │                     └──────────────────┬───────────────────┘
                ▼                                        ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────────┐
│   Resilient Cart & CheckoutModal  │ │  Per-Book Format (Admin & PDP)       │
│ • Guards product?.specs?.author   │ │ • Default new book: 'ebook' (PDF)    │
│ • Structured Empty Bag card with  │ │ • Supports 'ebook' | 'physical' |    │
│   [ EXPLORE COLLECTION ] button   │ │   'both' per individual book         │
└───────────────────────────────────┘ └──────────────────────────────────────┘
```
