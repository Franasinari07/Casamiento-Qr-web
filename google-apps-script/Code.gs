function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ ok: false, message: "Missing request body" });
    }

    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty("UPLOAD_SECRET");
    const folderId = properties.getProperty("DRIVE_FOLDER_ID");
    const payload = JSON.parse(event.postData.contents);

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse({ ok: false, message: "Unauthorized" });
    }
    if (!folderId) {
      return jsonResponse({ ok: false, message: "Missing folder" });
    }

    if (payload.action === "list") {
      return jsonResponse({ ok: true, files: listPhotos(folderId) });
    }

    if (payload.mimeType !== "image/jpeg" || typeof payload.data !== "string") {
      return jsonResponse({ ok: false, message: "Invalid upload" });
    }
    if (payload.data.length > 4 * Math.ceil((3 * 1024 * 1024) / 3)) {
      return jsonResponse({ ok: false, message: "File too large" });
    }

    const bytes = Utilities.base64Decode(payload.data);
    const signature = bytes.slice(0, 3).map((byte) => byte & 0xff);
    if (
      bytes.length === 0 ||
      bytes.length > 3 * 1024 * 1024 ||
      signature[0] !== 0xff ||
      signature[1] !== 0xd8 ||
      signature[2] !== 0xff
    ) {
      return jsonResponse({ ok: false, message: "Invalid image" });
    }

    const name = typeof payload.name === "string"
      ? payload.name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 100)
      : "foto.jpg";
    const file = DriveApp.getFolderById(folderId).createFile(
      Utilities.newBlob(bytes, "image/jpeg", name || "foto.jpg"),
    );

    return jsonResponse({
      ok: true,
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      createdTime: file.getDateCreated().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, message: "Request failed" });
  }
}

function authorizeDriveAccess() {
  const folderId = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID");
  if (!folderId) throw new Error("Set DRIVE_FOLDER_ID in Script Properties first.");
  DriveApp.getFolderById(folderId).getName();
}

function listPhotos(folderId) {
  const iterator = DriveApp.getFolderById(folderId).getFiles();
  const files = [];

  while (iterator.hasNext()) {
    const file = iterator.next();
    const mimeType = file.getMimeType();
    if (!mimeType.startsWith("image/")) continue;

    files.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: mimeType,
      createdTime: file.getDateCreated().toISOString(),
    });
  }

  files.sort((first, second) => second.createdTime.localeCompare(first.createdTime));
  return files.slice(0, 100);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}