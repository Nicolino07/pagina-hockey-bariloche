import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Home from "./pages/Home"
import ProtectedRoute from "./auth/ProtectedRoute"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
