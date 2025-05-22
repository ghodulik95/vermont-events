// functions/submit.js
export async function onRequestPost({ request, env }) {
  // 1. Only allow JSON POST
  if (
    request.headers.get('content-type')?.includes('application/json') === false
  ) {
    return new Response('Expected application/json', { status: 400 });
  }
  // 2. Parse incoming SurveyJS results
  const data = await request.json();

  // 3. Build our payload
  const submittedAt = new Date().toISOString(); // e.g. "2025-05-22T18:24:30.123Z"
  const uploadMethod = data.upload_method || null;
  const userInfoProvided = !!data.user_information_bool;
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

  // 4. Generate a sortable, unique filename
  const timestamp = submittedAt.replace(/[:.]/g, '-'); // "2025-05-22T18-24-30-123Z"
  const uuid = crypto.randomUUID(); // requires Workers runtime
  const dropboxPath = `/Apps/Vermont.Events/event-queue/${timestamp}-${uuid}.json`;

  // 5. Upload to Dropbox
  const dropboxArgs = {
    path: dropboxPath,
    mode: 'add',
    autorename: true,
    mute: false,
  };

  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DROPBOX_TOKEN}`,
      'Dropbox-API-Arg': JSON.stringify(dropboxArgs),
      'Content-Type': 'application/octet-stream',
    },
    body: payloadStr,
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(`Dropbox API error: ${err}`, { status: 502 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
