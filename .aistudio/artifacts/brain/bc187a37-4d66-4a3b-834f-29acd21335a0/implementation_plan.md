# IGNOU Complete 7-Category Programme & Course Database Expansion

Expand the IGNOU Database, Admin Product Editor, and Storefront filtering architecture to support all **7 official IGNOU Programme Categories** and pre-populate all **185 Post-Graduation/Diploma/Certificate/Awareness Programmes** (65 PG Diplomas, 26 Diplomas, 14 PG Certificates, 76 Certificates, 4 Awareness/Appreciation programmes) plus the complete updated `BASKH` and `BAUDH` Honours course sets from the July 2026 Common Prospectus.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and architecture decisions reflect your confirmed choices and are ready for your approval before implementation:

- **Confirmed Decision 1 — All 7 Programme Categories**: Expand the IGNOU Degree / Programme Level selector across the Database Manager, Admin Catalog Editor, and Storefront Filter bar to include all **7 distinct categories**:
  1. `Bachelor Degree`
  2. `Master Degree`
  3. `Post Graduate Diploma` (65 Programmes)
  4. `Diploma` (26 Programmes)
  5. `Post Graduate Certificate` (14 Programmes)
  6. `Certificate Degree` (76 Programmes)
  7. `Awareness / Appreciation` (4 Non-Credit Programmes)
- **Confirmed Decision 2 — Complete Course Coverage**: Pre-populate **all courses** listed in the prospectus for every programme — including **Compulsory**, **Optional / Elective**, **Practical / Lab**, and **Project / Internship** courses — with clear descriptive course titles and role annotations (e.g., `(Project)`, `(Practical)`, `(Optional)`) so selecting any course code immediately auto-fills its title while remaining 100% editable.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the IGNOU Database and Catalog Console into an exhaustive, prospectus-complete academic repository covering over **270+ IGNOU Programmes** across all 7 academic levels and **1,400+ Year-wise Course Codes**.
- **Target Audience / Persona**: Storefront curators and administrators adding IGNOU Solved Assignments, Projects/Synopses, and Study Materials who want zero manual data entry—selecting a Programme Category, Programme Code, and Year immediately surfaces every Compulsory, Optional, Lab, and Project course code for one-click selection and title auto-fill.
- **Key Value**: Eliminates manual lookup across 185+ PG Diploma, Diploma, PG Certificate, Certificate, and Awareness programmes while keeping all pre-loaded programmes and courses editable and synced with Firestore.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Database Console (`Database` Tab)**:
     - Administrators can filter the IGNOU repository across `All Degrees` or any of the **7 Programme Categories**, displaying live programme and course counts per category in tabular numerals.
     - Searching by Programme Code (e.g., `PGDRD`, `PGDCA_NEW`, `DECE`, `PGCCL`, `CLIS`, `APDF`, `BASKH`, `BAUDH`), Programme Title, or Course Code (e.g., `MRD 201`, `MCS 201`, `DECE 1`, `MTT 051`) instantaneously filters the accordion list.
     - Expanding any programme displays its Year-wise courses (`1st Year`, `2nd Year`, `3rd Year`, `4th Year`) with inline editing, course addition, and deletion.
  2. **Product Creation & Editing (`Catalog` Tab)**:
     - In Step 1 (`Select Degree Programme`), the curator chooses from all 7 Programme Categories in a responsive grid.
     - In Step 2 (`Program Code & Program Name`), the searchable combobox lists all programmes belonging to the chosen category and auto-fills the official Programme Title (including Hindi/Sanskrit subtitle where applicable).
     - In Step 3 & Step 5 (`Select Year` & `Select Course Code`), all Compulsory, Optional, Practical, and Project courses for that programme and year appear as both one-click quick-select chips and a searchable dropdown. Selecting or typing any course code (with spaces or hyphens, e.g., `MRD 201` or `MRD-201`) auto-fills the Product Title and stays fully editable.
  3. **Storefront Filtering (`IGNOU` Collection View)**:
     - Customers browsing the IGNOU section can filter seamlessly across all 7 Programme Categories, Programme Codes, Years, Course Codes, and Material Types (`Assignment` vs. `Project`).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Swiss Archival Editorial & Atelier Console matching LEKHIX's monochrome architectural language in both Light and Dark modes.
  - *Color Palette & Mood*: Crisp paper canvas (`#FAFAFA` light / `#0A0A0C` dark), elevated structural cards (`#FFFFFF` light / `#141418` dark), sharp hairline borders (`#E5E5E0` light / `#26262B` dark), and high-contrast ink accents (`#111111` light / `#FFFFFF` dark).
  - *Typography & Hierarchy*: Editorial serif display for book titles paired with geometric sans-serif controls and `tabular-nums` for all course codes, credit counts, and pricing.
- **Interactive Feedback & Motion**: Instantaneous client-side combobox filtering, live 6×9 book cover preview updates as course codes are selected, and toast notifications on database or catalog updates.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Non-Destructive Firestore Hydration & Pre-Seeded Merging**:
  - *Chosen Approach*: Merge the newly added 185 programmes and their courses (plus updated `BASKH` and `BAUDH` courses) into the active `ignouDatabase` state even if a previous snapshot already exists in Firestore, preserving any custom edits made by the admin while ensuring zero missing programmes or courses.
  - *Why*: Guarantees that all 185 new programmes and their courses appear immediately without requiring a database wipe or manual reset.
- **Decision 2 — Space & Hyphen Agnostic Course Code Normalization**:
  - *Chosen Approach*: Maintain a canonical course code normalizer (`MRD 201` $\leftrightarrow$ `MRD-201` $\leftrightarrow$ `MRD201`) across search, deduplication, and title lookup.
  - *Why*: The IGNOU prospectus uses spaces in some tables (`MRD 201`, `MJM 120`, `DECE 1`) and hyphens in others (`MST-001`, `MAW-001`, `MEV-021`). Normalizing keys ensures instant title auto-fill regardless of how the admin types the code.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   IGNOU Master Prospectus Data Layer                     │
│  • 7 Programme Categories (Bachelor, Master, PGD, Diploma, PGC, Cert,    │
│    Awareness/Appreciation)                                               │
│  • 270+ Official Programmes & 1,400+ Pre-Seeded Course Entries           │
│  • Master Course Code -> Official Title & Role Dictionary                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                 CatalogContext & Firestore Sync Engine                   │
│  • Hydrates & merges pre-seeded programmes with /appData/ignouDatabase   │
│  • Persists custom programme/course edits & /appData/catalog items       │
└───────────┬────────────────────────┴───────────────────────┬─────────────┘
            │                                                │
            ▼                                                ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────┐
│       Admin Curator Console          │  │     Public Storefront View     │
│  • DatabaseManager: 7-Category       │  │  • 7-Category IGNOU Filter Bar │
│    filter tabs, search & course CRUD │  │  • Dynamic Programme, Year &   │
│  • CatalogManager: 7-Category        │  │    Course Code drill-down      │
│    selector, Programme & Course      │  │  • Live 6×9 Book Cover Preview │
│    comboboxes with Title auto-fill   │  │    (Light & Dark Mode)         │
└──────────────────────────────────────┘  └────────────────────────────────┘
```

- **Data Model & State**:
  - `IgnouDegree` union type expanded to:
    `'Bachelor Degree' | 'Master Degree' | 'Post Graduate Diploma' | 'Diploma' | 'Post Graduate Certificate' | 'Certificate Degree' | 'Awareness / Appreciation'`
  - Official programme arrays organized by category:
    - `IGNOU_ODL_BACHELOR_PROGRAMMES` (62 programmes, including updated `BASKH` & `BAUDH` compulsory + optional GE/SEC/AECC courses across Years 1–3)
    - `IGNOU_ODL_MASTER_PROGRAMMES` (25 programmes)
    - `IGNOU_ODL_PG_DIPLOMA_PROGRAMMES` (65 programmes from Chapter 8)
    - `IGNOU_ODL_DIPLOMA_PROGRAMMES` (26 programmes from Chapter 9)
    - `IGNOU_ODL_PG_CERTIFICATE_PROGRAMMES` (14 programmes from Chapter 10)
    - `IGNOU_ODL_CERTIFICATE_PROGRAMMES` (76 programmes from Chapter 11)
    - `IGNOU_ODL_AWARENESS_PROGRAMMES` (4 programmes from Chapter 12)
- **Interactive Component & State Mapping**:
  - Selecting any of the 7 categories in `CatalogManager` or `DatabaseManager` scopes the programme list to that category.
  - Selecting a programme populates `selectedProgramAllCourses` with all Compulsory, Optional, Practical, and Project courses for that programme.
  - Selecting or typing a course code triggers `lookupIgnouCourseTitle`, populating the editable product/course title and updating `ProductImage6x9` in real time.
