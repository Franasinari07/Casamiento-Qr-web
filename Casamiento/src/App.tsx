import "./App.css";

export default function App() {
  const rsvpMessage = encodeURIComponent(
    "Hola, confirmo mi asistencia al casamiento de Belén y Agustín. ¡Gracias por invitarme!",
  );
  const mapUrl = "https://maps.google.com/?q=Salón+Monumental+VIP";
  const calendarUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Casamiento+de+Bel%C3%A9n+y+Agust%C3%ADn&dates=20261121T000000/20261121T230000&details=Nos+casamos%2C+te+esperamos&location=Salón+Monumental+VIP,+Santa+Fe";

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

      <section className="celebration" id="celebracion" aria-labelledby="celebration-title">
        <div className="celebration-heading">
          <p className="section-label">GUARDÁ LA FECHA</p>
          <h2 id="celebration-title">Una tarde para<br />celebrar juntos.</h2>
          <a className="text-link" href={calendarUrl} target="_blank" rel="noreferrer">
            Agregar al calendario <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="event-details">
          <article className="detail-row">
            <span className="detail-number">01</span>
            <div>
              <h3>Cuándo</h3>
              <p>Sábado 21 de noviembre de 2026</p>
              <p className="detail-secondary">Ceremonia · 18:00 h</p>
              <p className="detail-secondary">Fiesta · 21:00 h a 05:00 h</p>
            </div>
          </article>
          <article className="detail-row">
            <span className="detail-number">02</span>
            <div>
              <h3>Dónde</h3>
              <p>Salón Monumental</p>
              <p className="detail-secondary">Santa Fe</p>
              <a className="text-link" href={mapUrl} target="_blank" rel="noreferrer">
                Cómo llegar <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
          <article className="detail-row">
            <span className="detail-number">03</span>
            <div>
              <h3>Vestimenta</h3>
              <p>Mujeres: No usar Beige ni Blanco <span> Hombres: Blanco en la camisa</span></p>
              <p className="detail-secondary">Dejá el blanco para la novia :)</p>
            </div>
          </article>
        </div>
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