// /js/data/rssBlog.js
export async function loadBlog() {
  const feedUrl = window.config.blogFeedURL;
  const feedContainer = document.getElementById("blogFeed");
  if (!feedUrl) {
    feedContainer.innerHTML = "There was an error or this site does not have a blog yet.";
    return;
  }

  try {
    const response = await fetch(feedUrl);
    const str = await response.text();
    const parser = new window.DOMParser();
    const xmlDoc = parser.parseFromString(str, "text/xml");
    const isAtom = xmlDoc.documentElement.nodeName.toLowerCase() === "feed";
    let html = "";

    if (!isAtom) {
      const channelImage = xmlDoc.querySelector("channel > image > url")?.textContent;
      if (channelImage) {
        html += `
          <div style="text-align:center;">
            <img src="${channelImage}" alt="Blog Avatar" style="border-radius:50%; max-width:120px; height:auto;">
          </div>`;
      }
    }

    const entries = isAtom ? xmlDoc.querySelectorAll("entry") : xmlDoc.querySelectorAll("item");
    entries.forEach((entry, index) => {
      if (index < 5) {
        const title = entry.querySelector(isAtom ? "title" : "title")?.textContent || "";
        const link = entry.querySelector(isAtom ? "link" : "link")?.getAttribute("href") || entry.querySelector("link")?.textContent || "#";
        const date = entry.querySelector(isAtom ? "updated" : "pubDate")?.textContent || "";
        const dateStr = new Date(date).toLocaleDateString();
        const author = entry.querySelector(isAtom ? "author > name" : "author")?.textContent || "";
        const content = entry.querySelector(isAtom ? "content" : "description")?.textContent || "";

        html += `<div class="feed-post">
          <h3><a href="${link}" target="_blank">${title}</a></h3>
          <p><em>${dateStr}</em> by <strong>${author}</strong></p>
          <div class="post-content">${content}</div>
        </div>`;
      }
    });

    feedContainer.innerHTML = html;
    window.blogLoaded = true;
  } catch (err) {
    console.error("Failed to load feed:", err);
    feedContainer.innerHTML = "<p>Unable to load posts. Please check back later.</p>";
  }
}
