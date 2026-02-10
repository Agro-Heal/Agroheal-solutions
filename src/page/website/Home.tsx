import { HeroSection } from "../../components/webComponents/HeroSection";
import { HowItWorksSection } from "../../components/webComponents/HowItWorksSection";
import { BenefitsSection } from "../../components/webComponents/BenefitsSection";
// import { FeaturedCoursesSection } from "../../components/webComponents/FeaturedSection";
import { TestimonialsSection } from "../../components/webComponents/TestimonialSection";
import { FAQSection } from "../../components/webComponents/FaqSection";
import { CTASection } from "../../components/webComponents/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <HowItWorksSection />
        {/* <FeaturedCoursesSection /> */}
        <BenefitsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
    </div>
  );
};

export default Index;
