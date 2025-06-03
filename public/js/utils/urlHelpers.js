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
export function getRedirectHTML(rawEvent, truncate = null) {
  const { externalParticipationUrl, onlineAddress, url } = rawEvent;

  const links = [];

  if (isValidUrl(externalParticipationUrl)) {
    links.push(createLink(externalParticipationUrl, truncate));
  }

  if (isValidUrl(onlineAddress)) {
    if (
      !isValidUrl(externalParticipationUrl) ||
      getDomain(onlineAddress) != getDomain(externalParticipationUrl)
    ) {
      links.push(createLink(onlineAddress, truncate));
    }
  }

  if (links.length === 0 && url) {
    // Assume `url` is always valid
    links.push(createLink(url, truncate));
  }

  return links.join(', ');
}

function createLink(linkUrl, truncate) {
  const domain = getDomain(linkUrl);
  const label =
    truncate && domain.length > truncate
      ? domain.slice(0, truncate) + '...'
      : domain;

  return `<a href="${linkUrl}" target="_blank">${label}</a>`;
}