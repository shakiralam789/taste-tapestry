import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishbookProvider } from "@/contexts/WishbookContext";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import MoodPage from "./pages/MoodPage";
import CapsulesPage from "./pages/CapsulesPage";
import MatchesPage from "./pages/MatchesPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import MessagesPage from "./pages/MessagesPage";
import AddFavoritePage from "./pages/AddFavoritePage";
import CreateCapsulePage from "./pages/CreateCapsulePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WishbookProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/mood" element={<MoodPage />} />
            <Route path="/capsules" element={<CapsulesPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/add-favorite" element={<AddFavoritePage />} />
            <Route path="/create-capsule" element={<CreateCapsulePage />} />
            <Route path="/favorites" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WishbookProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
