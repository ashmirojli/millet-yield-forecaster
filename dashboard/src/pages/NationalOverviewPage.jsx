import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Dropdown from '../components/Dropdown'
import './NationalOverviewPage.css'

// dataset bounds: df_final.csv covers 1993–2019 (Kharif season, pearl millet)
const MIN_YEAR = 1993
const MAX_YEAR = 2019

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function NationalOverviewPage() {
  const [fromYear, setFromYear] = useState(MIN_YEAR)
  const [toYear,   setToYear]   = useState(MAX_YEAR)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/national`)
      .then(res  => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(err => { console.error("Failed to fetch national data", err); setLoading(false) })
  }, [])  // empty dependency array so as to fetch once on mount and never re-fetch

  const lineData = data?.yearly_trend
    ? data.yearly_trend.filter(d => d.year >= fromYear && d.year <= toYear)  // filtered client-side so as to avoid a new API call every time the dropdowns change
    : []

  const barData = data?.state_comparison
    ? data.state_comparison.slice(0, 15)  // top 15 only so as to keep the bar chart readable without crowding the x-axis
    : []

  return (
    <>
      <Navbar />
      <main className="nat-page">

        <div className="nat-page__header-bar container">
          <Link to="/" className="nat-page__back" aria-label="Back to home">
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <h1 className="nat-page__title">National Overview</h1>
        </div>

        <div className="nat-page__content container">

          <section className="nat-page__filters" aria-label="Year range filter">
            <Dropdown
              id="from-year-dropdown"
              label="From"
              options={Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => String(MIN_YEAR + i))}  // array is generated dynamically so as to always stay in sync with the dataset bounds
              value={String(fromYear)}
              placeholder="From year"
              onChange={val => setFromYear(Number(val))}
            />
            <span className="nat-filter__sep">—</span>
            <Dropdown
              id="to-year-dropdown"
              label="To"
              options={Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => String(MIN_YEAR + i))}
              value={String(toYear)}
              placeholder="To year"
              onChange={val => setToYear(Number(val))}
            />
          </section>

          {/* National yield trend line chart */}
          <section className="nat-page__chart-section textured" aria-label="National yield trend chart">
            <div className="nat-chart__header">
              <div>
                <h2 className="nat-chart__title">Pearl Millet Yield Trend</h2>
                <p className="nat-chart__sub">National average · Kharif season · {fromYear}–{toYear}</p>
              </div>
            </div>
            <div style={{ height: '400px', width: '100%' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} size={32} />
                  <p>Loading national trend...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d5" vertical={false} />  {/* vertical gridlines are hidden so as to reduce visual noise and keep focus on the trend */}
                    <XAxis dataKey="year" tick={{ fill: '#8b9d83', fontSize: 12 }} axisLine={{ stroke: '#d9e2d5' }} tickLine={false} />
                    <YAxis tick={{ fill: '#8b9d83', fontSize: 12 }} axisLine={{ stroke: '#d9e2d5' }} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #d9e2d5', backgroundColor: '#fff' }}
                      formatter={(value) => [`${Math.round(value)} kg/ha`, 'Yield']}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Line type="monotone" dataKey="yield_kg_ha" stroke="#66825d" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Average yield by state bar chart */}
          <section className="nat-page__chart-section textured" aria-label="Average yield by state">
            <div className="nat-chart__header">
              <div>
                <h2 className="nat-chart__title">Average Yield by State</h2>
                <p className="nat-chart__sub">kg / hectare · Ranked (Top 15)</p>
              </div>
            </div>
            <div style={{ height: '400px', width: '100%' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} size={32} />
                  <p>Loading state rankings...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d5" vertical={false} />
                    <XAxis dataKey="state_name" angle={-45} textAnchor="end" tick={{ fill: '#8b9d83', fontSize: 12 }} axisLine={{ stroke: '#d9e2d5' }} tickLine={false} />  {/* angle is set to -45 so as to prevent long state names from overlapping each other */}
                    <YAxis tick={{ fill: '#8b9d83', fontSize: 12 }} axisLine={{ stroke: '#d9e2d5' }} tickLine={false} />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(215, 206, 147, 0.2)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #d9e2d5' }}
                      formatter={(value) => [`${Math.round(value)} kg/ha`, 'Yield']}
                    />
                    <Bar dataKey="yield_kg_ha" fill="#66825d" radius={[4, 4, 0, 0]} />  {/* top radius only so as to give bars a pill-like top edge without affecting the flat base */}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
