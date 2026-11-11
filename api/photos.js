const {
  getPublicPhotoUrl,
  getSupabaseConfig,
  isSameOrigin,
} = require("./supabase-storage");

function sendJson(response, status, payload) {
  return response.status(status).json(payload);
}

module.exports = async function listPhotos(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { message: "Método no permitido." });
  }

  if (!isSameOrigin(request)) {
    return sendJson(response, 403, { message: "Origen no permitido." });
  }

  const config = getSupabaseConfig();
  if (!config) {
    return sendJson(response, 503, { message: "El álbum todavía no está configurado." });
  }

  try {
    const listUrl = `${config.baseUrl}/storage/v1/object/list/${encodeURIComponent(config.bucket)}`;
    const supabaseResponse = await fetch(listUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        apikey: config.secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix: "",
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!supabaseResponse.ok) {
      console.error("Supabase rejected an album listing", supabaseResponse.status);
      return sendJson(response, 502, { message: "Supabase no pudo cargar las fotos del álbum." });
    }

    const objects = await supabaseResponse.json();
    if (!Array.isArray(objects)) {
      console.error("Supabase returned an invalid album listing");
      return sendJson(response, 502, { message: "Supabase devolvió una respuesta inválida." });
    }

    const files = objects
      .filter(
        (object) =>
          object &&
          typeof object.name === "string" &&
          typeof object.metadata?.mimetype === "string" &&
          object.metadata.mimetype.startsWith("image/"),
      )
      .map((object) => ({
        id: object.name,
        name: object.name,
        mimeType: object.metadata.mimetype,
        createdTime: object.created_at,
        url: getPublicPhotoUrl(config, object.name),
      }));

    return sendJson(response, 200, { files });
  } catch (error) {
    console.error("Supabase album listing failed", error);
    return sendJson(response, 502, { message: "No pudimos conectar con Supabase." });
  }
};
