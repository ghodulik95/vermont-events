export async function onRequestPost(context) {
  try {
    const { title, body, category } = await context.request.json();

    if (!title || !body || !category) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: title, body, or category."
      }), { status: 400 });
    }

    const githubToken = context.env.GITHUB_TOKEN;
    if (!githubToken) {
      return new Response(JSON.stringify({
        success: false,
        error: "Server misconfiguration: missing GitHub token."
      }), { status: 500 });
    }

    const repo = 'ghodulik95/vermont-events';
    const label = `UserSubmitted:${category}`;
    const apiUrl = `https://api.github.com/repos/${repo}/issues`;

    const ghRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
        'User-Agent':    'vermont-events-issue-submission'
      },
      body: JSON.stringify({ title, body, labels: [label] })
    });

    const ghText = await ghRes.text();
    if (!ghRes.ok) {
      console.error("GitHub API Error:", ghRes.status, ghText);
      return new Response(JSON.stringify({
        success: false,
        status: ghRes.status,
        error: ghText
      }), { status: ghRes.status });
    }

    console.log("Issue created:", ghText);
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error("Unhandled Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || String(err)
    }), { status: 500 });
  }
}
