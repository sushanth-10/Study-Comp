import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AdaptiveQuiz from "./pages/AdaptiveQuiz";
import Flashcards from "./pages/Flashcards";
import PomodoroTimer from "./pages/PomodoroTimer";
import Analytics from "./pages/Analytics";
import StudyPlanner from "./pages/StudyPlanner";
import MoodTracker from "./pages/MoodTracker";
import FocusMode from "./pages/FocusMode";
import NoteTaking from "./pages/NoteTaking";
import StudyStreak from "./pages/StudyStreak";
import ConceptMapper from "./pages/ConceptMapper";
import ResourceLibrary from "./pages/ResourceLibrary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "quiz", Component: AdaptiveQuiz },
      { path: "flashcards", Component: Flashcards },
      { path: "timer", Component: PomodoroTimer },
      { path: "analytics", Component: Analytics },
      { path: "planner", Component: StudyPlanner },
      { path: "mood", Component: MoodTracker },
      { path: "focus", Component: FocusMode },
      { path: "notes", Component: NoteTaking },
      { path: "streak", Component: StudyStreak },
      { path: "concepts", Component: ConceptMapper },
      { path: "resources", Component: ResourceLibrary },
    ],
  },
]);
