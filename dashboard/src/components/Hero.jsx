import './Hero.css'

export default function Hero() {
  return (
    <>
      <section id="hero" className="hero-banner" aria-label="Site title">

        <video
          className="hero-banner__video"
          src="/millet-field.mp4"
          autoPlay
          muted     // muted is required by browsers so as to allow autoplay without user interaction
          loop
          playsInline  // playsInline is set so as to prevent iOS from forcing the video into fullscreen
          aria-hidden="true"
        />

        <div className="hero-banner__overlay" aria-hidden="true" />  {/* this gradient overlay sits on top of the video so as to darken the lower edge and ensure the title text remains readable */}

        <div className="hero-banner__inner container">
          <h1 className="hero-banner__title">
            Predicting<br />
            Millet Yields<br />
            <em className="hero-banner__em">Across India</em>
          </h1>
        </div>

      </section>

      <section className="hero-intro" aria-label="Project introduction">
        <div className="hero-intro__inner container">
          <p className="hero-intro__text">
            334 districts. 30 kharif seasons. One crop.
            Built on three decades of ICRISAT data, enriched with NASA satellite rainfall data, and explained through SHAP,
            this tool doesn’t just predict crop yields; it shows the 'why' behind them.
            Explore broad national trends, zoom in on a specific district, and chat with the assistant to understand  the real,
            on-the-ground factors driving the millet harvest in India.
          </p>
        </div>
      </section>
    </>
  )
}
