# Resume Tailor (Private Daily Website)

This is your private resume tailoring website:
- Paste base resume once (saved locally in your browser)
- Paste job description + keyword list daily
- Choose cloud focus (AWS/Azure/GCP or mapping)
- Generate ATS resume + keyword coverage
- Download DOCX with margins:
  - Top 0"
  - Bottom 0"
  - Left 0.4"
  - Right 0.4"

## 1) Run locally (optional)
1. Install Node.js 18+
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

## 2) Deploy on Vercel (recommended for daily use from anywhere)
You do NOT need coding knowledge — just follow steps.

### A) Put this project on GitHub
1. Create a new GitHub repo (any name)
2. Upload all files from this folder into that repo

### B) Deploy on Vercel
1. Go to Vercel and click **New Project**
2. Import your GitHub repo
3. Set Environment Variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `APP_PASSWORD` = a password only you know (used to access the site)
4. Click **Deploy**

When deployment finishes, Vercel will give you a website link.

## Notes
- Your OpenAI key stays in Vercel environment variables (not in code).
- Base resume is stored in your browser Local Storage.
