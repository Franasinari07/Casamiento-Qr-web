function getSupabaseConfig() {
  const projectUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "fotos-casamiento";

  if (!projectUrl || !secretKey || !/^[a-z0-9_-]+$/.test(bucket)) return null;

  try {
    const url = new URL(projectUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    ) {
      return null;
    }

    return { baseUrl: url.origin, secretKey, bucket };
  } catch {
    return null;
  }
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return true;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function getPublicPhotoUrl(config, photoName) {
  const encodedName = photoName.split("/").map(encodeURIComponent).join("/");
  return `${config.baseUrl}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${encodedName}`;
}

module.exports = { getPublicPhotoUrl, getSupabaseConfig, isSameOrigin };
