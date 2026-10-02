function sendJson(response, status, payload) {
  return response.status(status).json(payload);
}

module.exports = async function listPhotos(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
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

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const uploadSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!scriptUrl || !uploadSecret || uploadSecret.length < 32) {
    return sendJson(response, 503, { message: "La lectura del álbum todavía no está configurada." });
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
      return sendJson(response, 503, { message: "La URL de Apps Script no es válida." });
    }
  } catch {
    return sendJson(response, 503, { message: "La URL de Apps Script no es válida." });
  }

  try {
    const scriptResponse = await fetch(deploymentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list", secret: uploadSecret }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await scriptResponse.json().catch(() => null);

    if (!scriptResponse.ok || !result?.ok || !Array.isArray(result.files)) {
      console.error("Google Apps Script rejected an album listing", scriptResponse.status);
      return sendJson(response, 502, { message: "Drive no pudo cargar las fotos del álbum." });
    }

    const files = result.files.filter(
      (file) =>
        file &&
        typeof file.id === "string" &&
        typeof file.name === "string" &&
        typeof file.mimeType === "string" &&
        file.mimeType.startsWith("image/"),
    );
    return sendJson(response, 200, { files });
  } catch (error) {
    console.error("Google Apps Script album listing failed", error);
    return sendJson(response, 502, { message: "No pudimos conectar con Drive." });
  }
};