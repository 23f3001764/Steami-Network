import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ExplainerPage from "./pages/ExplainerPage";
import ExplorePage from "./pages/ExplorePage";
import ResearchPage from "./pages/ResearchPage";
import DashboardPage from "./pages/DashboardPage";
import SimulationsPage from "./pages/SimulationsPage";
import NotFound from "./pages/NotFound";
import BlogArticlePage from "./pages/BlogArticlePage";
import BlogListingPage from "./pages/BlogListingPage";
import AdminPage from "./pages/AdminPage";
import ModerationPage from "./pages/ModerationPage";
import ApiConsolePage from "./pages/ApiConsolePage";
import ChatPage from "./pages/ChatPage";
import InterestsPage from "./pages/InterestsPage";
import ProfilePage from "./pages/ProfilePage";
import InsightsPage from "./pages/InsightsPage";
import { CursorEffect } from "@/components/CursorEffect";

const queryClient = new QueryClient();

const pageTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition} style={{ minHeight: '100vh' }}>
        <Routes location={location}>
          <Route path="/" element={<ExplainerPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/blog" element={<BlogListingPage />} />
          <Route path="/blog/:id" element={<BlogArticlePage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/interests" element={<InterestsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/moderation" element={<ModerationPage />} />
          <Route path="/api-console" element={<ApiConsolePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CursorEffect />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
