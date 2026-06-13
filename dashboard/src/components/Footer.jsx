import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner container">

        {/* ── Brand ────────────────────────────────────────── */}
        <div className="footer__brand">
          <span className="footer__brand-name">Millet Yield Forecaster</span>
          <p className="footer__tagline">
            A project for pearl millet yield prediction<br />
            across 334 Indian districts using Explainable AI.

            BajraMaxxing
          </p>
        </div>

        {/* ── Links ────────────────────────────────────────── */}
        <nav className="footer__links" aria-label="Footer navigation">
          <span className="footer__links-heading">Explore</span>
          <Link to="/" className="footer__link">Home</Link>
          <Link to="/about" className="footer__link">About</Link>
        </nav>

        {/* ── External links ────────────────────────────────── */}
        <div className="footer__external">
          <span className="footer__links-heading">Code &amp; Data</span>
          <a
            href="https://github.com/ashmirojli/millet-yield-forecaster"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link footer__link--icon"
          >
            <ExternalLink size={14} strokeWidth={2} />
            GitHub
          </a>
          <a
            href="https://www.kaggle.com/ashmirojlipatra"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            Kaggle Notebook
          </a>
        </div>

      </div>

      {/* ── Bottom bar ───────────────────────────────────────── */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <div className="footer__credits">
            <span>© {year} Ashmi Rojli Patra</span>
            <span className="footer__bottom-divider">·</span>
            <span>UG student at IIT Kharagpur</span>
          </div>
          <div className="footer__credits footer__credits--sub">
            <span>Video credit: Pexels</span>
            <span className="footer__bottom-divider">·</span>
            <span>Design inspired by Pinterest</span>
            <span className="footer__bottom-divider">·</span>
            <span>This website does not collect any user data.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
