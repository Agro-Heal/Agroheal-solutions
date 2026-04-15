import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect } from "react";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

const Layout = () => {
  // hiden header and footer logic on some paths
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const normalizedPath = normalizePath(pathname);

  useEffect(() => {
    if (pathname !== normalizedPath) {
      navigate(normalizedPath, { replace: true });
    }
  }, [pathname, normalizedPath, navigate]);

  const HIDDENROURES = [
    "/login",
    "/signup",
<<<<<<< HEAD
    "/verify-account",
=======
>>>>>>> cdf63437e8d4b850a9e048146d4328d841e723a5
    "/forgot-password",
    "/reset-password",
  ];

  const hiddenPath = HIDDENROURES.includes(normalizedPath);

  return (
    <>
      {!hiddenPath && <Header />}
      <Outlet />
      {!hiddenPath && <Footer />}
    </>
  );
};

export default Layout;
