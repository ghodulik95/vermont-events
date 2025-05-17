import fs from "fs/promises";

// Build-time config from env-vars
const cfg = {
  siteTitle: process.env.SITE_TITLE,
  mobilizonUrl: process.env.MOBILIZON_URL,
  contactEmail: process.env.CONTACT_EMAIL,
  aboutPanels: JSON.parse(process.env.ABOUT_PANELS_JSON || '[]'),
  sourceList: JSON.parse(process.env.SOURCE_LIST_JSON || '[]')
};

await fs.mkdir("public", { recursive: true });
await fs.writeFile(
  "public/config.json",
  JSON.stringify(cfg, null, 2),
  "utf-8"
);
console.log("⟳ Generated public/config.json");
