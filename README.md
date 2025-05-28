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

How to make dropbox refresh token:
1. In Browser, go to https://www.dropbox.com/oauth2/authorize?client_id=<my-app-key>&response_type=code&token_access_type=offline
2. Authorize via browser and copy code
3. Do curl command
```
curl https: //api.dropboxapi.com/oauth2/token \
-u <my-app-key>: <my-app_secret> \
-d code = <code-from-browser> \
  -d grant_type = authorization_code \
  -d token_access_type = offline
```
4. In result, use REFRESH_TOKEN:
```  
{
  "access_token": <>
  "token_type": "bearer",
  "expires_in": 14400,
  "refresh_token": <REFRESH_TOKEN>
  "scope": <>
  "uid": <>,
  "account_id": <>
}
```