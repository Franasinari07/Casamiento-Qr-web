import "./App.css";

export default function App() {
  const rsvpMessage = encodeURIComponent(
    "Hola, confirmo mi asistencia al casamiento de Belén y Agustín. ¡Gracias por invitarme!",
  );
  const driveFolderUrl = "https://drive.google.com/drive/folders/REEMPLAZAR_ID_DE_CARPETA";
  const photoPreviews: { src: string; alt: string }[] = [];

  return (
    <main>
      <header className="site-header">
        <a className="monogram" href="#inicio" aria-label="Belén y Agustín, inicio">
          B <span>&</span> A
        </a>
        <nav aria-label="Navegación principal">
          <a href="#celebracion">La celebración</a>
          <a className="nav-rsvp" href="#confirmar">Confirmar asistencia</a>
        </nav>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=85"
          alt="Una celebración de casamiento al aire libre, entre árboles y luces cálidas"
        />
        <div className="hero-content">
          <p className="eyebrow">Con mucha alegría, queremos invitarte</p>
          <h1 id="hero-title">Belén <span>&</span> Agustín</h1>
          <p className="hero-date">18 · 11 · 2026 <span aria-hidden="true">/</span> Santa Fe</p>
          <a className="hero-link" href="#celebracion">Descubrí los detalles <span aria-hidden="true">↓</span></a>
        </div>
        <p className="hero-side-note" aria-hidden="true">UN DÍA · UNA HISTORIA · PARA SIEMPRE</p>
      </section>

      <section className="intro" aria-label="Invitación">
        <p className="section-label">NOS CASAMOS</p>
        <p className="intro-copy">Hay momentos que se vuelven aún más lindos cuando se comparten. <span>Nos encantaría que seas parte del nuestro.</span></p>
        <span className="flourish" aria-hidden="true">✳</span>
      </section>

      <section className="photo-album" id="celebracion" aria-labelledby="photo-album-title">
        <div className="photo-album-heading">
          <div>
            <p className="section-label">LOS RECUERDOS TAMBIÉN SON TUYOS</p>
            <h2 id="photo-album-title">Revive la celebración.</h2>
          </div>
          <a className="album-button" href={driveFolderUrl} target="_blank" rel="noreferrer">
            Subir fotos <span aria-hidden="true">↗</span>
          </a>
        </div>
        {photoPreviews.length > 0 ? (
          <div className="photo-grid">
            {photoPreviews.slice(0, 5).map((photo) => (
              <img key={photo.src} src={photo.src} alt={photo.alt} loading="lazy" />
            ))}
          </div>
        ) : (
          <p className="photo-empty">Pronto compartiremos las fotos de este día.</p>
        )}
        <a className="text-link album-more" href={driveFolderUrl} target="_blank" rel="noreferrer">
          Ver todas las fotos <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="rsvp" id="confirmar" aria-labelledby="rsvp-title">
        <p className="section-label">NOS HARÍA MUY FELICES</p>
        <h2 id="rsvp-title">¿Venís a celebrar?</h2>
        <p>Confirmá tu asistencia antes del 1 de septiembre.</p>
        <a className="rsvp-button" href={`https://wa.me/?text=${rsvpMessage}`} target="_blank" rel="noreferrer">
          Confirmar por WhatsApp <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer className="site-footer">
        <a className="monogram" href="#inicio" aria-label="Volver al inicio">B <span>&</span> A</a>
        <p>Con amor, Belén y Agustín · 2026</p>
      </footer>
    </main>
  );
}