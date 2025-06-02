// /js/utils/urlHelpers.js

/**
 * Check whether a string is a valid URL.
 * Returns true if the browser’s URL constructor can parse it; false otherwise.
 */
export function isValidUrl(str) {
  try {
    // Attempt to construct a URL object—will throw if invalid.
    // If str is relative (no protocol), this will still parse, so we additionally
    // ensure it has http:// or https:// at the start.
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
}

/**
 * Given a full URL string, return just the hostname (e.g., "example.com").
 * If the input is not a valid URL, returns an empty string.
 */
export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "";
  }
}

/**
 * Given either:
 *   • a string (e.g. "https://example.com/page")  
 *   • or an object { url: "...", description: "Some text" }
 * Returns a safe <a> tag as HTML string.  
 * If `description` is provided, uses that as link text; otherwise,
 * falls back to using the domain (hostname).  
 * If the URL is invalid, returns an empty string.
 *
 * Usage examples:
 *   getRedirectHTML("https://vermontmobilizon.xyz")
 *   getRedirectHTML({ url: "https://vermontmobilizon.xyz", description: "More info" })
 */
export function getRedirectHTML(linkInfo) {
  let href, text;

  if (typeof linkInfo === "string") {
    href = linkInfo;
    text = getDomain(linkInfo) || linkInfo;
  } else if (
    linkInfo &&
    typeof linkInfo === "object" &&
    typeof linkInfo.url === "string"
  ) {
    href = linkInfo.url;
    // Prefer a non-empty description; otherwise, use the domain.
    text = linkInfo.description?.trim() || getDomain(linkInfo.url) || linkInfo.url;
  } else {
    return ""; // Not a valid linkInfo shape
  }

  if (!isValidUrl(href)) {
    return ""; // Don’t generate a link if the URL is invalid
  }

  // Always open in a new tab and add rel="noopener" for security
  return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
}
