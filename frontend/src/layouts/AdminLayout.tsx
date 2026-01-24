import { Outlet } from "react-router-dom"
import NavbarAdmin from "../components/navbar/NavBarAdmin"
import styles from "./AdminLayout.module.css"
import Footer from "../components/footer/Footer"

export default function AdminLayout() {
  return (
    <div className={styles.layout}>
      <NavbarAdmin />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
