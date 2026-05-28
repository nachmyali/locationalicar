import TopBar from './sections/TopBar';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import CarRentals from './sections/CarRentals';
import Gallery from './sections/Gallery';

import FAQ from './sections/FAQ';
import Footer from './sections/Footer';
import PwaInstallBanner from './components/PwaInstallBanner';
import { CurrencyProvider } from './lib/currency';
import './i18n';

function App() {
  return (
    <CurrencyProvider>
      <div className="min-h-screen font-inter overflow-x-hidden">
        <TopBar />
        <Navbar />
        <Hero />
        <About />
        <CarRentals />
        <Gallery />

        <FAQ />
        <Footer />
        <PwaInstallBanner />
      </div>
    </CurrencyProvider>
  );
}

export default App;
