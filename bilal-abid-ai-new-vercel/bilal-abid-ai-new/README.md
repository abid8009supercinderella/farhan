# Bilal Abid AI — Vercel

A simple Gemini-powered chat website. The API key is kept server-side in a Vercel environment variable.

## Deploy
1. Extract this ZIP.
2. Upload **all files and folders** to a GitHub repository.
3. Import the repository into Vercel.
4. In Google AI Studio, create a Gemini API key.
5. In Vercel → Project → Settings → Environment Variables, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
   - Select Production, Preview and Development as appropriate.
6. Save, then redeploy the project.

Do not put the key in `index.html` or commit it to GitHub.

## Important
- This version uses the stable `generateContent` SDK method and `gemini-2.5-flash`, rather than the Interactions API or the retired `gemini-2.0-flash` model.
- Google may change model availability, API quotas, or account access. A valid key and available quota are required.
- If it fails, the website displays a useful error instead of spinning forever. See Vercel → Logs for server-side details.

## Local test
Create `.env.local` containing `GEMINI_API_KEY=your_key`, then run:

```bash
npm install
npx vercel dev
```
