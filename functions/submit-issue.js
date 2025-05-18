export async function onRequestPost(context) {
  console.log("REQUEST RECEIVED");

  try {
    // Parse JSON payload safely
    const { title, body } = await context.request.json();

    if (!title || !body) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: 'title' and/or 'body'."
      }), { status: 400 });
    }

    const githubToken = context.env.GITHUB_TOKEN;
    if (!githubToken) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing GitHub token in environment."
      }), { status: 500 });
    }

    const repo = 'ghodulik95/vermont-events';
    const apiUrl = `https://api.github.com/repos/${repo}/issues`;

    const githubResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body })
    });

    const githubResponseText = await githubResponse.text();

    if (!githubResponse.ok) {
      console.error("GitHub API Error:", githubResponse.status, githubResponseText);
      return new Response(JSON.stringify({
        success: false,
        status: githubResponse.status,
        error: githubResponseText
      }), { status: githubResponse.status });
    }

    console.log("GitHub Issue Created Successfully");
    return new Response(JSON.stringify({ success: true, message: githubResponseText }), { status: 200 });

  } catch (error) {
    console.error("Unhandled Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
}
