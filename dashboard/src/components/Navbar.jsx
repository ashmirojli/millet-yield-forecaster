import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'Home',  href: '/' },
  { label: 'About', href: '/about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)  // 20px threshold so as to avoid triggering the shadow immediately when the page loads
    window.addEventListener('scroll', onScroll, { passive: true })  // passive: true is set so as to tell the browser this listener will never call preventDefault(), allowing it to optimise scroll performance
    return () => window.removeEventListener('scroll', onScroll)  // cleanup so as to prevent a memory leak when the component is unmounted
  }, [])

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">

        <Link to="/" className="navbar__brand">
          <span className="navbar__brand-name">Millet Yield Forecaster</span>
        </Link>

        <nav className="navbar__links" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`navbar__link${location.pathname === href ? ' navbar__link--active' : ''}`}  // active class is applied dynamically so as to highlight the current page in the navbar
            >
              {label}
            </Link>
          ))}
        </nav>

      </div>
    </header>
  )
}
