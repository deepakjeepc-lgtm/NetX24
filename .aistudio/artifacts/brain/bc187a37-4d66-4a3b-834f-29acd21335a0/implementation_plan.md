# LEKHIX — Luxury Books & Stationery Storefront Redesign

Transform **LEKHIX** into a minimalist, editorial luxury Books and Stationery e-commerce experience inspired by the provided **Alpine**, **Hikone**, and **Gestalten** reference designs—featuring the original framed **LEKHIX** logo, strict **6×9 inch (`2:3`)** vertical product previews, zero heavy animations, no extra subtitles or hardcoded external links, and full Light/Dark mode parity.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product decisions incorporate your confirmed answers and reference designs:

- **Confirmed Decision 1 — Storefront Scope**: Focus strictly on the **Books and Stationery** luxury store. All legacy cyber-cafe elements, IGNOU sections, heavy loading animations, and PDF/Image tools will be permanently removed.
- **Confirmed Decision 2 — Editorial Book Showcase (Gestalten Reference)**: Clicking any book or product opens a full editorial showcase featuring a **6×9 inch (`2:3`)** book cover preview with studio shadow, serif title, author credit, synopsis, a structured 6-field specification grid (`Publisher/Editor`, `Pages/Features`, `Release Date`, `Language`, `Format: 6 × 9 in`, `ISBN`), a rectangular `BUY` / `ADD TO CART` button, and a right-hand vertical **Bookshelf Sidebar** to browse other titles seamlessly.
- **Confirmed Decision 3 — Dedicated Admin Catalog Manager**: The Admin Console will feature a dedicated **Books & Stationery Manager** allowing you to add, edit, feature, or remove Books and Stationery items, upload or link **6×9 inch** cover artwork, and manage specifications and orders in real time.
- **Strict Restraint Rules**: Product grid cards will display only the clean **6×9 inch image preview**, **Title**, and **Price** (no extra subtitles, no badge spam, and zero hardcoded dummy links).

---

## 1. Overview & Core Concept

- **What It Does**: Provides a curated luxury storefront for **LEKHIX Books & Stationery**. Customers can explore a featured hero showcase, filter the catalog by category (`All Products`, `Books`, `Stationery`) and sort order, inspect any publication in an interactive Gestalten-style editorial reader/detail view with a 6×9 cover preview and right bookshelf strip, add items to their shopping bag, and complete checkout with downloadable PDF receipts.
- **Target Audience / Persona**: Discerning readers, students, collectors, and stationery enthusiasts seeking a distraction-free, gallery-grade browsing and purchasing experience.
- **Key Value**: Replaces cluttered utility cards and heavy animations with architectural whitespace, authentic 6×9 book proportions, instantaneous navigation, and a cohesive brand identity anchored by the framed **LEKHIX** logo.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Storefront Arrival & Featured Hero (Alpine Reference)**:
   - Visitors land on a clean, single-row top navigation bar displaying the framed **LEKHIX** logo on the left, minimal category navigation in the center (`All Products`, `Books`, `Stationery`), and functional actions on the right (`Search`, `Light/Dark Theme Toggle`, and `Cart (count)`).
   - Directly below sits the **Featured Editorial Hero**: a split showcase with the featured book/stationery title, concise editorial description, and a sharp rectangular bordered `BUY ₹...` button on the left, paired with a studio-lit **6×9 inch** cover showcase and `01 —— 04` slide switcher on the right.
2. **Minimalist Category Filter & 6×9 Product Grid (Alpine + Hikone References)**:
   - A clean filter bar lets users switch between `All Products`, `Books`, and `Stationery` on the left, with a clean sort selector (`Default sorting`, `Price: Low to High`, `Price: High to Low`) on the right.
   - Products are displayed in a balanced 3-column desktop grid (`gap-8`). Every card frame houses a **6×9 inch (`aspect-[2/3]`)** preview container on a soft studio pedestal surface, with only the **Product Title** and **Price** underneath—zero extra subtitles.
3. **Editorial Book Detail & Bookshelf View (Gestalten Reference)**:
   - Clicking any item opens the **Editorial Showcase**:
     - **Left Column**: Large **6×9 inch (`2:3`)** book cover floating with realistic studio shadow and an interactive `"CLICK FOR PREVIEW"` zoom/look-inside modal.
     - **Center Column**: High-contrast editorial title, `by [Author]`, curated two-paragraph synopsis, hairline divider, and a structured 2×3 metadata specification grid (`Publisher`, `Features`, `Release Date`, `Language`, `Format: 6 × 9 in`, `ISBN`), followed by `BUY NOW` and `ADD TO CART` buttons.
     - **Right Column (Bookshelf Sidebar)**: A vertical scrolling spine/cover strip (`BOOKSHELF`) displaying 6×9 thumbnails of other catalog titles so users can switch between books with one click.
4. **Cart Drawer & Instant Checkout**:
   - Clicking `Cart (count)` or `BUY` opens a clean slide-over bag or checkout flow supporting Razorpay/Order confirmation and instant PDF receipt generation.
5. **Minimalist Editorial Footer (Hikone Reference)**:
   - Clean, typographic footer with bold statement (`DON'T BE SHY, JUST SAY HI!`), store contact info, and direct inquiry trigger—with zero hardcoded dummy links or social placeholders.

### Visual Identity & Theme

- **Aesthetic Direction**: **Architectural Publishing & Luxury Boutique** (Gestalten × Alpine × Hikone).
- **Original Framed Logo**: Renders the exact uploaded **LEKHIX** logo—bold geometric typography with the signature custom `K` enclosed in a crisp rectangular border frame—automatically adapting between Light Mode and Dark Mode.
- **Color Palette & Dual Theme Posture (60-30-10 Discipline)**:
  - **Light Mode**:
    - `60% Canvas`: Pure Gallery Alabaster (`#FAFAFA`) and Crisp White (`#FFFFFF`).
    - `30% Structural Pedestals`: Warm Studio Stone (`#F2F2EE`) for product card frames and `#E5E5E0` hairline dividers.
    - `10% Ink & Accent`: Deep Carbon Ink (`#111111`) for primary typography, Muted Slate (`#71717A`) for specs, and sharp bordered monochrome/cobalt accents on primary action buttons.
  - **Dark Mode**:
    - `60% Canvas`: Deep Obsidian (`#0A0A0C`).
    - `30% Structural Pedestals`: Elevated Charcoal (`#141417`) for 6×9 card frames and `#242429` hairline borders.
    - `10% Ink & Accent`: Crisp Ivory (`#F5F5F7`) for headlines/titles, Muted Zinc (`#A1A1AA`) for specs, and crisp white bordered CTA frames.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - *Editorial Display & Book Titles*: `Cormorant Garamond` / `Playfair Display` (SemiBold 600) for book detail titles and editorial statements.
  - *UI, Navigation & Product Titles*: `Plus Jakarta Sans` (Medium 500 / Bold 700) for clean modernist navigation, product grid titles, and buttons.
  - *Prices, Specs & Indices*: Tabular numerals (`tabular-nums`) for prices (`₹`), slide counters (`01 — 04`), and ISBN codes.
- **Interactive Feedback & Motion**:
  - **Zero Heavy Loading Animations**: All entrance spinners, skeleton delays, and scroll-jacking wrappers are removed. Content renders immediately.
  - **Subtle Micro-Interactions**: Fast `150ms` opacity and subtle `2px` elevation shifts on card hover.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Strict 6×9 Inch (`2:3` Aspect Ratio) Geometry Across All Previews**
  - *Chosen Approach*: Enforce `aspect-[2/3]` containers with centered studio padding and soft drop shadows across the Hero showcase, 3-column Product Grid, Editorial Detail View, right-hand Bookshelf strip, and Admin image uploader preview.
  - *Why*: Matches standard 6×9 inch trade book dimensions requested by the user while giving stationery items a cohesive, gallery-curated vertical framing.
- **Decision 2: Subtitle-Free Product Cards & Zero Hardcoded External Links**
  - *Chosen Approach*: Strip all secondary subtitle fields, category badges, and dummy footer/header URLs from product cards and layout chrome.
  - *Why*: Directly fulfills the user's request for an uncluttered luxury presentation where only the product's visual form, title, and price speak for themselves.
- **Decision 3: Unified Firestore Catalog with Seeded Luxury Books & Stationery**
  - *Chosen Approach*: Store the catalog in Firestore (`/appData/catalog`) with real-time sync and bespoke high-resolution 6×9 studio product imagery generated for initial Books and Stationery items, editable anytime from the Admin Console.
  - *Why*: Ensures the storefront looks complete and luxurious out of the box while giving the store owner 100% control over every item, cover image, price, and specification.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        LEKHIX APPLICATION SHELL                          │
│                  (ThemeProvider · CatalogContext · Cart)                 │
└───────────────────┬──────────────────────────────────┬───────────────────┘
                    │                                  │
                    ▼                                  ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────┐
│        LUXURY STOREFRONT (/)          │  │      ADMIN CONSOLE (/admin)   │
├───────────────────────────────────────┤  ├───────────────────────────────┤
│ ┌───────────────────────────────────┐ │  │ ┌───────────────────────────┐ │
│ │ Top Bar (Framed LEKHIX Logo,      │ │  │ │ Books & Stationery        │ │
│ │ Category Links, Theme, Cart Bag)  │ │  │ │ Catalog Manager           │ │
│ └───────────────────────────────────┘ │  │ │ (6x9 Cover Upload, Specs, │ │
│ ┌───────────────────────────────────┐ │  │ │  Hero Spotlight Toggle)   │ │
│ │ Featured Hero Showcase (01 — 04)  │ │  │ └───────────────────────────┘ │
│ │ Split Editorial + 6x9 Preview     │ │  │ ┌───────────────────────────┐ │
│ └───────────────────────────────────┘ │  │ │ Orders & Inquiries Views  │ │
│ ┌───────────────────────────────────┐ │  │ └───────────────────────────┘ │
│ │ Filter & Sort Bar + 3-Col Grid    │ │  └───────────────┬───────────────┘
│ │ (Strict 6x9 Cards: Title + Price) │ │                  │
│ └─────────────────┬─────────────────┘ │                  │
│                   ▼                   │                  ▼
│ ┌───────────────────────────────────┐ │  ┌───────────────────────────────┐
│ │ Gestalten Editorial Detail View   │ │  │      FIREBASE FIRESTORE       │
│ │ • Left: 6x9 Cover + Look Inside   │◄┼──┤ • /appData/catalog            │
│ │ • Center: Synopsis + 6-Spec Grid  │ │  │ • /orders/{orderId}           │
│ │ • Right: Vertical Bookshelf Strip │ │  │ • /contactSubmissions/{id}    │
│ └─────────────────┬─────────────────┘ │  └───────────────────────────────┘
│                   ▼                   │
│ ┌───────────────────────────────────┐ │
│ │ Slide-Over Cart & Checkout Modal  │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Data Model & State

- **CatalogItem (`Book` | `Stationery`)**:
  - `id`: Unique identifier
  - `title`: Product or Book title (rendered cleanly without subtitle)
  - `category`: `'Books'` | `'Stationery'`
  - `price`: Numeric price in INR (`₹`)
  - `originalPrice`: Optional comparison price for strikethrough display (Hikone style)
  - `image`: 6×9 inch (`2:3`) cover/product image URL or uploaded data URI
  - `previewPages`: Optional array of sample page text/images for the `"Click for Preview"` modal
  - `description`: Editorial synopsis shown in the Hero and Detail view
  - `featured`: Boolean flag indicating if the item appears in the `01 — 04` Hero carousel
  - `specs`: Structured editorial metadata object:
    - `author`: Author or Designer name
    - `publisher`: Editor / Publisher (`LEKHIX Press`, etc.)
    - `releaseDate`: Publication date (`Oct 2026`, etc.)
    - `format`: Default `"6 × 9 in"` (`15.2 × 22.9 cm`)
    - `features`: Binding & page count (`Hardcover, 256 pages` or material spec)
    - `language`: Language (`English` / `Hindi`)
    - `isbn`: ISBN-13 or SKU identifier

### Interactive Component & State Mapping

- **Header & Framed Logo Component**: Renders the vector/PNG framed **LEKHIX** mark; clicking resets filters and returns to the top storefront view.
- **Hero Carousel (`01 — 04`)**: Cycles through featured catalog items with instant compositor transitions; clicking `BUY` adds to cart or opens checkout, and clicking `Product details` opens the Gestalten Editorial Detail View.
- **Filter & Sort Toolbar**: Filters the grid by `All Products`, `Books`, or `Stationery` and sorts by `Default`, `Price: Low to High`, or `Price: High to Low`.
- **Editorial Detail & Bookshelf View**: Displays the selected item in full 3-column Gestalten layout; clicking `"CLICK FOR PREVIEW"` under the 6×9 cover opens a clean page-flip/sample reader modal; clicking any book on the right-hand `BOOKSHELF` strip switches the active item immediately.
- **Cart Drawer & Checkout**: Manages multi-item quantities in `localStorage` (`lekhix_cart`), calculates totals, and processes orders into Firestore `/orders` with downloadable 6×9-styled PDF receipts.
