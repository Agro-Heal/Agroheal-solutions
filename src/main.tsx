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
import DashboardError from "./page/error/DashboardError";
import RequireSubscription from "./page/website/dashboard/RequireSubscription";
import Subscribe from "./page/website/dashboard/Subscribe";

// route setup for website and dashboard
// const route = createBrowserRouter([
//   {
//     path: "/",
//     element: <Layout />,
//     errorElement: <Error />,
//     children: [
//       { index: true, element: <Home /> },
//       { path: "/about", element: <About /> },
//       { path: "/login", element: <Login /> },
//       { path: "/signup", element: <Signup /> },
//     ],
//   },

//   // protected routes
//   {
//     path: "/dashboard",
//     element: (
//       <ProtectedRoute>
//         <DashboardLayout />
//         {/* <RequireSubscription>
//         </RequireSubscription> */}
//       </ProtectedRoute>
//     ),
//     errorElement: <DashboardError />,
//     children: [
//       { index: true, element: <Dashboard /> },
//       { path: "/dashboard/slots", element: <Slots /> },
//       { path: "/dashboard/checkout", element: <Checkout /> },
//       { path: "/dashboard/subscribe", element: <Subscribe /> },
//       {
//         path: "/dashboard/courses",
//         element: <Courses />,
//       },
//       { path: "/dashboard/courses/:slug", element: <SingleCoursePage /> },
//     ],
//   },
// ]);

const route = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },

  // Only login protection
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/subscribe", element: <Subscribe /> },

      // subscription protected area
      {
        path: "/dashboard",
        element: (
          <RequireSubscription>
            <DashboardLayout />
          </RequireSubscription>
        ),
        errorElement: <DashboardError />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "slots", element: <Slots /> },
          { path: "checkout", element: <Checkout /> },
          { path: "courses", element: <Courses /> },
          { path: "courses/:slug", element: <SingleCoursePage /> },
        ],
      },
    ],
  },
]);

// RouterProvider setup
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={route} />
  </StrictMode>,
);
