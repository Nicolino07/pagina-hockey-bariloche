import { Outlet } from "react-router-dom"
import NavbarAdmin from "../components/navbar/NavBarAdmin"
import styles from "./AdminLayout.module.css"

export default function AdminLayout() {
  return (
    <div className={styles.layout}>
      <NavbarAdmin />

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
