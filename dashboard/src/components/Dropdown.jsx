/*
  components/Dropdown.jsx
  ─────────────────────────────────────────────────────────────
  Fully custom dropdown — replaces native <select> so we can
  style every pixel to match the warm palette.

  How it works:
  - A button trigger shows the current value (or placeholder)
  - Clicking opens an absolutely-positioned list panel
  - Clicking an option selects it, calls onChange, closes
  - Clicking outside also closes (useEffect + document listener)
  - Keyboard: Escape closes the list

  Props:
    id          string   — for the aria-labelledby
    label       string   — visible label above the trigger
    options     string[] — list of option strings
    value       string   — currently selected value ('' = nothing)
    onChange    fn       — called with the selected string
    placeholder string   — text when nothing selected
    disabled    bool     — greyed out, not openable
*/
import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import './Dropdown.css'

export default function Dropdown({
  id,
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select…',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const select = (opt) => {
    onChange(opt)
    setOpen(false)
  }

  return (
    <div
      ref={wrapRef}
      className={`dd-wrap${disabled ? ' dd-wrap--disabled' : ''}${open ? ' dd-wrap--open' : ''}`}
      id={id}
    >
      {/* Label above */}
      {label && (
        <span className="dd-label" id={`${id}-label`}>{label}</span>
      )}

      {/* Trigger button */}
      <button
        type="button"
        className={`dd-trigger${!value ? ' dd-trigger--placeholder' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <span className="dd-trigger__text">
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`dd-trigger__chevron${open ? ' dd-trigger__chevron--up' : ''}`}
        />
      </button>

      {/* Option list */}
      {open && (
        <ul
          className="dd-list"
          role="listbox"
          aria-label={label}
        >
          {options.map(opt => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`dd-option${value === opt ? ' dd-option--selected' : ''}`}
              onClick={() => select(opt)}
            >
              {opt}
              {value === opt && (
                <span className="dd-option__check">✓</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
