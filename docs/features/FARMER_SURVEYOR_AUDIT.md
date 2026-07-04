# Audit Report: Farmer Surveyor Feature

This audit report evaluates the "Farmer Surveyor" (or "Farm Boundary Surveyor") feature in the Smart Krishi platform.

---

## 1. Feature Definition

**Farmer Surveyor** was designed as an interactive mapping tool that allows users (primarily land sellers or surveyors) to draw polygon boundaries over satellite images of agricultural land. The tool uses the Google Maps drawing manager and spherical geometry libraries to compute:
- Boundary coordinate nodes (latitude and longitude bounds)
- Field area in square meters, hectares, and acres

---

## 2. Implementation Status Assessment

Following a comprehensive search across all frontend and backend source files, here is the feature's status:

| Layer | Status | Implementation Details |
| :--- | :--- | :--- |
| **Frontend Component** | **Partially Implemented** | The UI in `FarmBoundaryMap.jsx` loads Google Maps correctly and computes metrics locally on the client. However, the "Save Farm Survey" action only logs to the browser console and triggers a mock success toast. It does not perform any API post/save requests. |
| **Frontend Routes** | **Unused / Orphaned** | The route `/farm-boundary` is registered in `App.jsx` and referenced in `Sidebar.jsx`, but is not integrated into any active buyer or seller transaction flows. |
| **Backend Controllers & APIs** | **Non-existent** | No controllers, endpoints, or REST routes exist for saving, retrieving, or managing polygon boundary objects. |
| **Database Schema** | **Non-existent** | There are no database tables (e.g. `farm_boundary`, `surveyor_records`) matching this feature. The only related field is `boundary_verified` on the `land_listings` table, which is a simple boolean flag. |

**Verdict**: The feature is **partially implemented** (client-side drawing and math are complete) but **unused** and **unintegrated** in the overall platform business logic.

---

## 3. Decommissioning & Cleanup Actions

To keep the codebase lean and prevent maintenance overhead of unused components, the following actions have been executed:

1.  **Removed Route**:
    *   Removed `import FarmBoundaryMap` and the route `<Route path="/farm-boundary" ... />` from [App.jsx](file:///PROJECT_ROOT/frontend/src/App.jsx).
2.  **Removed Menu Item**:
    *   Removed the "Farm Surveyor" link from the sidebar menu under the "Agriculture Marketplace" accordion in [Sidebar.jsx](file:///PROJECT_ROOT/frontend/src/components/Sidebar.jsx).
3.  **Deleted Component**:
    *   Deleted the unused UI component file `FarmBoundaryMap.jsx` located at `frontend/src/Pages/FarmBoundaryMap.jsx`.
4.  **Backend Safety Check**:
    *   No backend controllers, services, repositories, or database tables were modified or dropped. This is because no backend components were ever created for this feature (avoiding any risk to the existing database schema).
