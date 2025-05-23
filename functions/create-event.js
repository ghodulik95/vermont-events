// functions/submit.js

// Helper: exchange refresh token for a short-lived access token
async function getAccessToken(env) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: env.DROPBOX_REFRESH_TOKEN,
    client_id: env.DROPBOX_APP_KEY,
    client_secret: env.DROPBOX_APP_SECRET,
  });

  const tokenRes = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Dropbox token refresh failed: ${text}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

export async function onRequestPost({ request, env }) {
  // 1. Only allow JSON POST
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return new Response('Expected application/json', { status: 400 });
  }

  // 2. Parse incoming SurveyJS results
  const data = await request.json();

  // 3. Build our payload
  const submittedAt = new Date().toISOString();
  const uploadMethod =
    data.facebook === 'yes' ? 'facebook' : data.upload_method || null;
  const userInfoProvided = Boolean(data.user_information_bool);
  const fastTrackCode = data.fast_track_code || '';

  const payload = {
    meta: {
      submitted_at: submittedAt,
      upload_method: uploadMethod,
      user_information_provided: userInfoProvided,
      fast_track_code: fastTrackCode,
    },
    data,
  };
  const payloadStr = JSON.stringify(payload);

  // 4. Get a fresh short-lived access token
  let accessToken;
  try {
    accessToken = await getAccessToken(env);
  } catch (err) {
    return new Response(`Token refresh error: ${err.message}`, { status: 502 });
  }

  // 5. Generate filename & upload args
  const timestamp = submittedAt.replace(/[:.]/g, '-');
  const uuid = crypto.randomUUID();
  const dropboxPath = `/event-queue/${timestamp}-${uuid}.json`;
  const dropboxArgs = {
    path: dropboxPath,
    mode: 'add',
    autorename: true,
    mute: false,
  };

  // 6. Upload to Dropbox
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify(dropboxArgs),
      'Content-Type': 'application/octet-stream',
    },
    body: payloadStr,
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(`Dropbox upload error: ${err}`, { status: 502 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
