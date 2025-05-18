export async function onRequestPost(context) {
  console.log("REQUEST RECEIVED");
  const { title, body } = await context.request.json();
  const githubToken = context.env.GITHUB_TOKEN;
  const repo = 'ghodulik95/vermont-events';

  const githubResponse = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body })
  });
  
  console.log(githubResponse);

  if (!githubResponse.ok) {
    const error = await githubResponse.text();
    return new Response(error, { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
