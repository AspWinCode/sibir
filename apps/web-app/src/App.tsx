import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { MaterialDetailPage } from "./pages/MaterialDetailPage";
import { MapPage } from "./pages/MapPage";
import { RouteCollectionPage } from "./pages/RouteCollectionPage";
import { StocksPage } from "./pages/StocksPage";
import { OffersPage } from "./pages/OffersPage";
import { DealsPage } from "./pages/DealsPage";
import { ProfilePage } from "./pages/ProfilePage";

function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <AuthPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/materials" replace />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/materials/:id" element={<MaterialDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/route" element={<RouteCollectionPage />} />
        <Route path="/stocks" element={<StocksPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/materials" replace />} />
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
