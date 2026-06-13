/*
  components/AboutLink.jsx
  ─────────────────────────────────────────────────────────────
  From your sketch: below the tab area, there's an "About the Project"
  section/button that navigates to the /about page.

  It's NOT a tiny link — it should feel like a section of its own:
  a contained card-like strip with the text and a subtle arrow,
  inviting the user to click through to the timeline page.

  Uses react-router-dom's <Link> for client-side navigation.
*/
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './AboutLink.css'

export default function AboutLink() {
  return (
    <section id="about-link" className="about-link-section" aria-label="About the project">
      <div className="container">
        <Link to="/about" className="about-link-card" id="about-the-project-link">
          <div className="about-link-card__left">
            <span className="about-link-card__label">Read the story</span>
            <h2 className="about-link-card__heading">About the Project</h2>
            <p className="about-link-card__body">
              The journey from raw ICRISAT data to an explainable ML system —
              data engineering, model ablation, SHAP analysis, and everything
              in between.
            </p>
          </div>
          <div className="about-link-card__arrow" aria-hidden="true">
            <ArrowRight size={28} strokeWidth={1.5} />
          </div>
        </Link>
      </div>
    </section>
  )
}
