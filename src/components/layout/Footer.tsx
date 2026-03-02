import { Link } from "react-router-dom";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  platform: [
    { name: "Courses", href: "/dashboard/courses" },
    { name: "Farm Slots", href: "/dashboard/slots" },
    { name: "Affiliate Program", href: "/dashboard" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    // { name: "Blog", href: "/blog" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/legal" },
    { name: "Terms of Service", href: "/legal" },
    { name: "Cookie Policy", href: "/legal" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className=" text-xl font-semibold text-foreground">
                Agroheal
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Empowering a generation of organic farmers through education,
              practice, and community.
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a
                  href="mailto:admin@agroheal.solutions"
                  className="cursor-pointer"
                >
                  <span>admin@agroheal.solutions</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+2349168055000" className="cursor-pointer">
                  <span>+234 916 8055 000</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <a href="https://www.google.com/maps/place/Olowe+Farm/@6.8138766,3.9178944,17z/data=!3m1!4b1!4m6!3m5!1s0x103969e8661c18e5:0x7906309f84337a84!8m2!3d6.8138713!4d3.9204693!16s%2Fg%2F11jjm31nr8!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoASAFQAw%3D%3D">
                  <span>
                    1 Olowu Street, Owu, Ijebu-Ode, Ogun State, Nigeria
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className=" font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className=" font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className=" font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} AgroHeal Solutions Ltd., duly
            incorporated with Nigeria’s Corporate Affairs Commission (RC
            8231879).
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Instagram
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
