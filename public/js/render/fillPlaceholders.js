function insertText(className, text, prefix = '.') {
  document.querySelectorAll(prefix + className).forEach((el) => {
    el.textContent = text;
  });
}

function insertLink(className, link, text) {
  document.querySelectorAll('.' + className).forEach((el) => {
    const l = document.createElement('a');
    l.href = link;
    l.textContent = text;
    l.target = '_blank';
    l.rel = 'noopener noreferrer';
    el.innerHTML = '';
    el.appendChild(l);
  });
}

function insertMail(className, email, text) {}

export function defaultFillPlaceholders() {
  const config = window.config;
  insertLink(
    'mobilizon-url',
    config.mobilizonUrl,
    config.mobilizonUrl.replace(/^https?:\/\//, '')
  );
  insertText('site-name-text', config.siteTitle);
  insertText('topBannerText', config.topBannerText, '#');
  if (config.splashText !== null) {
    insertText('splashText', config.splashText, '#');
  }
  if (config.blogLink) {
    insertLink('blog-link', config.blogLink, 'here');
  }
  if (config.mastodonLink){
    insertLink('mastodon-link', config.mastodonLink, 'here');
  }
}
