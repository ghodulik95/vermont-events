# Vermont Events Website

This is a fully static site built with Cloudflare Pages. On each deploy it:

1. Generates `public/config.json` from environment variables
2. Fetches & simplifies Mobilizon events into `public/data/events.json`
3. Publishes the `public/` directory as static assets

## Repo structure

vermont-events-website/
├── public/
│ ├── css/ # your styles
│ ├── js/ # your front-end logic
│ ├── data/ # generated events.json (gitignored)
│ └── index.html # HTML shell
├── scripts/
│ └── generate-config.js
├── fetch-events.js
├── config.template.json
├── package.json
├── .gitignore
└── README.md

## Setup

1. **Clone** this repo publicly
2. **Configure** environment variables in Cloudflare Pages:
   - `SITE_TITLE`
   - `MOBILIZON_URL`
   - `CONTACT_EMAIL`
   - (Optionally: `ABOUT_PANELS_JSON`, `SOURCE_LIST_JSON`)
3. **Build command:**
   ```bash
   npm install
   npm run build
   ```
