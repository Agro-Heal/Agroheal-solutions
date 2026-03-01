import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sprout,
  CreditCard,
  ScrollText,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Courses", path: "/dashboard/courses", icon: ScrollText },
  { label: "Secure Practice Slot", path: "/dashboard/slots", icon: Sprout },
  {
    label: "Slot Management",
    path: "/dashboard/slots-subscription",
    icon: CreditCard,
  },
  { label: "Legal Agreement", path: "/dashboard/legal", icon: ScrollText },
];

const HIDDEN_ROUTES = ["/login", "/signup"];

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const normalizedPath = normalizePath(pathname);

  useEffect(() => {
    if (pathname !== normalizedPath) {
      navigate(normalizedPath, { replace: true });
    }
  }, [pathname, normalizedPath, navigate]);

  // Close sidebar on route change
  useEffect(() => {
    const timer = setTimeout(() => setSidebarOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const hiddenPath = HIDDEN_ROUTES.includes(normalizedPath);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (hiddenPath) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-full w-64 bg-green-800 z-40 flex flex-col shadow-2xl"
          >
            {/* Logo */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-green-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Agroheal</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-green-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              {navItems.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? "bg-white text-green-800"
                        : "text-green-100 hover:bg-green-700 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{label}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-green-600" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-green-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-green-100 hover:bg-red-500/20 hover:text-red-200 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 z-20 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title */}
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900 capitalize">
              {navItems.find((item) =>
                item.path === "/dashboard"
                  ? normalizedPath === "/dashboard"
                  : normalizedPath.startsWith(item.path),
              )?.label ?? "Dashboard"}
            </h1>
          </div>

          {/* Logo on mobile top bar */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-800 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-green-800 font-bold text-sm hidden sm:block">
              Agroheal
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
