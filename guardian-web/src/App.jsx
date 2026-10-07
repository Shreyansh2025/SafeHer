import { Routes, Route } from "react-router-dom";
import EmergencyPage from "./pages/EmergencyPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/e/:token" element={<EmergencyPage />} />
      <Route path="/emergency/:token" element={<EmergencyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}