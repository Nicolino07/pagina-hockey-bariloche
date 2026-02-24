import { Outlet } from "react-router-dom"
import Navbar from "../components/navbar/NavBar"
import Footer from "../components/footer/Footer"
import styles from "./MainLayout.module.css"

export default function MainLayout() {
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