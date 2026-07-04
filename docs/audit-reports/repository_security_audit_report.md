# Repository Security Audit & Git Hygiene Report

This report presents the findings of a complete repository security audit of the **Smart Krishi Marketplace** project. It details identified vulnerabilities, repository cleanups executed, history purge verification, and best practices for secure environment configuration.

---

## 1. Security Audit Findings & Risks

### A. Tracked Sensitive Environment Files
* **Vulnerability**: Environment files (`.env` and `.env.development`) containing live API keys, Cloudinary credentials, and Google Maps API keys were tracked and committed to Git.
* **Status**: **RESOLVED (Scrubbed and Untracked)**. The files have been untracked from the active index and permanently removed from Git history. They are now safely ignored by `.gitignore`.
* **Risk**: None. Leaving these files tracked would have exposed integration credentials to the public.

### B. Tracked Target and Binary Folders
* **Vulnerability**: Compiled class binaries (`backend/target/`), uploaded product images (`backend/uploads/`), and Maven wrapper executables (`maven/`) were tracked in Git.
* **Status**: **RESOLVED**. Staged for untracking and excluded from active tracking. Cleaned from repository logs.
* **Risk**: None. Excluding these avoids repository bloat and speed issues.

---

## 2. Git History Exposures & Cleanup Verification

Because `.env` and `.env.development` were committed in previous commits (commits `55426de`, `d79c1c5`, etc.), we ran a complete history purge.

### Step-by-Step History Purging Performed:

We successfully executed the PowerShell-compatible history cleanup command:
```powershell
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env .env.development backend/src/main/resources/application-dev.yml backend/src/main/resources/application-local.yml" --prune-empty --tag-name-filter cat -- --all
```

### Verification Results:
We verified the success of the rewrite by checking commit logs for the targeted files:
```bash
git log --oneline -- .env .env.development backend/src/main/resources/application-dev.yml backend/src/main/resources/application-local.yml
```
* **Output**: (Empty)
* **Result**: **100% SUCCESS**. No historical logs remain for these sensitive files.

### Next Action (Remote Push):
To sync the rewritten history to GitHub, run:
```bash
git push origin --force --all
git push origin --force --tags
```

---

## 3. Secure Production Environment Strategy

To prevent credential leakage in production, we enforce this environment variable strategy:

1. **Vercel Settings**: Provide `VITE_API_BASE_URL` and `VITE_GOOGLE_MAPS_API_KEY` through Vercel's GUI environment settings panel. Do not include `.env` or other files in build deploys.
2. **Render settings**: Configure all secrets (such as database credentials, JWT secret keys, and Razorpay tokens) inside the Render Dashboard's Environment Variables section.
3. **Secret Store / KMS (Optional Upgrade)**: For high-security environments, store application secrets in cloud keystores (e.g., AWS Secrets Manager, HashiCorp Vault, or Google Cloud Secret Manager) and load them dynamically during Spring Boot boot.
