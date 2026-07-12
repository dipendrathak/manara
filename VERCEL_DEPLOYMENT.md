# Vercel Deployment & Admin Login Guide

This guide provides step-by-step instructions to deploy the Manarashiswa Nagarpalika portal to Vercel and log in to the admin panel.

---

## 1. How to Deploy to Vercel

Since we have added the `vercel.json` configuration, Vercel will automatically compile the Express server and serve the static pages seamlessly. Follow these steps to deploy:

### Step A: Push Code to GitHub / GitLab / Bitbucket
1. Initialize Git in the project directory (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Configure Vercel deployment and SQLite compatibility"
   ```
2. Create a new repository on your GitHub account and push the codebase:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step B: Connect to Vercel
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and log in.
2. Click the **"Add New..."** button and select **"Project"**.
3. Import your GitHub repository.
4. Vercel will automatically detect the settings. Under **Build & Development Settings**, leave them as default (Vercel will use our `vercel.json` to configure the Node.js helper).
5. Click **"Deploy"**.
6. Once deployment finishes, Vercel will give you a domain link (e.g., `https://your-project-name.vercel.app`).

---

## 2. How the Admin Can Log In

Once your project is deployed, use these steps to log in as an administrator to manage notices, documents, officials, gallery, and dynamic tables:

### Step 1: Open the Admin Panel URL
Navigate to the `/admin.html` page of your deployed website:
* **URL:** `https://your-project-name.vercel.app/admin.html`
* *(Or locally: `http://localhost:3001/admin.html`)*

### Step 2: Enter Admin Credentials
The login window will display. Enter the following default administrator credentials:
* **Username:** `admin`
* **Password:** `admin123`

### Step 3: Complete Login
Click the **Login** button. You will be redirected to the Admin Dashboard showing statistics and navigation panels for all management modules.

---

## 3. Important Architectural Information for Vercel

> [!WARNING]
> **Serverless Filesystem Limitations**:
> Vercel hosts code on serverless functions with a read-only filesystem. Since the project uses SQLite and file uploads, we have implemented the following adaptations to ensure they work smoothly:
> 
> 1. **SQLite Database**: The `database.sqlite` file is deployed with the code. On startup, the app automatically copies the database to the writable `/tmp` directory (`/tmp/database.sqlite`). All admin changes will be written here.
> 2. **File Uploads**: When you upload images (for officials, gallery, etc.) or PDF files (for budget, documents, reports), they are written to `/tmp/uploads`.
> 3. **Data Expiration**: Data changes (notices added, database table modifications, file uploads) are **temporary** and will reset when Vercel recycles the serverless container (which happens frequently, e.g., during periods of inactivity or code redeployments).
> 
> **For a production deployment with permanent storage, we recommend:**
> * **Database**: Upgrade from SQLite to a hosted database (like PostgreSQL on Supabase/Neon, or Turso SQLite) by configuring a Database pool driver.
> * **File Uploads**: Connect a cloud-based storage service (like AWS S3 or Cloudinary) to handle file uploads instead of local filesystem storage.
