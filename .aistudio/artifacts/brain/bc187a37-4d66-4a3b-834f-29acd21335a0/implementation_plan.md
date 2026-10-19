# LEKHIX — eBook (PDF) Edition & Instant Download Integration

Enable **LEKHIX** to sell downloadable **eBooks in PDF format** alongside physical 6×9 hardcover editions while keeping the storefront layout, card design, and navigation completely unchanged.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions reflect your confirmed choices from our clarification step:

- **Confirmed Decision 1 — Keep Storefront Tabs & Add Format Selector Inside Book Details + Admin Filter**: The storefront navigation remains strictly **All Products · Books · Stationery · Bookshelf** with zero visual clutter. Inside the **Admin Console**, curators get both an **eBooks** filter tab (`All | Books | eBooks | Stationery`) and a **Book Format Selector** (`Physical Hardcover`, `eBook (PDF)`, or `Both Physical & eBook`) when adding or editing any book. Inside the **Book Detail View**, books with eBook availability show a clean format toggle (`PHYSICAL 6×9` / `EBOOK PDF`).
- **Confirmed Decision 2 — Dual PDF Attachment in Admin Console (Upload + URL)**: When `eBook (PDF)` or `Both` is selected in the Admin editor, the curator can either **upload a `.pdf` file directly** from their device or **paste an external PDF URL link** (plus an optional custom eBook price). If an eBook has no external file attached, the system can also generate a formatted 6×9 digital edition PDF on the fly so downloads never fail.
- **Confirmed Decision 3 — Instant PDF Download Unlocked After Checkout Confirmation**: Customers purchase eBooks through the same luxury Checkout flow; once payment/order confirmation completes, an instant **Download eBook (PDF)** button unlocks immediately in the confirmation drawer alongside the official receipt.

---

## 1. Overview & Core Concept

- **What It Does**: Extends the LEKHIX Books & Stationery platform so any book in the catalog can be offered as a **Physical 6×9 Edition**, a **Digital eBook (PDF)**, or **Both**.
- **Target Audience / Persona**:
  - **Store Curator (Admin)**: Needs a fast way in the Admin Console to mark a book as Physical or eBook (PDF), upload a PDF file or paste a PDF link, set its eBook price, and filter digital titles.
  - **Reader / Collector (Customer)**: Wants to choose between the physical 6×9 hardcover or the instant PDF eBook edition on the book's detail page and immediately download their purchased `.pdf` upon order confirmation.
- **Key Value**: Adds full digital publishing and instant PDF delivery without altering the minimalist 4-column storefront grid or 6×9 visual aesthetic.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Admin Console — Adding / Editing an eBook (PDF)**:
   - In **Curator Console → Catalog (6×9)**, the filter bar displays `All`, `Books`, `eBooks`, and `Stationery`.
   - When adding or editing a `Books` item, a **Book Edition Type** selector appears:
     - `Physical Only (6×9 Hardcover)`
     - `eBook Only (PDF Download)`
     - `Both (Physical + eBook PDF)`
   - When `eBook Only` or `Both` is selected, the **eBook PDF Delivery** panel appears with:
     - **eBook Price (₹ INR)**: Defaults to the book's price (or allows a lower digital price when `Both` is offered).
     - **Upload PDF File**: Direct `.pdf` file picker (`accept="application/pdf"`) that stores the uploaded PDF and displays the attached filename.
     - **Or PDF Download URL**: Direct text input for an external PDF link (e.g., Google Drive / cloud hosted PDF).
2. **Storefront & Editorial Book Detail View**:
   - The main storefront 4-column desktop / 2-column mobile grid and layered 6×9 pedestal cards remain **100% identical**.
   - When a customer opens a book in the **Editorial Detail View**:
     - If the book offers **Both** formats, a minimalist segmented selector (`PHYSICAL · ₹1,450` | `EBOOK (PDF) · ₹650`) sits directly above the `BUY` and `ADD TO CART` buttons.
     - If the book is **eBook Only**, the format specification clearly indicates `6 × 9 in Digital PDF Edition` and the purchase button purchases the PDF edition.
3. **Cart, Checkout & Instant PDF Unlock**:
   - Cart items display their selected format (`6 × 9 in` vs `eBook · PDF Edition`).
   - If the customer's checkout consists solely of digital eBook PDFs, the physical street address field becomes optional (`Delivery Address (Optional for Instant eBook PDF)`).
   - Upon **Order Confirmation**, a primary **DOWNLOAD EBOOK (PDF)** button is unlocked for each purchased eBook right above the **Download Official Receipt** button, triggering an immediate browser `.pdf` download.

### Visual Identity & Theme
- Preserves the existing **Cormorant Garamond** + **Plus Jakarta Sans** typography, dual Light (`#FAFAFA`) / Dark (`#0A0A0C`) palette, zero-pill metadata rules, and strict 6×9 cover proportions.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Format Selector Inside Book Details vs. Separate Storefront Page**
  - *Chosen Approach*: Keep the storefront navigation tabs (`All Products`, `Books`, `Stationery`, `Bookshelf`) unchanged and place the `Physical` / `eBook (PDF)` format switcher inside the Book Detail View (plus an `eBooks` filter tab inside the Admin Console).
  - *Why*: Matches your exact preference, keeps the storefront clean, and avoids duplicating the same book twice in the main catalog grid.
- **Decision 2: Hybrid PDF Storage (Uploaded PDF + External URL + Formatted 6×9 PDF Generator)**
  - *Chosen Approach*: Support direct `.pdf` file upload (via server/local storage endpoint `/api/upload-pdf` + data URL fallback for small PDFs) and external PDF URLs, plus an automatic 6×9 archival PDF generator when a seeded book is purchased as an eBook.
  - *Why*: Ensures large uploaded PDFs do not exceed Firestore's 1 MB document limit while guaranteeing every eBook purchase delivers a real, downloadable `.pdf` file immediately after checkout.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        CatalogContext & Firestore                          │
│  CatalogItem { bookFormat: 'physical' | 'ebook' | 'both',                  │
│                ebookPrice?, ebookPdfUrl?, ebookFileName? }                 │
│  CartItem    { product, quantity, selectedFormat: 'physical' | 'ebook' }   │
└───────────────┬─────────────────────────────┬──────────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────────┐
│      Admin CatalogManager         │ │       EditorialDetailView            │
│ • Filter: All | Books | eBooks |  │ │ • Format Selector:                   │
│   Stationery                      │ │   [ PHYSICAL (6×9) ] [ EBOOK (PDF) ] │
│ • Book Format Radio/Select:       │ │ • Updates active price & passes      │
│   Physical / eBook (PDF) / Both   │ │   selectedFormat to BUY / Cart       │
│ • Direct .pdf Upload (/api/pdf)   │ └──────────────────┬───────────────────┘
│   & External PDF URL input        │                    │
└───────────────────────────────────┘                    ▼
                                      ┌──────────────────────────────────────┐
                                      │           CheckoutModal              │
                                      │ • Displays format per item           │
                                      │ • Address optional for eBook-only    │
                                      │ • Order Success unlocks instant      │
                                      │   [ DOWNLOAD EBOOK PDF ] button      │
                                      └──────────────────────────────────────┘
```

### Data Model & State Updates
- **`CatalogItem` Extension**:
  - `bookFormat?: 'physical' | 'ebook' | 'both'` (defaults to `'both'` on seeded books so customers can test both Physical and eBook PDF right away, and configurable per book in Admin).
  - `ebookPrice?: number` (optional digital price when `bookFormat === 'both'`).
  - `ebookPdfUrl?: string` (uploaded PDF file URL / data URI or external link).
  - `ebookFileName?: string` (original uploaded `.pdf` filename for clean display in Admin and download).
- **`CartItem` & Direct Buy Extension**:
  - Tracks `selectedFormat?: 'physical' | 'ebook'` so adding both or either format of a book calculates the right unit price (`ebookPrice` vs `price`) and records `EBOOK (PDF)` in the Firestore `orders` collection (`itemType`).
- **Server PDF Upload Endpoint (`/api/upload-pdf`)**:
  - Express route in `server.ts` that accepts base64/binary PDF uploads from the Admin Console, saves them to `/public/ebooks/<sanitized-name>.pdf`, and returns the permanent `/ebooks/...` path so even multi-megabyte PDFs can be uploaded and downloaded without hitting Firestore's 1 MB document cap.
