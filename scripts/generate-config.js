import fs from "fs/promises";

// Define required raw environment variables (before defaults)
const requiredEnvVars = ["SITE_TITLE", "MOBILIZON_URL"];

// Check raw environment for missing variables
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

// Prepare config with defaults or provided env values
const cfg = {
  siteTitle: process.env.SITE_TITLE,
  mobilizonUrl: process.env.MOBILIZON_URL,
  contactEmail: process.env.CONTACT_EMAIL || "",
  topBannerText: process.env.TOP_BANNER_TEXT || "Alpha testing",
};

// Write to public/config.json
await fs.mkdir("public", { recursive: true });
await fs.writeFile(
  "public/config.json",
  JSON.stringify(cfg, null, 2),
  "utf-8"
);
console.log("Generated public/config.json");
