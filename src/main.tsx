import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// pages imports for routes
import Home from "./page/website/Home";
import Layout from "./components/layout/Layout";
import Error from "./page/error/Error";
import About from "./page/website/About";
import Login from "./page/website/Login";
import Signup from "./page/website/Signup";
import Slots from "./page/website/Slots/Slots";
import Courses from "./page/website/Courses/Courses";
import Dashboard from "./page/website/dashboard/Dashboard";
import SingleCoursePage from "./page/website/Courses/CoursesDetails";
import ProtectedRoute from "./routes/ProtectedRoutes";
import DashboardLayout from "./components/layout/DashboardLayout";
import Checkout from "./page/website/Slots/Checkout";

// route setup for website and dashboard
const route = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
    ],
  },

  // protected routes
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <Error />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "/dashboard/slots", element: <Slots /> },
      { path: "/dashboard/checkout", element: <Checkout /> },
      {
        path: "/dashboard/courses",
        element: <Courses />,
      },
      { path: "/dashboard/courses/:slug", element: <SingleCoursePage /> },
    ],
  },
]);

// RouterProvider setup
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={route} />
  </StrictMode>,
);
