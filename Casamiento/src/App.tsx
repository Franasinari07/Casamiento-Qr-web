import "./App.css";
import { useEffect, useRef, useState } from "react";

type DrivePhoto = {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
};

type DriveFileList = {
  files?: DrivePhoto[];
};

const firstUploadedPhoto: DrivePhoto = {
  id: "1vA-Y3HZO2iMv-1hy_CXrQB7B1DIdIvBZ",
  name: "negrou.jpeg",
  mimeType: "image/jpeg",
};

export default function App() {
  /* const rsvpMessage = encodeURIComponent(
    "Hola, confirmo mi asistencia al casamiento de Belén y Agustín. ¡Gracias por invitarme!",
  ); */
  const driveFolderId = "17FvIz6PpKZQ_HghJpAFot_75pFtAye9s";
  const driveFolderUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;
  const driveApiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
  const [photos, setPhotos] = useState<DrivePhoto[]>([firstUploadedPhoto]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const albumDialogRef = useRef<HTMLDialogElement>(null);
  const activePhoto = photos[activePhotoIndex] ?? photos[0];

  useEffect(() => {
    if (!driveApiKey) return;

    let isActive = true;
    const params = new URLSearchParams({
      q: `'${driveFolderId}' in parents and trashed = false and mimeType contains 'image/'`,
      orderBy: "createdTime",
      pageSize: "100",
      fields: "files(id,name,mimeType,createdTime)",
      key: driveApiKey,
    });

    fetch(`https://www.googleapis.com/drive/v3/files?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error("No se pudieron cargar las fotos de Drive.");
        return response.json() as Promise<DriveFileList>;
      })
      .then(({ files = [] }) => {
        if (!isActive) return;
        setPhotos(files.filter((file) => file.mimeType.startsWith("image/")));
      })
      .catch(() => {
        if (isActive) setPhotoLoadFailed(true);
      });

    return () => {
      isActive = false;
    };
  }, [driveApiKey, driveFolderId]);

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

  const photoUrl = (photoId: string) =>
    `https://drive.google.com/thumbnail?id=${photoId}&sz=w1600`;

  return (
    <main>
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
          <p className="hero-date">18 · 11 · 2026 <span aria-hidden="true">/</span> Santa Fe</p>
          <div className="hero-actions">
            <a className="hero-upload-link" href={driveFolderUrl}>
              Subir fotos <span aria-hidden="true">↗</span>
            </a>
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
          <a className="album-button" href={driveFolderUrl}>
            Subir fotos <span aria-hidden="true">↗</span>
          </a>
        </div>
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
          <button
            className="photo-viewer-nav"
            type="button"
            onClick={() => changePhoto(-1)}
            disabled={photos.length < 2}
            aria-label="Foto anterior"
          >
            ‹
          </button>
          {activePhoto && (
            <figure className="photo-viewer-figure">
              <img src={photoUrl(activePhoto.id)} alt={activePhoto.name} />
              <figcaption>
                <span>{activePhoto.name}</span>
                <span>{activePhotoIndex + 1} / {photos.length}</span>
              </figcaption>
            </figure>
          )}
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