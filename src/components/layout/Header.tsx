import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Courses", href: "/dashboard/courses" },
  { name: "Farm Slots", href: "/dashboard/slots" },
  { name: "About", href: "/about" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navClassName = useMemo(
    () =>
      [
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-colors duration-300",
        isScrolled
          ? "bg-background border-b border-border"
          : "bg-background border-b border-transparent",
      ].join(" "),
    [isScrolled],
  );

  function handleLogout() {
    localStorage.clear();
    window.location.reload();
  }

  return (
    <nav className={navClassName}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className=" text-xl font-semibold text-foreground">
              Agroheal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="relative group px-3 py-2 -mx-3 rounded-full text-green-800/80 hover:text-green-800 font-medium transition-colors motion-reduce:transition-none"
              >
                {/* Cinematic hover pill */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full bg-accent/20 border border-border/50 opacity-0 scale-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 motion-reduce:transition-none motion-reduce:transform-none"
                />
                <span className="inline-flex items-center gap-2">
                  {link.name}
                  {link.href === "/courses" && (
                    <span className="inline-flex items-center rounded-full bg-[#e8b130]/20 border border-[#e8b130]/30 px-2 py-0.5 text-xs font-semibold text-[#e8b130]">
                      Start here
                    </span>
                  )}
                </span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full motion-reduce:transition-none" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          {localStorage.getItem("sb-ptowfacejneezksyhntk-auth-token") ? (
            <div className="hidden lg:flex items-center gap-4">
              <Button className="bg-green-800 text-white">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                className="bg-green-800 text-white"
                onClick={handleLogout}
              >
                <Link to="">Logout</Link>
              </Button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4">
              <Button className="bg-green-800 text-white">
                <Link to="/dashboard">Login</Link>
              </Button>
              <Button className="bg-green-800 text-white">
                <Link to="/dashboard/courses">Explore Courses</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block py-2 text-foreground/90 font-medium hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                {localStorage.getItem("sb-ptowfacejneezksyhntk-auth-token") ? (
                  <div className="pt-4 flex flex-col gap-3">
                    <Button className="bg-green-800 text-white">
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                    <Button
                      className="bg-green-800 text-white"
                      onClick={handleLogout}
                    >
                      <Link to="">Logout</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 flex flex-col gap-3">
                    <Button className="bg-green-800 text-white">
                      <Link to="/dashboard">Login</Link>
                    </Button>
                    <Button className="bg-green-800 text-white">
                      <Link to="/dashboard/courses">Explore Courses</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
