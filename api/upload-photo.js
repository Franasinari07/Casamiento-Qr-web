const { randomUUID } = require("node:crypto");
const {
  getPublicPhotoUrl,
  getSupabaseConfig,
  isSameOrigin,
} = require("./supabase-storage");

const maxUploadSize = 3 * 1024 * 1024;

function sendJson(response, status, payload) {
  return response.status(status).json(payload);
}

function createPhotoName(headerValue) {
  let originalName = typeof headerValue === "string" ? headerValue : "foto";
  try {
    originalName = decodeURIComponent(originalName);
  } catch {
    originalName = "foto";
  }

  const baseName = originalName
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70);

  return `${Date.now()}-${randomUUID()}-${baseName || "foto"}.jpg`;
}

module.exports = async function uploadPhoto(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { message: "Método no permitido." });
  }

  if (!isSameOrigin(request)) {
    return sendJson(response, 403, { message: "Origen no permitido." });
  }

  if (request.headers["content-type"] !== "application/octet-stream") {
    return sendJson(response, 415, { message: "Formato de carga no permitido." });
  }

  const contentLength = Number(request.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > maxUploadSize) {
    return sendJson(response, 413, { message: "La foto supera el límite de 3 MB." });
  }

  const photo = request.body;
  if (!Buffer.isBuffer(photo) || photo.length === 0) {
    return sendJson(response, 400, { message: "No se recibió ninguna imagen." });
  }
  if (photo.length > maxUploadSize) {
    return sendJson(response, 413, { message: "La foto supera el límite de 3 MB." });
  }
  if (photo.length < 3 || photo[0] !== 0xff || photo[1] !== 0xd8 || photo[2] !== 0xff) {
    return sendJson(response, 415, { message: "Solo se aceptan imágenes JPG." });
  }

  const config = getSupabaseConfig();
  if (!config) {
    return sendJson(response, 503, { message: "La subida de fotos todavía no está configurada." });
  }

  const name = createPhotoName(request.headers["x-photo-name"]);
  try {
    const uploadUrl = `${config.baseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeURIComponent(name)}`;
    const supabaseResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        apikey: config.secretKey,
        "Content-Type": "image/jpeg",
        "Cache-Control": "max-age=3600",
        "x-upsert": "false",
      },
      body: photo,
      signal: AbortSignal.timeout(25000),
    });

    if (!supabaseResponse.ok) {
      console.error("Supabase rejected a photo upload", supabaseResponse.status);
      return sendJson(response, 502, { message: "Supabase no pudo guardar la foto. Probá nuevamente." });
    }

    return sendJson(response, 201, {
      id: name,
      name,
      mimeType: "image/jpeg",
      createdTime: new Date().toISOString(),
      url: getPublicPhotoUrl(config, name),
    });
  } catch (error) {
    console.error("Supabase photo upload failed", error);
    return sendJson(response, 502, { message: "No pudimos conectar con Supabase. Probá nuevamente." });
  }
};
