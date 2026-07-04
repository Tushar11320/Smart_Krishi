# Repository Cleanup and Dead Code Audit Report

This report documents the scan, selection criteria, file deletions, gitignore updates, and storage statistics of the repository cleanup for Smart Krishi Marketplace.

---

## 1. Summary of Actions Taken

We performed a comprehensive audit of the project filesystem and Git index, identifying external dependencies committed to version control, duplicate build products, local debug logs, and unused code pages.

### Files & Directories Removed

| Path | Type | Scope | Reason for Deletion |
| :--- | :--- | :--- | :--- |
| `maven/` | Directory (Tracked) | Git & Disk | Committed Apache Maven 3.9.9 binaries. Redundant because the project uses the Maven Wrapper (`mvnw.cmd`). |
| `node_modules/` (Root) | Directory (Untracked) | Disk Only | Leftover duplicate dependency node module folder in root. Solved locks by terminating the dev server temporarily. |
| `dist/` (Root) | Directory (Untracked) | Disk Only | Legacy root PWA build folder. Clean build outputs are generated at `frontend/dist/`. |
| `testing/reports/*.log` | Files (Untracked) | Disk Only | Local logs `backend-local.log` and `frontend-local.log` generated during earlier testing. |
| `frontend/src/Pages/Resister.jsx` | File (Tracked) | Git & Disk | Unused signup skeleton page containing obsolete layouts. |
| `frontend/src/Pages/Maessages.jsx` | File (Tracked) | Git & Disk | Unused messaging layout page with spelling typo and mock names. |
| `frontend/src/Pages/Markerplace.jsx` | File (Tracked) | Git & Disk | Unused marketplace overview prototype page with spelling typo. |
| `frontend/src/Pages/LocationPickerPage.jsx` | File (Tracked) | Git & Disk | Unused page containing maps picker. Actual features use `NearbyProducts` and `SellerLocationSetup`. |
| `frontend/src/components/FarmingEpuipmentCard.jsx` | File (Tracked) | Git & Disk | Unused equipment card skeleton page with spelling typo. |
| `frontend/src/components/FertilizersCard.jsx` | File (Tracked) | Git & Disk | Empty dummy placeholder skeleton component. |
| `frontend/src/components/LandCard.jsx` | File (Tracked) | Git & Disk | Empty dummy placeholder skeleton component. |
| `frontend/src/components/MachineryCard.jsx` | File (Tracked) | Git & Disk | Empty dummy placeholder skeleton component. |
| `frontend/src/components/MilkCard.jsx` | File (Tracked) | Git & Disk | Empty dummy placeholder skeleton component. |
| `frontend/src/components/ProductCard.jsx` | File (Tracked) | Git & Disk | Empty dummy placeholder skeleton component. |
| `frontend/src/components/MarketPriceCard.jsx` | File (Tracked) | Git & Disk | Empty dummy placeholder skeleton component. |
| `frontend/src/components/ChatWindow.jsx` | File (Tracked) | Git & Disk | Unused standalone mock chatbot component. |

---

## 2. Files & Configurations Kept

- **[V1__init_schema.sql](file:///PROJECT_ROOT/backend/src/main/resources/db/migration/V1__init_schema.sql)**: Crucial Flyway initialization.
- **[database/schema/DATABASE_SCHEMA.sql](file:///PROJECT_ROOT/database/schema/DATABASE_SCHEMA.sql)**: Retained as it forms a valuable offline backup reference for developers.
- **`scratch/` scripts**: Retained scripts like `test_api.js` and `check_db.py` to allow ongoing API/DB verification.
- **`.env.example` configurations**: Kept as documentation templates for local setup.

---

## 3. Storage & Space Statistics

- **Root `maven/` distribution**: ~25.2 MB
- **Root `node_modules/` duplicate**: ~59.8 MB
- **Root `dist/` duplicate**: ~2.1 MB
- **Dead code/Components**: ~92 KB
- **Local log files**: ~127 KB
- **Total Storage Reclaimed**: **~87.3 MB**

---

## 4. Gitignore Updates

We updated the root **[.gitignore](file:///PROJECT_ROOT/.gitignore)** to explicitly ensure target folders, class binaries, log files, temp documents, and local uploads are not accidentally tracked in the future:
```gitignore
# 3. Log, Temp, and Backup Files
logs/
*.log
*.tmp
*.bak
*.class

# 4. User Uploaded Files & Temp Folders
backend/target/
backend/uploads/*
!backend/uploads/.gitkeep
```

---

## 5. Potential Risks & Verification

- **Vite Build Verification**: Running `npm run build` inside `frontend/` builds perfectly. Deleting root-level `node_modules` does not impact the frontend compile because the local package loader runs inside `frontend/node_modules/` where `npm install` has been re-run.
- **Backend Build Verification**: Backend builds successfully with `.\mvnw.cmd compile`. Deleting the `maven/` root folder has zero build impact since Maven Wrapper handles dependencies natively.
- **Dual Authentications & Payments**: Unaffected as no business logic files, database handlers, or integration endpoints were modified.

---

## 6. Final Repository Directory Structure

```
smart-krishi/
├── .agents/
├── .codex/
├── .git/
├── .github/
├── .gitignore (Updated)
├── .vscode/
├── README.md
├── TEST_DATA_SEED_REPORT.md
├── backend/
│   ├── src/
│   ├── mvnw
│   ├── mvnw.cmd
│   └── pom.xml
├── database/
│   ├── FIX_BUYER_PROFILES.sql
│   ├── FIX_DEMO_PASSWORDS.sql
│   ├── TEST_DATA_SEED.sql
│   └── schema/
├── docs/
│   ├── api-docs/
│   ├── audit-reports/
│   │   └── REPOSITORY_CLEANUP_REPORT.md (New)
│   ├── features/
│   ├── fixes/
│   └── help-center/
├── frontend/
│   ├── src/
│   ├── node_modules/ (Kept local dependencies)
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── scratch/
└── testing/
    └── reports/ (Emptied .log files)
```
