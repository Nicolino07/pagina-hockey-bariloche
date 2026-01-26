import "./styles/globals.css"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { AuthProvider } from "./auth/AuthContext"

console.log("🌍 VITE_API_URL =", import.meta.env.VITE_API_URL)

ReactDOM.createRoot(document.getElementById("root")!).render(
  /*<React.StrictMode>*/
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  /*</React.StrictMode>*/
)
