import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RawMaterialsPage } from "./pages/RawMaterialsPage";
import { RegionsPage } from "./pages/RegionsPage";
import { FieldsPage } from "./pages/FieldsPage";
import { RoutesPage } from "./pages/RoutesPage";
import { ProcurementOverviewPage } from "./pages/ProcurementOverviewPage";
import { CollectorOverviewPage } from "./pages/CollectorOverviewPage";
import { FireSafetyTestsPage } from "./pages/FireSafetyTestsPage";
import { VideoContentPage } from "./pages/VideoContentPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/raw-materials" replace /> : <LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/raw-materials" replace />} />
        <Route path="/raw-materials" element={<RawMaterialsPage />} />
        <Route path="/regions" element={<RegionsPage />} />
        <Route path="/fields" element={<FieldsPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/procurement" element={<ProcurementOverviewPage />} />
        <Route path="/collectors" element={<CollectorOverviewPage />} />
        <Route path="/fire-safety" element={<FireSafetyTestsPage />} />
        <Route path="/videos" element={<VideoContentPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
