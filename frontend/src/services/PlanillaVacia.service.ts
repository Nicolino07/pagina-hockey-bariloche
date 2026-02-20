import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generarPlanillaPDF = (datos: any) => {
  const { torneo, local, visitante, plantelLocal, plantelVisitante } = datos;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const marginLeft = 8;
  const marginRight = 8;
  const colWidth = (pageWidth - marginLeft - marginRight - 10) / 2;

  // --- 1. CABECERA ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PLANILLA - AHBLS", pageWidth / 2, 10, { align: "center" });

  doc.setFontSize(9);
  // El rect mide 18 de alto (de 14 a 32)
  doc.rect(marginLeft, 14, pageWidth - marginLeft - marginRight, 18);
  
  // Línea 1: Torneo y N° de Fecha
  doc.setFont("helvetica", "bold");
  doc.text(`TORNEO:`, marginLeft + 2, 19);
  doc.setFont("helvetica", "normal");
  doc.text(`${torneo?.nombre || ""}`, marginLeft + 20, 19);
  
  doc.setFont("helvetica", "bold");
  doc.text(`N° FECHA:`, pageWidth - 80, 19);
  doc.setFont("helvetica", "normal");
  doc.text(`.........`, pageWidth - 60, 19);

  // Línea 2: Encuentro (Aumentamos el espacio para nombres largos)
  doc.setFont("helvetica", "bold");
  doc.text(`ENCUENTRO:`, marginLeft + 2, 25);
  doc.setFont("helvetica", "normal");
  doc.text(`${local?.nombre_equipo} VS ${visitante?.nombre_equipo}`, marginLeft + 25, 25);

  // Línea 3: Día y Lugar
  doc.setFont("helvetica", "bold");
  doc.text(`DÍA:`, marginLeft + 2, 31);
  doc.setFont("helvetica", "normal");
  doc.text(`____/____/26`, marginLeft + 12, 31);

  doc.setFont("helvetica", "bold");
  doc.text(`LUGAR:`, pageWidth / 2 - 10, 31);
  doc.setFont("helvetica", "normal");
  doc.text(`.......................................................`, pageWidth / 2 + 5, 31);

  const startYJugadores = 40; // Bajamos un poquito el inicio de tablas para que no pegue al cuadro

  // --- 2. FUNCIÓN PARA DIBUJAR PLANTEL ---
  const dibujarPlantel = (plantel: any[], nombre: string, xPos: number) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(nombre.toUpperCase(), xPos, startYJugadores - 2);

    const filasJugadores = [...plantel];
    while (filasJugadores.length < 15) {
      filasJugadores.push({ apellido_persona: "", nombre_persona: "", numero_camiseta: "" });
    }

    autoTable(doc, {
      startY: startYJugadores,
      margin: { left: xPos, right: pageWidth - (xPos + colWidth) },
      head: [
        [{ content: 'OK', rowSpan: 2 }, { content: '#', rowSpan: 2 }, { content: 'JUGADOR', rowSpan: 2 }, { content: 'TARJETAS', colSpan: 4 }],
        ['V', 'A', 'A', 'R']
      ],
      body: filasJugadores.map((p) => [
        '', 
        p.numero_camiseta || '', 
        p.apellido_persona ? `${p.apellido_persona}, ${p.nombre_persona}` : '',
        '', '', '', ''
      ]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 0.8, lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [40, 40, 40], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8 }, 1: { cellWidth: 8 }, 2: { cellWidth: 49 },
        3: { cellWidth: 8 }, 4: { cellWidth: 8 }, 5: { cellWidth: 8 }, 6: { cellWidth: 8 }
      }
    });
    return (doc as any).lastAutoTable.finalY;
  };

  const finalYPlantelL = dibujarPlantel(plantelLocal || [], "LOCAL: " + local?.nombre_equipo || "LOCAL", marginLeft);
  const finalYPlantelV = dibujarPlantel(plantelVisitante || [], "VISITANTE: " + visitante?.nombre_equipo || "VISITANTE", pageWidth / 2 + 5);
  
  const ySeccionMedia = Math.max(finalYPlantelL, finalYPlantelV) + 5;

  // --- 3. FILA TRIPLE: CARGOS LOCAL | RESULTADOS | CARGOS VISITANTE ---
  autoTable(doc, {
    startY: ySeccionMedia,
    margin: { left: marginLeft },
    tableWidth: 60,
    body: [['CAPITÁN', ''], ['DT', ''], ['AUX', ''], ['MESA', '']],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 18, fontStyle: 'bold' } }
  });

  autoTable(doc, {
    startY: ySeccionMedia,
    margin: { left: 72 },
    tableWidth: 66,
    head: [['CUARTO', 'LOCAL', 'VISITA']],
    body: [['1C', '', ''], ['2C', '', ''], ['3C', '', ''], ['FINAL', '', '']],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', cellPadding: 1 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: { 0: { cellWidth: 16, fontStyle: 'bold' } }
  });

  autoTable(doc, {
    startY: ySeccionMedia,
    margin: { left: 142 },
    tableWidth: 60,
    body: [['CAPITÁN', ''], ['DT', ''], ['AUX', ''], ['MESA', '']],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 18, fontStyle: 'bold' } }
  });

  // --- 4. FIRMAS DE ÁRBITROS (ANTES DE GOLES) ---
  const yFirmas = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  doc.text("ÁRBITRO 1: _____________________________", marginLeft + 2, yFirmas);
  doc.text("ÁRBITRO 2: _____________________________", pageWidth / 2 + 5, yFirmas);

  // --- 5. SECCIÓN DE GOLES ---
  const yGolesTitle = yFirmas + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Registro de goles - Referencia (GJ - GC - GP - DP)", pageWidth / 2, yGolesTitle, { align: "center" });

  const drawTablaGoles = (xPos: number, yPos: number) => {
    autoTable(doc, {
      startY: yPos,
      margin: { left: xPos, right: pageWidth - (xPos + colWidth) },
      head: [['EQUIPO', '# JUG', 'MIN', 'REF']],
      body: Array(10).fill(['', '', '', '']),
      theme: 'grid',
      styles: { fontSize: 10, halign: 'center', cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [80, 80, 80] },
      columnStyles: { 0: { cellWidth: 49, halign: 'left' }, 1: { cellWidth: 12 }, 2: { cellWidth: 12 }, 3: { cellWidth: 12 } }
    });
  };

  drawTablaGoles(marginLeft, yGolesTitle + 2);
  drawTablaGoles(pageWidth / 2 + 5, yGolesTitle + 2);

  const finalYGoles = (doc as any).lastAutoTable.finalY;

  // --- 6. OBSERVACIONES (CIERRE) ---
  const yObs = finalYGoles + 6;
  doc.setFontSize(9);
  doc.text("OBSERVACIONES:", marginLeft, yObs);
  doc.line(marginLeft, yObs + 1, pageWidth - marginRight, yObs + 1);
  doc.line(marginLeft, yObs + 7, pageWidth - marginRight, yObs + 7);
  doc.line(marginLeft, yObs + 13, pageWidth - marginRight, yObs + 13);

  doc.save(`Planilla_${local?.nombre_equipo}_vs_${visitante?.nombre_equipo}.pdf`);
};