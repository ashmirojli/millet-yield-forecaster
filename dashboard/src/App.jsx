/*
  App.jsx — Updated routing
  Added /national and /district as full page routes
*/
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import NationalOverviewPage from './pages/NationalOverviewPage'
import DistrictExplorerPage from './pages/DistrictExplorerPage'
import ChatPanel from './components/ChatPanel'
import './index.css'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/about"     element={<About />} />
        <Route path="/national"  element={<NationalOverviewPage />} />
        <Route path="/district"  element={<DistrictExplorerPage />} />
      </Routes>
      <ChatPanel />
    </BrowserRouter>
  )
}

export default App
