import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import OfferBanner from "./components/OfferBanner";
import FeatureGrid from "./components/FeatureGrid";
import AboutSection from "./components/AboutSection";
import EventSection from "./components/EventSection";
import RecommendedSection from "./components/RecommendedSection";
import ExperienceSection from "./components/ExperienceSection";
import Footer from "./components/Footer";
import "./App.css";

function MainPage() {
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <OfferBanner />
      <FeatureGrid />
      <AboutSection />
      <EventSection />
      <RecommendedSection />
      <ExperienceSection />
      <Footer />
    </div>
  );
}

export default MainPage;
