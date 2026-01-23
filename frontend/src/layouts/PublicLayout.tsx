import { Outlet } from "react-router-dom"
import Navbar from "../components/navbar/NavBar"
import Footer from "../components/footer/Footer"
import styles from "./PublicLayout.module.css"

export default function PublicLayout() {
  return (
    <div className={styles.layout}>
      <Navbar />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
