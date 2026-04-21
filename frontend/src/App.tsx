// App.tsx — router setup
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSettingsStore } from "./store/settingsStore";
import { useEffect } from "react";

// Pages
import HomePage from "./pages/HomePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import CreateRecipeFullPage from "./pages/CreateRecipeFullPage";
import EditRecipePage from "./pages/EditRecipePage";
import KitsPage from "./pages/KitsPage";
import DevEntryPage from "./pages/dev/DevEntryPage";
import DevSetupPage from "./pages/dev/DevSetupPage";
import DevTimerPage from "./pages/dev/DevTimerPage";
import DevDonePage from "./pages/dev/DevDonePage";
import MixSelectPage from "./pages/mix/MixSelectPage";
import MixSummaryPage from "./pages/mix/MixSummaryPage";
import MixPrepPage from "./pages/mix/MixPrepPage";
import MixMixPage from "./pages/mix/MixMixPage";
import MixStepByStepPage from "./pages/mix/MixStepByStepPage";
import MixDonePage from "./pages/mix/MixDonePage";
import MixShoppingPage from "./pages/mix/MixShoppingPage";
import SettingsPage from "./pages/SettingsPage";
import MainLayout from "./components/MainLayout";

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const theme = useSettingsStore((s) => s.theme);

  // Sync DaisyUI theme attribute
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme === "dark" ? "dark" : "light",
    );
  }, [theme]);

  return (
    // max-width layout — mobile-first, centered on larger screens
    <div className="h-dvh flex justify-center bg-base-200">
      <div className="w-full h-dvh bg-base-100 relative overflow-hidden flex flex-col">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<HomePage />} />
              <Route path="dev" element={<DevEntryPage />} />
              <Route path="dev/setup" element={<DevSetupPage />} />
              <Route path="dev/timer" element={<DevTimerPage />} />
              <Route path="dev/done" element={<DevDonePage />} />
              <Route path="mix" element={<MixSelectPage />} />
              <Route path="mix/summary" element={<MixSummaryPage />} />
              <Route path="mix/shopping" element={<MixShoppingPage />} />
              <Route path="mix/prep" element={<MixPrepPage />} />
              <Route path="mix/mix" element={<MixMixPage />} />
              <Route path="mix/steps" element={<MixStepByStepPage />} />
              <Route path="mix/done" element={<MixDonePage />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="recipes/new" element={<Navigate to="/recipes/new-full" replace />} />
              <Route path="recipes/new-full" element={<CreateRecipeFullPage />} />
              <Route path="recipes/:id" element={<RecipeDetailPage />} />
              <Route path="recipes/:id/edit" element={<EditRecipePage />} />
              <Route path="inventory" element={<Navigate to="/kits" replace />} />
              <Route path="kits" element={<KitsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
