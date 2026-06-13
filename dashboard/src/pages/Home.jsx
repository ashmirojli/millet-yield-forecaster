/*
  pages/Home.jsx — Main landing page
  Tab buttons now navigate to /national and /district (full pages)
*/
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ExplorerNav from '../components/ExplorerNav'
import AboutLink from '../components/AboutLink'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ExplorerNav />
        <AboutLink />
      </main>
      <Footer />
    </>
  )
}
