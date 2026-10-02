import "./App.css";
import { type ChangeEvent, type TouchEvent, useEffect, useRef, useState } from "react";

type DrivePhoto = {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
};

type DriveFileList = {
  files?: DrivePhoto[];
};

type UploadResponse = DrivePhoto & {
  message?: string;
};

const maxUploadSize = 3 * 1024 * 1024;

async function preparePhoto(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No pudimos abrir esa imagen. Probá con JPG, PNG o WebP.");
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen.");

    let scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
    for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.72, 0.62, 0.52]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality),
        );
        if (blob && blob.size <= maxUploadSize) return blob;
      }
      scale *= 0.8;
    }

    throw new Error("La imagen es demasiado pesada. Probá con otra foto.");
  } finally {
    bitmap.close();
  }
}

const firstUploadedPhoto: DrivePhoto = {
  id: "1vA-Y3HZO2iMv-1hy_CXrQB7B1DIdIvBZ",
  name: "negrou.jpeg",
  mimeType: "image/jpeg",
};

export default function App() {
  /* const rsvpMessage = encodeURIComponent(
    "Hola, confirmo mi asistencia al casamiento de Belén y Agustín. ¡Gracias por invitarme!",
  ); */
  const [photos, setPhotos] = useState<DrivePhoto[]>([firstUploadedPhoto]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState("");
  const [likedPhotoIds, setLikedPhotoIds] = useState<string[]>(() => {
    try {
      const storedLikes = window.localStorage.getItem("liked-photo-ids");
      const parsedLikes: unknown = storedLikes ? JSON.parse(storedLikes) : [];
      return Array.isArray(parsedLikes)
        ? parsedLikes.filter((photoId): photoId is string => typeof photoId === "string")
        : [];
    } catch {
      return [];
    }
  });
  const albumDialogRef = useRef<HTMLDialogElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePhoto = photos[activePhotoIndex] ?? photos[0];
  const activePhotoIsLiked = activePhoto ? likedPhotoIds.includes(activePhoto.id) : false;

  useEffect(() => {
    let isActive = true;
    fetch("/api/photos")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudieron cargar las fotos de Drive.");
        return response.json() as Promise<DriveFileList>;
      })
      .then(({ files = [] }) => {
        if (!isActive) return;
        setPhotos(files.filter((file) => file.mimeType.startsWith("image/")));
        setPhotoLoadFailed(false);
      })
      .catch(() => {
        if (isActive) setPhotoLoadFailed(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const openAlbum = (photoIndex = 0) => {
    setActivePhotoIndex(photoIndex);
    albumDialogRef.current?.showModal();
  };

  const changePhoto = (step: number) => {
    setActivePhotoIndex((currentIndex) =>
      (currentIndex + step + photos.length) % photos.length,
    );
  };

  const handleAlbumKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft") changePhoto(-1);
    if (event.key === "ArrowRight") changePhoto(1);
  };

  const handlePhotoTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handlePhotoTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    changePhoto(deltaX < 0 ? 1 : -1);
  };

  const togglePhotoLike = () => {
    if (!activePhoto) return;

    const nextLikedPhotoIds = activePhotoIsLiked
      ? likedPhotoIds.filter((photoId) => photoId !== activePhoto.id)
      : [...likedPhotoIds, activePhoto.id];
    setLikedPhotoIds(nextLikedPhotoIds);
    try {
      window.localStorage.setItem("liked-photo-ids", JSON.stringify(nextLikedPhotoIds));
    } catch {
      // Likes remain available for the current session when storage is disabled.
    }
  };

  const photoUrl = (photoId: string) =>
    `https://drive.google.com/thumbnail?id=${photoId}&sz=w1600`;

  const choosePhotos = () => {
    if (!isUploading) photoInputRef.current?.click();
  };

  const uploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setPhotoUploadStatus("");
    let uploadedCount = 0;

    try {
      for (const [index, file] of selectedFiles.entries()) {
        setPhotoUploadStatus(`Preparando foto ${index + 1} de ${selectedFiles.length}…`);
        const photo = await preparePhoto(file);
        setPhotoUploadStatus(`Subiendo foto ${index + 1} de ${selectedFiles.length}…`);

        const response = await fetch("/api/upload-photo", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Photo-Name": encodeURIComponent(file.name),
          },
          body: photo,
        });
        const result = (await response.json()) as UploadResponse;
        if (!response.ok) {
          throw new Error(result.message ?? "No se pudo subir la foto.");
        }

        setPhotos((currentPhotos) => [result, ...currentPhotos]);
        setActivePhotoIndex(0);
        uploadedCount += 1;
      }

      setPhotoLoadFailed(false);
      setPhotoUploadStatus(
        uploadedCount === 1 ? "Foto subida al álbum." : `${uploadedCount} fotos subidas al álbum.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir la foto.";
      setPhotoUploadStatus(
        uploadedCount > 0
          ? `${uploadedCount} fotos subidas. ${message}`
          : message,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main>
      <input
        className="photo-file-input"
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        onChange={uploadPhotos}
      />
      <header className="site-header">
        <a className="monogram" href="#inicio" aria-label="Belén y Agustín, inicio">
          B <span>&</span> A
        </a>
        <nav aria-label="Navegación principal">
          <a href="#coleccion">Colección</a>
        </nav>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=85"
          alt="Una celebración de casamiento al aire libre, entre árboles y luces cálidas"
        />
        <div className="hero-content">
          <p className="eyebrow">Con mucha alegría, queremos invitarte a recordar este momento</p>
          <h1 id="hero-title">Belén <span>&</span> Agustín</h1>
          <p className="hero-date">21 · 11 · 2026 <span aria-hidden="true">/</span> Santa Fe</p>
          <div className="hero-actions">
            <button className="hero-upload-link" type="button" onClick={choosePhotos} disabled={isUploading}>
              {isUploading ? "Subiendo…" : "Subir fotos"} <span aria-hidden="true">↗</span>
            </button>
            <button className="hero-album-link" type="button" onClick={() => openAlbum()}>
              Ver álbum <span aria-hidden="true">↗</span>
            </button>
          </div>
          <button className="hero-link" type="button" onClick={() => openAlbum()}>
            Ver álbum <span aria-hidden="true">↗</span>
          </button>
        </div>
        <p className="hero-side-note" aria-hidden="true">UN DÍA · UNA HISTORIA · PARA SIEMPRE</p>
      </section>

      <section className="intro" aria-label="Invitación">
        <p className="section-label">NOS CASAMOS</p>
        <p className="intro-copy">Hay momentos que se vuelven aún más lindos cuando se comparten. <span>Nos encantaría que seas parte del nuestro.</span></p>
        <span className="flourish" aria-hidden="true">✳</span>
      </section>

      <section className="photo-album" id="coleccion" aria-labelledby="photo-album-title">
        <div className="photo-album-heading">
          <div>
            <p className="section-label">LOS RECUERDOS TAMBIÉN SON TUYOS</p>
            <h2 id="photo-album-title">Revive la celebración.</h2>
          </div>
          <button className="album-button" type="button" onClick={choosePhotos} disabled={isUploading}>
            {isUploading ? "Subiendo…" : "Subir fotos"} <span aria-hidden="true">↗</span>
          </button>
        </div>
        {photoUploadStatus && (
          <p className="photo-status" role="status" aria-live="polite">
            {photoUploadStatus}
          </p>
        )}
        {photos.length > 0 ? (
          <div className="photo-grid">
            {photos.slice(0, 5).map((photo, index) => (
              <button
                className="photo-thumbnail"
                key={photo.id}
                type="button"
                onClick={() => openAlbum(index)}
                aria-label={`Abrir foto ${index + 1}: ${photo.name}`}
              >
                <img src={photoUrl(photo.id)} alt={photo.name} loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <p className="photo-empty">Todavía no hay fotos en el álbum.</p>
        )}
        {photoLoadFailed && (
          <p className="photo-status" role="status">
            No se pudieron actualizar las fotos; mostramos las imágenes disponibles.
          </p>
        )}
        <button className="text-link album-more" type="button" onClick={() => openAlbum()} disabled={!photos.length}>
          Ver álbum <span aria-hidden="true">↗</span>
        </button>
      </section>

      <dialog className="photo-viewer" ref={albumDialogRef} onKeyDown={handleAlbumKeyDown}>
        <div className="photo-viewer-content">
          <h2 className="visually-hidden">Álbum de fotos</h2>
          <button
            className="photo-viewer-close"
            type="button"
            onClick={() => albumDialogRef.current?.close()}
            aria-label="Cerrar álbum"
          >
            ×
          </button>
          {activePhoto && (
            <figure
              className="photo-viewer-figure"
              onTouchStart={handlePhotoTouchStart}
              onTouchEnd={handlePhotoTouchEnd}
            >
              <img src={photoUrl(activePhoto.id)} alt={activePhoto.name} />
            </figure>
          )}
          <div className="photo-viewer-controls" aria-label="Controles del álbum">
            <button
              className="photo-viewer-nav"
              type="button"
              onClick={() => changePhoto(-1)}
              disabled={photos.length < 2}
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              className={`photo-like-button${activePhotoIsLiked ? " is-liked" : ""}`}
              type="button"
              onClick={togglePhotoLike}
              aria-label={activePhotoIsLiked ? "Quitar me gusta" : "Me gusta"}
              aria-pressed={activePhotoIsLiked}
              disabled={!activePhoto}
            >
              <span className="heart-mark" aria-hidden="true">
                {activePhotoIsLiked ? "♥" : "♡"}
              </span>
            </button>
            <button
              className="photo-viewer-nav"
              type="button"
              onClick={() => changePhoto(1)}
              disabled={photos.length < 2}
              aria-label="Foto siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </dialog>

      {/* <section className="rsvp" id="confirmar" aria-labelledby="rsvp-title">
        <p className="section-label">NOS HARÍA MUY FELICES</p>
        <h2 id="rsvp-title">¿Venís a celebrar?</h2>
        <p>Confirmá tu asistencia antes del 1 de septiembre.</p>
        <a className="rsvp-button" href={`https://wa.me/?text=${rsvpMessage}`} target="_blank" rel="noreferrer">
          Confirmar por WhatsApp <span aria-hidden="true">↗</span>
        </a>
      </section> */}

      <footer className="site-footer">
        <a className="monogram" href="#inicio" aria-label="Volver al inicio">B <span>&</span> A</a>
        <p>Con amor, Belén y Agustín · 2026</p>
      </footer>
    </main>
  );
}