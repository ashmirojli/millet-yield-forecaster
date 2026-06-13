/*
  components/ExplorerNav.jsx
  Layout mirrors the About the Project card:
    - mono uppercase label at top
    - large display title
    - base-size description
    - EXPLORE cta at bottom
*/
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './ExplorerNav.css'

const CARDS = [
  {
    id:    'national',
    label: 'Trends & Charts',
    title: 'National Overview',
    desc:  'Thirty years of pearl millet yield data across India — explore national trends, state-level comparisons, and year-on-year shifts.',
    href:  '/national',
  },
  {
    id:    'district',
    label: 'District Deep-dive',
    title: 'District Explorer',
    desc:  'Drill into any of 334 districts. See yield history, key performance metrics, and model predictions with SHAP explanations.',
    href:  '/district',
  },
]

export default function ExplorerNav() {
  return (
    <section id="explorer" className="explorer-nav" aria-label="Data explorer">
      <div className="container">
        <div className="explorer-nav__grid">
          {CARDS.map(({ id, label, title, desc, href }) => (
            <Link
              key={id}
              to={href}
              id={`explorer-card-${id}`}
              className="explorer-card textured"
              aria-label={`Go to ${title}`}
            >
              <span className="explorer-card__label">{label}</span>
              <h3 className="explorer-card__title">{title}</h3>
              <p className="explorer-card__desc">{desc}</p>
              <div className="explorer-card__footer">
                <span>Explore</span>
                <ArrowRight size={14} strokeWidth={2} className="explorer-card__arrow" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
