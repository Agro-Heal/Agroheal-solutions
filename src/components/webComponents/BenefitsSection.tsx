import { motion } from "framer-motion";
import { Leaf, TrendingUp, Users, Shield, Clock, Award } from "lucide-react";
import { SectionDivider } from "../webComponents/SectionDivider";
import { SectionHeading } from "../webComponents/SectionHeading";
import { AgrohealImages } from "@/constant/Image";

const benefits = [
  {
    icon: Leaf,
    title: "Join the platform (₦1,000 yearly)",
    description:
      "Start with a yearly subscription fee of ₦1,000 yearly. This gives you access to all our training courses, from composting to crop management — so you understand the basics before stepping onto the farm.",
  },
  {
    icon: TrendingUp,
    title: "Secure Your Farm Slot (₦2,000 per slot admin fee)",
    description:
      "Each group farm is one hectare, divided into 1000 slots. Secure one slot with a one-time  N2,000 admin fee. Once you secure your space, you’re officially part of a group farm. Group practicals are scheduled to begin once the slots are filled up.",
  },
  {
    icon: Users,
    title: "Keep Your Slot Active (₦500 monthly per slot)",
    description:
      "Just like maintaining a house, farmland has monthly utilities. The monthly fee covers your farmland rent, agronomy fee and Agroheal oversight.",
  },
  {
    icon: Shield,
    title:
      "Build the Farm Together (₦5,000 monthly for first 5 months/per slot)",
    description:
      "For the farm to start producing, everyone chips in equally to cover setup costs — tools, seeds, land/soil prep, irrigation, and more. This contribution is only for the first five months and is managed openly by the group so every naira is accounted for.",
  },
  {
    icon: Clock,
    title: " Your Monthly work rotation (1 day per month)",
    description:
      "Farming here doesn’t take over your life. You only need to show up one day a month to perform tasks like planting, weeding, nurturing livestock & harvesting. If you can’t make it, there’s a ₦500 charge (per slot) to pay a substitute to do the work.",
  },
  {
    icon: Award,
    title: "Harvest & Share the Profits (up to 100% returns every six months)",
    description:
      "When crops/livestock are harvested, they are sold directly to homes to maximize profits while giving better value to consumers. With low-cost organic inputs produced right on the farm, profitability is higher - such that each farm slot can return up to 100% returns every six months (after full organic integration of crops & livestock).",
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
          title="How LEAP works"
          // description="Discover why thousands are choosing organic farming as their path to financial freedom and environmental stewardship."
          description=""
          className="mb-16"
        />

        {/* <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"> */}
        <div className="grid  md:grid-cols-2 gap-6 lg:gap-8">
          <div className="grid grid-cols-1 gap-10">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                className="group"
              >
                <div className="relative  rounded-3xl p-7 shadow-soft transition-all duration-300 h-full border border-border/60  motion-reduce:transition-none motion-reduce:hover:transform-none">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none"
                  />

                  {/* <div className="relative w-12 h-12 rounded-2xl border border-primary/15 bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors motion-reduce:transition-none">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div> */}
                  <h3 className=" text-[18px] font-normal text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-green-800 text-[14px] sm:text-[14px] md:text-[16pxs] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-10">
            <img
              src={AgrohealImages?.HowItWorksOne}
              alt="about-1"
              className="rounded-xl"
            />
            <img
              src={AgrohealImages?.HowItWorksTwo}
              alt="about-2"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
