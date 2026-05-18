import TopBar from './sections/TopBar';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import CarRentals from './sections/CarRentals';
import Gallery from './sections/Gallery';

import Features from './sections/Features';
import Partners from './sections/Partners';
import FAQ from './sections/FAQ';
import Footer from './sections/Footer';

function App() {
  return (
    <div className="min-h-screen font-inter">
      <TopBar />
      <Navbar />
      <Hero />
      <About />
      <CarRentals />
      <Gallery />

      <Features />
      <Partners />
      <FAQ />
      <Footer />
    </div>
  );
}

export default App;
