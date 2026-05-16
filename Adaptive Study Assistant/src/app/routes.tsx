import { createBrowserRouter, Navigate } from "react-router";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import AdaptiveQuiz from "./pages/AdaptiveQuiz";
import FocusSession from "./pages/FocusSession";
import Analytics from "./pages/Analytics";
import StudyPlanner from "./pages/StudyPlanner";
import MoodTracker from "./pages/MoodTracker";
import NoteTaking from "./pages/NoteTaking";
import StudyStreak from "./pages/StudyStreak";
import ConceptMapper from "./pages/ConceptMapper";
import ResourceLibrary from "./pages/ResourceLibrary";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  { path: "/forgot-password", Component: ForgotPassword },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "quiz", Component: AdaptiveQuiz },
          { path: "focus", Component: FocusSession },
          { path: "timer", element: <Navigate to="/focus" replace /> },
          { path: "analytics", Component: Analytics },
          { path: "planner", Component: StudyPlanner },
          { path: "mood", Component: MoodTracker },
          { path: "notes", Component: NoteTaking },
          { path: "streak", Component: StudyStreak },
          { path: "concepts", Component: ConceptMapper },
          { path: "resources", Component: ResourceLibrary },
          { path: "flashcards", element: <Navigate to="/quiz" replace /> },
        ],
      },
    ],
  },
]);
