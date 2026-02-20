import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generarPlanillaPDF = (datos: any) => {
  const { torneo, local, visitante, plantelLocal, plantelVisitante } = datos;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Márgenes más ajustados para aprovechar el espacio
  const marginLeft = 8;
  const marginRight = 8;
  const colWidth = (pageWidth - marginLeft - marginRight - 4) / 2;

  // --- 1. DATOS DEL PARTIDO (CABECERA) ---
  doc.setFontSize(14);
  
  doc.setFontSize(9);
  doc.rect(marginLeft, 16, pageWidth - marginLeft - marginRight, 18);
  doc.text(`TORNEO: ${torneo?.nombre || ""}`, marginLeft + 2, 21);
  doc.text(`FECHA: ____/____/26`, pageWidth / 2 + 5, 21);
  doc.text(`ENCUENTRO: ${local?.nombre_equipo} VS ${visitante?.nombre_equipo}`, marginLeft + 2, 28);
  doc.text(`LUGAR: .......................................`, pageWidth / 2 + 5, 28);

  // --- 2. RESULTADO POR CUARTOS ---
  autoTable(doc, {
    startY: 36,
    head: [[local?.nombre_equipo.substring(0, 20)] [visitante?.nombre_equipo.substring(0, 20)]],
    body: [['1C', '', '2C', '', '3C', '', 'FINAL', '',]
      
    ],
    theme: 'grid',
    styles: { fontSize: 9, halign: 'center', cellPadding: 2 },
    margin: { left: 30, right: 30 }
  });

  const startYTables = (doc as any).lastAutoTable.finalY + 10;

  // --- 3. FUNCIÓN PARA DIBUJAR COLUMNA DE EQUIPO ---
  const dibujarColumnaEquipo = (plantel: any[], nombre: string, xPos: number) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(nombre.toUpperCase(), xPos, startYTables - 2);

    // Aseguramos que haya al menos 12 filas
    const filasJugadores = [...plantel];
    while (filasJugadores.length < 12) {
      filasJugadores.push({ apellido_persona: "", nombre_persona: "" });
    }

    autoTable(doc, {
      startY: startYTables,
      margin: { left: xPos, right: pageWidth - (xPos + colWidth) },
      head: [
        [{ content: 'OK', rowSpan: 2 }, { content: '#', rowSpan: 2 }, { content: 'JUGADOR', rowSpan: 2 }, { content: 'TARJETAS', colSpan: 4 }],
        ['V', 'A', 'A', 'R']
      ],
      body: filasJugadores.map((p, index) => [
        '', 
        (index + 1).toString(),
        p.apellido_persona && p.nombre_persona 
          ? `${p.apellido_persona}, ${p.nombre_persona}`
          : '',
        '', '', '', ''
      ]),
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 2, 
        valign: 'middle',
        overflow: 'linebreak',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [40, 40, 40], 
        halign: 'center', 
        fontSize: 8,
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 8 },
        2: { cellWidth: 42, halign: 'left' },
        3: { cellWidth: 8, halign: 'center' },
        4: { cellWidth: 8, halign: 'center' },
        5: { cellWidth: 8, halign: 'center' },
        6: { cellWidth: 8, halign: 'center' },
      }
    });

    return (doc as any).lastAutoTable.finalY;
  };

  // Dibujamos ambas columnas de jugadores
  const finalYLocal = dibujarColumnaEquipo(
    plantelLocal || [], 
    local?.nombre_equipo || "LOCAL", 
    marginLeft
  );
  
  const finalYVisit = dibujarColumnaEquipo(
    plantelVisitante || [], 
    visitante?.nombre_equipo || "VISITANTE", 
    pageWidth / 2 + 4
  );

  // Usamos la Y más baja para alinear las siguientes tablas
  const finalYJugadores = Math.max(finalYLocal, finalYVisit);

  // --- 4. TABLAS DE CARGOS (alineadas verticalmente) ---
  const drawCargos = (xPos: number, yPos: number) => {
    autoTable(doc, {
      startY: yPos,
      margin: { left: xPos, right: pageWidth - (xPos + colWidth) },
      body: [
        ['CAPITÁN', ''],
        ['ENTRENADOR', ''],
        ['AUXILIAR', ''],
        ['JUEZ DE MESA', '']
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60], fontSize: 8 },
      columnStyles: { 
        0: { cellWidth: 25 },
        1: { cellWidth: 52 }
      }
    });
  };

  // Dibujamos ambas tablas de cargos en la misma Y
  const yCargos = finalYJugadores + 4;
  drawCargos(marginLeft, yCargos);
  drawCargos(pageWidth / 2 + 4, yCargos);

  const finalYCargos = (doc as any).lastAutoTable.finalY;

  // --- 5. TABLAS DE GOLES (alineadas verticalmente) ---
  const drawGoles = (xPos: number, yPos: number, equipo: string) => {
    autoTable(doc, {
      startY: yPos,
      margin: { left: xPos, right: pageWidth - (xPos + colWidth) },
      head: [[ equipo, '#', 'MIN', 'TIPO', 'PARCIAL']],
      body: Array(8).fill(['', '', '', '', '']),
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center', cellPadding: 1.5 },
      headStyles: { fillColor: [80, 80, 80], fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 12 },
        2: { cellWidth: 12 },
        3: { cellWidth: 12 },
        4: { cellWidth: 20 },
      }
    });
  };

  // Título centrado para la sección de goles
  const yGoles = finalYCargos + 12;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  // Dibujamos ambas tablas de goles en la misma Y
  drawGoles(marginLeft, yGoles, "EQUIPO");
  drawGoles(pageWidth / 2 + 4, yGoles, "EQUIPO");

  const finalYGoles = (doc as any).lastAutoTable.finalY;

  // --- 6. OBSERVACIONES Y FIRMAS ---
  let yObservaciones = finalYGoles + 8;
  
  // Verificamos si necesitamos nueva página
  if (yObservaciones > pageHeight - 40) {
    doc.addPage();
    yObservaciones = 20;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("OBSERVACIONES:", marginLeft, yObservaciones);
  doc.setFont("helvetica", "normal");
  
  // Líneas para observaciones
  const obsY = yObservaciones + 3;
  doc.line(marginLeft, obsY, pageWidth - marginRight, obsY);
  doc.line(marginLeft, obsY + 7, pageWidth - marginRight, obsY + 7);
  doc.line(marginLeft, obsY + 14, pageWidth - marginRight, obsY + 14);

  const firmaY = yObservaciones + 28;
  doc.setFontSize(10);
  doc.text("ÁRBITRO 1: .......................................", marginLeft, firmaY);
  doc.text("ÁRBITRO 2: .......................................", pageWidth / 2 + 5, firmaY);
  
  doc.setFontSize(8);
  doc.text("(Firma y aclaración)", marginLeft + 5, firmaY + 4);
  doc.text("(Firma y aclaración)", pageWidth / 2 + 10, firmaY + 4);

  // Línea de cierre
  doc.setFontSize(8);
  doc.text("Esta planilla debe ser completada en su totalidad y firmada por los responsables.", 
    pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.save(`Planilla_Campo_${local?.nombre_equipo}_vs_${visitante?.nombre_equipo}.pdf`);
};