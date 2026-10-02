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

  return `${Date.now()}-${baseName || "foto"}.jpg`;
}

module.exports = async function uploadPhoto(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { message: "Método no permitido." });
  }

  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
        return sendJson(response, 403, { message: "Origen no permitido." });
      }
    } catch {
      return sendJson(response, 403, { message: "Origen no permitido." });
    }
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

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const uploadSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!scriptUrl || !uploadSecret || uploadSecret.length < 32) {
    return sendJson(response, 503, { message: "La subida de fotos todavía no está configurada." });
  }

  let deploymentUrl;
  try {
    deploymentUrl = new URL(scriptUrl);
    if (
      deploymentUrl.protocol !== "https:" ||
      deploymentUrl.hostname !== "script.google.com" ||
      !deploymentUrl.pathname.startsWith("/macros/s/") ||
      !deploymentUrl.pathname.endsWith("/exec")
    ) {
      return sendJson(response, 503, { message: "La URL de subida no es válida." });
    }
  } catch {
    return sendJson(response, 503, { message: "La URL de subida no es válida." });
  }

  const name = createPhotoName(request.headers["x-photo-name"]);
  try {
    const uploadResponse = await fetch(deploymentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: uploadSecret,
        name,
        mimeType: "image/jpeg",
        data: photo.toString("base64"),
      }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await uploadResponse.json().catch(() => null);

    if (!uploadResponse.ok || !result?.ok || !result.id) {
      console.error("Google Apps Script rejected a photo upload", uploadResponse.status);
      return sendJson(response, 502, { message: "Drive no pudo guardar la foto. Probá nuevamente." });
    }

    return sendJson(response, 201, {
      id: result.id,
      name: result.name,
      mimeType: result.mimeType,
      createdTime: result.createdTime,
    });
  } catch (error) {
    console.error("Google Apps Script photo upload failed", error);
    return sendJson(response, 502, { message: "No pudimos conectar con Drive. Probá nuevamente." });
  }
};