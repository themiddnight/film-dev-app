// App.tsx — router setup
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSettingsStore } from "./store/settingsStore";
import { useDevelopStore } from "./store/developStore";
import { useMixingStore } from "./store/mixingStore";
import { useEffect } from "react";
import type { ReactNode } from "react";

// Pages — Develop Session
import HomePage from "./pages/HomePage";
import RecipeSelectPage from "./pages/develop/RecipeSelectPage";
import StepPreviewPage from "./pages/develop/StepPreviewPage";
import ActiveTimerPage from "./pages/develop/ActiveTimerPage";
import StepCompletePage from "./pages/develop/StepCompletePage";
import AllDonePage from "./pages/develop/AllDonePage";
import SettingsPage from "./pages/SettingsPage";

// Pages — Mixing Guide
import MixingRecipeSelectPage from "./pages/mixing/MixingRecipeSelectPage";
import SelectionScreenPage from "./pages/mixing/SelectionScreenPage";
import ShoppingListPage from "./pages/mixing/ShoppingListPage";
import MixChecklistPage from "./pages/mixing/MixChecklistPage";

// Pages — My Kit
import MyKitPage from "./pages/MyKitPage";
import CreateKitPage from "./pages/CreateKitPage";

// ── Route guards ────────────────────────────────────────────────────────────
// Redirect to fallback if the required store state is missing.
// This catches direct URL access, page refresh mid-session, and bookmark entry.

function RequireDevelopRecipe({ children }: { children: ReactNode }) {
  const recipe = useDevelopStore((s) => s.recipe);
  return recipe ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireActiveTimer({ children }: { children: ReactNode }) {
  const recipe = useDevelopStore((s) => s.recipe);
  const timerState = useDevelopStore((s) => s.timerState);
  // Timer must have been started; 'idle' means no active session
  return recipe && timerState !== "idle" ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
}

function RequireMixingRecipe({ children }: { children: ReactNode }) {
  const recipe = useMixingStore((s) => s.recipe);
  return recipe ? <>{children}</> : <Navigate to="/mixing/recipe" replace />;
}

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
      <div className="w-full max-w-[430px] h-dvh bg-base-100 relative overflow-hidden flex flex-col">
        <BrowserRouter>
          <Routes>
            {/* Root */}
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/my-kit" element={<MyKitPage />} />
            <Route path="/my-kit/create-kit" element={<CreateKitPage />} />

            {/* Develop Session — recipe required */}
            <Route path="/develop/recipe" element={<RecipeSelectPage />} />
            <Route
              path="/develop/preview"
              element={
                <RequireDevelopRecipe>
                  <StepPreviewPage />
                </RequireDevelopRecipe>
              }
            />
            <Route
              path="/develop/timer"
              element={
                <RequireActiveTimer>
                  <ActiveTimerPage />
                </RequireActiveTimer>
              }
            />
            <Route
              path="/develop/step-complete"
              element={
                <RequireActiveTimer>
                  <StepCompletePage />
                </RequireActiveTimer>
              }
            />
            <Route
              path="/develop/done"
              element={
                <RequireDevelopRecipe>
                  <AllDonePage />
                </RequireDevelopRecipe>
              }
            />

            {/* Mixing Guide — recipe required after selection */}
            <Route path="/mixing/recipe" element={<MixingRecipeSelectPage />} />
            <Route
              path="/mixing/selection"
              element={
                <RequireMixingRecipe>
                  <SelectionScreenPage />
                </RequireMixingRecipe>
              }
            />
            <Route
              path="/mixing/shopping"
              element={
                <RequireMixingRecipe>
                  <ShoppingListPage />
                </RequireMixingRecipe>
              }
            />
            <Route
              path="/mixing/checklist"
              element={
                <RequireMixingRecipe>
                  <MixChecklistPage />
                </RequireMixingRecipe>
              }
            />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
