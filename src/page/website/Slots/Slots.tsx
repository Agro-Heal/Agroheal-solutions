import { motion } from "framer-motion";
import { MapPin, Calendar, Users, CheckCircle, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Slots = () => {
  const availableSlots = 23;
  const totalSlots = 50;
  const slotPrice = "₦2,000";

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="text-[#d17547] font-semibold text-sm uppercase tracking-wider">
              Hands-On Experience
            </span>
            <h1 className=" text-4xl md:text-5xl font-bold text-foreground mt-4">
              Secure Your Farm Slot for Practicals
            </h1>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Put your knowledge of organic farming into practice. Limited slots
              available
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Slot Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-card rounded-2xl overflow-hidden shadow-elevated border border-border/50">
                {/* Header */}
                <div className="bg-gradient-hero p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-800/20 flex items-center justify-center mx-auto mb-4">
                    <Sprout className="w-8 h-8 text-green-800" />
                  </div>
                  <h2 className=" text-2xl font-bold text-primary-foreground">
                    Practical Farm Slot
                  </h2>
                  <p className="text-primary-foreground/80 mt-2">
                    Access for two growing seasons (12 months)
                  </p>
                </div>

                {/* Price */}
                <div className="p-8 text-center border-b border-border">
                  <div className=" text-4xl font-bold text-foreground">
                    {slotPrice}
                  </div>
                  <p className="text-muted-foreground mt-1">per slot</p>
                </div>

                {/* Features */}
                <div className="p-8 space-y-4">
                  {[
                    " Shared access to an hectare farm",
                    "Expert guidance throughout the season",
                    "Onsite production of organic inputs",
                    "WhatsApp group coordination",
                    "Share in harvest proceeds",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-800 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="p-8 pt-0">
                  <Link to="/dashboard/checkout">
                    <Button
                      className="w-full bg-[#d17547] text-white hover:bg-[#d17547]/80"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Secure My Slot
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Info Panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Availability */}
              <div className="hidden bg-muted/50 rounded-xl p-6 border border-border/50">
                <h3 className=" text-lg font-semibold text-foreground mb-4">
                  Slot Availability
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-semibold text-foreground">
                      {availableSlots} of {totalSlots} slots
                    </span>
                  </div>
                  <div className="h-3 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-cta rounded-full transition-all duration-500"
                      style={{
                        width: `${((totalSlots - availableSlots) / totalSlots) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Slots are filling fast! Secure yours before they're gone.
                </p>
              </div>

              {/* Details */}
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-800/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-800" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Location</h4>
                    <p className="text-green-800 text-sm">
                      Slots are assigned based on availability. Farm locations
                      will be confirmed after booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-800/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-green-800" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Season</h4>
                    <p className="text-green-800 text-sm">
                      Current season runs from March to September 2026. Next
                      season bookings open soon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-800/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-800" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Group Coordination
                    </h4>
                    <p className="text-green-800 text-sm">
                      After booking, you'll be added to a WhatsApp group for
                      real-time coordination and support.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50">
                <h3 className=" text-lg font-semibold text-foreground mb-4">
                  Have Questions?
                </h3>
                <p className="text-green-800 text-sm mb-4">
                  Learn more about our practical learning program and what to
                  expect during your farm season.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/dashboard/legal">View FAQ</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Slots;
