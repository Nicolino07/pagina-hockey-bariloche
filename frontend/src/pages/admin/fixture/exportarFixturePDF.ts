import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { FixturePartido } from "../../../types/fixture"
import type { Torneo } from "../../../types/torneo"

function nombreEquipo(p: FixturePartido, lado: "local" | "visitante"): string {
  if (lado === "local") return p.nombre_equipo_local ?? p.placeholder_local ?? "—"
  return p.nombre_equipo_visitante ?? p.placeholder_visitante ?? "—"
}

function labelTorneo(torneo: Torneo): string {
  const parts = [torneo.nombre, torneo.categoria]
  if (torneo.division) parts.push(torneo.division)
  parts.push(torneo.genero)
  return parts.join(" · ")
}

const COL_LEFT = 14
const HEAD_COLOR: [number, number, number] = [30, 80, 160]

function renderBloque(
  doc: jsPDF,
  titulo: string,
  subtitulo: string | null,
  partidos: FixturePartido[],
  startY: number,
  marginLeft: number,
  colWidth: number
): number {
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...HEAD_COLOR)
  doc.text(titulo, marginLeft, startY)

  let y = startY + 4

  if (subtitulo) {
    doc.setFontSize(7)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(0, 0, 0)
    doc.text(subtitulo, marginLeft, y)
    y += 3.5
  }

  doc.setTextColor(0, 0, 0)

  const body = partidos.map(p => [nombreEquipo(p, "local"), "vs", nombreEquipo(p, "visitante")])
  const localW = colWidth * 0.44
  const vsW = colWidth * 0.08
  const visitanteW = colWidth * 0.44

  autoTable(doc, {
    head: [["Local", "", "Visitante"]],
    body,
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.5, overflow: "ellipsize", textColor: [0, 0, 0] },
    headStyles: { fillColor: [70, 120, 200], textColor: [0, 0, 0], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    margin: { left: marginLeft, right: 0 },
    tableWidth: colWidth,
    columnStyles: {
      0: { cellWidth: localW, halign: "right" },
      1: { cellWidth: vsW, halign: "center", textColor: [130, 130, 130], fontStyle: "italic" },
      2: { cellWidth: visitanteW, halign: "left" },
    },
  })

  return (doc as any).lastAutoTable.finalY + 5
}

function exportarLiga(doc: jsPDF, partidos: FixturePartido[], startY: number, pageWidth: number, pageHeight: number): void {
  const ordenados = [...partidos].sort((a, b) => (a.numero_fecha ?? 0) - (b.numero_fecha ?? 0))
  const numFechas = [...new Set(ordenados.map(p => p.numero_fecha ?? 0))].sort((a, b) => a - b)

  const colWidth = (pageWidth - 28 - 8) / 2  // 8 de gutter entre columnas
  const marginRight = COL_LEFT + colWidth + 8

  let yLeft = startY
  let yRight = startY
  let columna = 0  // 0 = izquierda, 1 = derecha

  for (const nf of numFechas) {
    const ps = ordenados.filter(p => (p.numero_fecha ?? 0) === nf)
    const rueda = ps[0]?.rueda ?? null
    const descansa = ps[0]?.nombre_equipo_descansa ?? null

    let titulo = `Fecha ${nf || "—"}`
    if (rueda) titulo += ` (${rueda})`
    const subtitulo = descansa ? `Descansa: ${descansa}` : null

    const marginLeft = columna === 0 ? COL_LEFT : marginRight
    const yActual = columna === 0 ? yLeft : yRight

    // Estimación de altura del bloque para decidir si salta de página
    const alturaEstimada = (ps.length * 7) + 20
    if (yActual + alturaEstimada > pageHeight - 10) {
      doc.addPage()
      yLeft = startY
      yRight = startY
      columna = 0
    }

    const yFin = renderBloque(doc, titulo, subtitulo, ps, columna === 0 ? yLeft : yRight, marginLeft, colWidth)

    if (columna === 0) {
      yLeft = yFin
      columna = 1
    } else {
      yRight = yFin
      columna = 0
      // Sincronizar ambas columnas al máximo para la próxima fila de bloques
      const yMax = Math.max(yLeft, yRight)
      yLeft = yMax
      yRight = yMax
    }
  }
}

function exportarPlayoff(doc: jsPDF, partidos: FixturePartido[], startY: number, pageWidth: number, pageHeight: number): void {
  const rondas = [...new Set(partidos.map(p => p.nombre_ronda_playoff ?? "Sin ronda"))]

  const colWidth = (pageWidth - 28 - 8) / 2
  const marginRight = COL_LEFT + colWidth + 8

  let yLeft = startY
  let yRight = startY
  let columna = 0

  for (const ronda of rondas) {
    const ps = partidos.filter(p => (p.nombre_ronda_playoff ?? "Sin ronda") === ronda)

    const marginLeft = columna === 0 ? COL_LEFT : marginRight
    const alturaEstimada = (ps.length * 7) + 20

    if ((columna === 0 ? yLeft : yRight) + alturaEstimada > pageHeight - 10) {
      doc.addPage()
      yLeft = startY
      yRight = startY
      columna = 0
    }

    const yFin = renderBloque(doc, ronda, null, ps, columna === 0 ? yLeft : yRight, marginLeft, colWidth)

    if (columna === 0) {
      yLeft = yFin
      columna = 1
    } else {
      yRight = yFin
      columna = 0
      const yMax = Math.max(yLeft, yRight)
      yLeft = yMax
      yRight = yMax
    }
  }
}

export function exportarFixturePDF(
  partidos: FixturePartido[],
  torneo: Torneo,
  esPlayoff: boolean
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(20, 60, 140)
  doc.text("Fixture", COL_LEFT, 13)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(60, 60, 60)
  doc.text(labelTorneo(torneo), COL_LEFT, 20)

  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  const fechaExport = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
  doc.text(`Exportado el ${fechaExport}`, COL_LEFT, 25)

  doc.setDrawColor(...HEAD_COLOR)
  doc.setLineWidth(0.4)
  doc.line(COL_LEFT, 28, pageWidth - COL_LEFT, 28)

  if (esPlayoff) {
    exportarPlayoff(doc, partidos, 33, pageWidth, pageHeight)
  } else {
    exportarLiga(doc, partidos, 33, pageWidth, pageHeight)
  }

  const nombreArchivo = `fixture_${torneo.nombre.toLowerCase().replace(/\s+/g, "_")}.pdf`
  doc.save(nombreArchivo)
}
