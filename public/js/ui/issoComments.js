// ── /js/ui/issoComments.js ────────────────────────────────────────────────────────

// Note: this file assumes you have already included the Isso embed script
// <script data-isso="https://comments.vermontmobilizon.xyz/" src="https://comments.vermontmobilizon.xyz/js/embed.min.js"></script>
// somewhere in your index.html (so that `window.Isso` is defined).

/**
 * mountPublicComments()
 *
 * When the user clicks the “Public comments” sidebar link, we want to:
 * 1. Insert a <section id="isso-thread"> inside #publicComments
 * 2. Call Isso.init() so that Isso will fetch & render the global thread.
 */
export function mountPublicComments() {
  const container = document.getElementById("publicComments");
  if (!container) return;

  // If we've already mounted once, don’t re-create another <section>
  if (container.querySelector("#isso-thread")) {
    // Just re-init in case it was removed
    if (window.Isso) {
      Isso.init();
    }
    return;
  }

  // Create the <section id="isso-thread"> that Isso looks for by default
  const thread = document.createElement("section");
  thread.id = "isso-thread";
  // (No data-isso-id attribute means it will default to the “root” thread URL.)
  container.appendChild(thread);

  // Trigger Isso to replace <section id="isso-thread"> with the comment UI
  if (window.Isso) {
    Isso.init();
  }
}



/**
 * mountIssoComments()
 *
 * Whenever you dynamically create a <section> meant for event‐specific comments
 * (e.g. inside a popup), you should give it both:
 *    <section id="isso-thread" data-isso-id="/event_comments/…"></section>
 * Then call mountIssoComments() so that Isso will bind that section.
 *
 * This function finds all <section> tags in the entire document that have
 * a data-isso-id attribute, and calls Isso.init() on each.
 * If the same <section> was already initialized, Isso.init() will safely no-op.
 */
export function mountIssoComments() {
  if (!window.Isso) {
    // Make sure the embed script is loaded first
    console.warn("Isso embed script not found. Comments will not load.");
    return;
  }

  // Select all <section> elements that have data-isso-id (event‐specific threads)
  const threads = document.querySelectorAll("section[data-isso-id]");
  threads.forEach((threadEl) => {
    // Isso.init() will look for elements with id="isso-thread" or data-isso-id
    // and inject its UI there. Passing no arguments to Isso.init() re-initializes
    // all existing placeholders, including this newly added one.
    Isso.init();
  });
}
