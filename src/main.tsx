import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// pages imports for routes
import Home from "./page/website/Home";
import Layout from "./components/layout/Layout";
import Error from "./page/error/Error";
import About from "./page/website/About";
import Login from "./page/website/Login";
import Signup from "./page/website/Signup";
import Slots from "./page/website/Slots";
import Courses from "./page/website/Courses";
import Dashboard from "./page/dashboard/Dashboard";

// route setup for website and dashboard
const route = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/about", element: <About /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/slots", element: <Slots /> },
      { path: "/courses", element: <Courses /> },
      { path: "/dashboard", element: <Dashboard /> },
    ],
  },
]);

// RouterProvider setup
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={route} />
  </StrictMode>,
);
