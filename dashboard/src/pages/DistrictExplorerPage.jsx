import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronUp, ChevronDown, Info, Loader2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Dropdown from '../components/Dropdown'
import './DistrictExplorerPage.css'



const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function DistrictExplorerPage() {
  const [selectedState,    setSelectedState]    = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [predExpanded,     setPredExpanded]      = useState(false)
  const [hoveredMetric,    setHoveredMetric]     = useState(null)

  const [districtData, setDistrictData] = useState(null)
  const [predictData, setPredictData] = useState(null)
  const [shapData, setShapData] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [locations, setLocations] = useState({})

  const hasSelection = selectedState && selectedDistrict
  const districts = selectedState && locations[selectedState] ? locations[selectedState] : []

  useEffect(() => {
    fetch(`${API_BASE_URL}/locations`)
      .then(r => r.json())
      .then(data => setLocations(data))  // stored in state so as to dynamically populate the state and district dropdowns from the live dataset
      .catch(err => console.error("Failed to fetch locations", err))
  }, [])

  useEffect(() => {
    if (!selectedState || !selectedDistrict) return
    setLoadingData(true)
    Promise.all([  // all three requests are fired in parallel so as to minimise total wait time rather than chaining them sequentially
      fetch(`${API_BASE_URL}/district/${selectedState}/${selectedDistrict}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/predict/${selectedState}/${selectedDistrict}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/shap/${selectedState}/${selectedDistrict}`).then(r => r.json())
    ]).then(([dist, pred, shap]) => {
      setDistrictData(dist)
      setPredictData(pred)
      setShapData(shap)
      setLoadingData(false)
    }).catch(err => {
      console.error(err)
      setLoadingData(false)
    })
  }, [selectedState, selectedDistrict])

  // Calculate dynamic metrics
  let avgYield = '—'
  let bestYear = '—'
  let yoyChange = '—'
  if (districtData && districtData.length > 0) {
    const yields = districtData.map(d => d.yield_kg_ha).filter(y => y !== null)
    if (yields.length > 0) {
      avgYield = (yields.reduce((a, b) => a + b, 0) / yields.length).toFixed(0)
      const maxYield = Math.max(...yields)
      const bestRecord = districtData.find(d => d.yield_kg_ha === maxYield)
      if (bestRecord) bestYear = bestRecord.year
    }
    let yoySum = 0; let yoyCount = 0;
    for (let i = 1; i < districtData.length; i++) {
        if (districtData[i].yield_kg_ha && districtData[i-1].yield_kg_ha) {
            yoySum += ((districtData[i].yield_kg_ha - districtData[i-1].yield_kg_ha) / districtData[i-1].yield_kg_ha) * 100
            yoyCount++
        }
    }
    if (yoyCount > 0) yoyChange = (yoySum / yoyCount).toFixed(1)
  }

  const dynamicMetrics = [
    { id: 'avg-yield', label: 'Average Yield', value: avgYield, unit: 'kg/ha', tooltip: 'Mean pearl millet yield across all recorded kharif seasons.' },
    { id: 'best-year', label: 'Best Year', value: bestYear, unit: '', tooltip: 'The kharif season year in which this district recorded its highest yield.' },
    { id: 'yoy-change', label: 'YoY Change', value: yoyChange, unit: '%', tooltip: 'Average year-over-year percentage change in yield.' },
  ]

  // Prepare timeseries chart data
  const lineData = districtData || []

  // Prepare SHAP chart data — top 10 features sorted ascending for horizontal bar chart
  const shapChartData = shapData?.features ? shapData.features.map(f => ({
    feature: f.feature,
    impact: f.absolute_impact
  })).sort((a, b) => a.impact - b.impact).slice(-10) : []

  return (
    <>
      <Navbar />
      <main className="dist-page">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="dist-page__header container">
          <Link to="/" className="dist-page__back" aria-label="Back to home">
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div className="dist-page__heading-group">
            <h1 className="dist-page__title">District Explorer</h1>
            <p className="dist-page__tagline">
              Thirty years of pearl millet — one district at a time.
            </p>
          </div>
        </div>

        <div className="dist-page__content container">

          {/* ── Dropdowns ────────────────────────────────── */}
          <section className="dist-page__dropdowns" aria-label="Select state and district">
            <Dropdown
              id="state-dropdown"
              label="State"
              options={Object.keys(locations).sort()}
              value={selectedState}
              placeholder="Select a state…"
              onChange={val => {
                setSelectedState(val)
                setSelectedDistrict('')
              }}
            />
            <Dropdown
              id="district-dropdown"
              label="District"
              options={districts}
              value={selectedDistrict}
              placeholder={selectedState ? 'Select a district…' : 'Select a state first'}
              onChange={setSelectedDistrict}
              disabled={!selectedState}
            />
          </section>

          {/* ── Content: only shown after selection ──────── */}
          {hasSelection && (
            <>
              {/* Yield history chart */}
              <section className="dist-page__chart-section textured" aria-label="District yield history">
                <div className="dist-chart__header">
                  <h2 className="dist-chart__title">
                    Yield History — {selectedDistrict}, {selectedState}
                  </h2>
                  <p className="dist-chart__sub">Pearl millet · Kharif season</p>
                </div>
                <div style={{ height: '400px', width: '100%' }}>
                  {loadingData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} size={32} />
                      <p>Loading district data...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d5" vertical={false} />
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

              {/* Organic metric boxes */}
              <section className="dist-page__metrics" aria-label="Key metrics">
                {dynamicMetrics.map(metric => (
                  <div
                    key={metric.id}
                    id={`metric-${metric.id}`}
                    className="dist-metric textured"
                    onMouseEnter={() => setHoveredMetric(metric.id)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="dist-metric__top">
                      <span className="dist-metric__label">{metric.label}</span>
                      <Info size={14} className="dist-metric__info-icon" />
                    </div>
                    <div className="dist-metric__value-row">
                      <span className="dist-metric__value">{metric.value}</span>
                      {metric.unit && <span className="dist-metric__unit">{metric.unit}</span>}
                    </div>
                    {/* Hover tooltip */}
                    {hoveredMetric === metric.id && (
                      <div className="dist-metric__tooltip" role="tooltip">
                        {metric.tooltip}
                      </div>
                    )}
                  </div>
                ))}
              </section>

              {/* Prediction expand section */}
              <section className="dist-page__prediction" aria-label="Model prediction">
                <button
                  className="dist-pred__trigger"
                  id="prediction-expand-btn"
                  onClick={() => setPredExpanded(p => !p)}
                  aria-expanded={predExpanded}
                >
                  <div className="dist-pred__trigger-left">
                    <span className="dist-pred__trigger-label">Model Prediction</span>
                    <span className="dist-pred__trigger-hint">
                      {predExpanded ? 'Click to collapse' : 'Click to see predicted vs actual yield'}
                    </span>
                  </div>
                  {predExpanded
                    ? <ChevronUp size={20} strokeWidth={1.8} />
                    : <ChevronDown size={20} strokeWidth={1.8} />
                  }
                </button>

                {predExpanded && (
                  <div className="dist-pred__panel textured">
                    {loadingData || !predictData ? (
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0' }}>
                         <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} size={32} />
                         <p>Loading ML prediction...</p>
                       </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch', gap: '1rem', marginBottom: '2rem', position: 'relative' }}>
                          
                          {/* Actual Yield Box */}
                          <div style={{ flex: 1, padding: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.6)', border: '1px solid #d9e2d5', borderRadius: '12px' }}>
                            <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 500, color: '#66825d', margin: '0 0 0.5rem 0' }}>Actual 2019 Yield</p>
                            <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
                              {predictData.actual_yield.toFixed(0)} <span style={{ fontSize: '1.125rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>kg/ha</span>
                            </p>
                          </div>
                          
                          {/* VS Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, margin: '0 -1.5rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', backgroundColor: '#fff', border: '2px solid #e8ede6', color: '#8b9d83', borderRadius: '50%' }}>
                              VS
                            </div>
                          </div>
                          
                          {/* Predicted Yield Box */}
                          <div style={{ flex: 1, padding: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(84, 110, 76, 0.05)', border: '1px solid #8b9d83', borderRadius: '12px' }}>
                            <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 500, color: '#546e4c', margin: '0 0 0.5rem 0' }}>XGBoost Prediction</p>
                            <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#546e4c', margin: 0 }}>
                              {predictData.predicted_yield.toFixed(0)} <span style={{ fontSize: '1.125rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>kg/ha</span>
                            </p>
                          </div>
                          
                        </div>
                        
                        {/* SHAP Explainability Section */}
                        <div style={{ width: '100%' }}>
                          <h4 style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>SHAP Explainability</h4>
                          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', margin: '0 0 1.5rem 0' }}>Key factors driving this specific XGBoost model prediction</p>
                          
                          <div style={{ height: '360px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart layout="vertical" data={shapChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d5" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#8b9d83', fontSize: 12 }} axisLine={{ stroke: '#d9e2d5' }} tickLine={false} />
                                <YAxis dataKey="feature" type="category" tick={{ fill: '#1a1f18', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#d9e2d5' }} tickLine={false} width={150} />
                                <RechartsTooltip 
                                  cursor={{ fill: 'rgba(215, 206, 147, 0.2)' }} 
                                  contentStyle={{ borderRadius: '8px', border: '1px solid #d9e2d5' }}
                                  formatter={(value) => [value.toFixed(2), 'Impact']}
                                />
                                <Bar dataKey="impact" fill="#8b9d83" radius={[0, 4, 4, 0]} barSize={20} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Chatbot Helper Text */}
                          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #d9e2d5', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: '#66825d', margin: 0 }}>
                              For a more comprehensive analysis of these factors, ask our Chatbot!
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
