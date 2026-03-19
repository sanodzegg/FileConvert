import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/homepage";
import Settings from "./pages/settings";
import FaviconConversion from "./pages/favicons";

export default function Router() {
  return (
    <Routes>
        <Route index element={<Homepage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/extensions/favicon" element={<FaviconConversion />} />
    </Routes>
  )
}
