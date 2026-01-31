import { motion } from "framer-motion";
import { Leaf, TrendingUp, Users, Shield, Clock, Award } from "lucide-react";
import { SectionDivider } from "../webComponents/SectionDivider";
import { SectionHeading } from "../webComponents/SectionHeading";

const benefits = [
  {
    icon: Leaf,
    title: "Sustainable Practices",
    description:
      "Learn eco-friendly farming methods that protect the environment while maximizing yield.",
  },
  {
    icon: TrendingUp,
    title: "Real Income Potential",
    description:
      "Generate sustainable income through harvest sales and our affiliate program.",
  },
  {
    icon: Users,
    title: "Community Support",
    description:
      "Join a thriving community of like-minded farmers and get help when you need it.",
  },
  {
    icon: Shield,
    title: "Expert Guidance",
    description:
      "Learn from experienced organic farmers who have mastered sustainable agriculture.",
  },
  {
    icon: Clock,
    title: "Flexible Learning",
    description:
      "Access courses anytime, anywhere. Learn at your own pace with lifetime access.",
  },
  {
    icon: Award,
    title: "Hands-On Experience",
    description:
      "Apply your knowledge on real farm slots with dedicated support and resources.",
  },
];

export function BenefitsSection() {
  return (
    <section className="relative py-24 bg-muted/30 overflow-hidden">
      <SectionDivider position="top" className="text-background" />
      <SectionDivider position="bottom" className="text-background" />
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Why Choose Agroheal"
          title="Benefits of Organic Farming"
          description="Discover why thousands are choosing organic farming as their path to financial freedom and environmental stewardship."
          className="mb-16"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
              className="group"
            >
              <div className="relative bg-card/70 backdrop-blur-sm rounded-3xl p-7 shadow-soft transition-all duration-300 h-full border border-border/60 hover:bg-[#e8b130]/5 hover:border-primary/20 hover:shadow-elevated hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none">
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none"
                />

                <div className="relative w-12 h-12 rounded-2xl border border-primary/15 bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors motion-reduce:transition-none">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className=" text-xl font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-green-800 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
