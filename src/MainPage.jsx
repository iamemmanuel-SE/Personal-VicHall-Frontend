import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  useEffect(() => {
    // If we navigated here with intent to scroll
    if (location.state?.scrollToAbout) {
      // Wait for DOM/layout to paint
      requestAnimationFrame(() => {
        const el = document.getElementById("about-us");
        el?.scrollIntoView({ behavior: "smooth" });
      });

      // Optional: clear the state so refreshing doesn't re-scroll
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
//MAIN