import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatearNombre = (apellido: string, nombre: string): string => {
  const apellidos = apellido.trim().split(/\s+/);
  const nombres = nombre.trim().split(/\s+/);
  const apellidoFormato = apellidos.length > 1
    ? `${apellidos[0]} ${apellidos[1][0]}.`
    : apellidos[0];
  return `${apellidoFormato}, ${nombres.join(' ')}`;
};

const nombreCompleto = (p: any): string => {
  if (!p) return '';
  const apellido = p.apellido_persona || '';
  const nombre = p.nombre_persona || '';
  if (!apellido && !nombre) return '';
  return formatearNombre(apellido, nombre);
};

export const generarPlanillaPDF = (datos: any) => {
  const { torneo, local, visitante, plantelLocal, plantelVisitante, cuerpoTecnicoLocal = [], cuerpoTecnicoVisitante = [], fecha, numero_fecha, ubicacion } = datos;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  
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
  doc.text(numero_fecha != null ? String(numero_fecha) : `.........`, pageWidth - 60, 19);

  // Línea 2: Encuentro (Aumentamos el espacio para nombres largos)
  doc.setFont("helvetica", "bold");
  doc.text(`ENCUENTRO:`, marginLeft + 2, 25);
  doc.setFont("helvetica", "normal");
  doc.text(`${local?.nombre_equipo} VS ${visitante?.nombre_equipo}`, marginLeft + 25, 25);

  // Línea 3: Día y Lugar
  const fechaTexto = fecha
    ? new Date(fecha + "T00:00:00").toLocaleDateString("es-AR")
    : "____/____/____";
  doc.setFont("helvetica", "bold");
  doc.text(`DÍA:`, marginLeft + 2, 31);
  doc.setFont("helvetica", "normal");
  doc.text(fechaTexto, marginLeft + 12, 31);

  doc.setFont("helvetica", "bold");
  doc.text(`LUGAR:`, pageWidth / 2 - 10, 31);
  doc.setFont("helvetica", "normal");
  doc.text(ubicacion || `.......................................................`, pageWidth / 2 + 5, 31);

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
        p.apellido_persona ? nombreCompleto(p) : '',
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
  const buscarPorRol = (cuerpo: any[], rol: string) =>
    cuerpo.find((i: any) => i.rol_en_plantel === rol);

  const cargosParaPlantel = (cuerpo: any[]) => {
    const dt = buscarPorRol(cuerpo, 'DT');
    const aux = buscarPorRol(cuerpo, 'ASISTENTE');
    const prep = buscarPorRol(cuerpo, 'PREPARADOR_FISICO');
    return [
      ['CAPITÁN', ''],
      ['DT', dt ? nombreCompleto(dt) : ''],
      ['AUX', aux ? nombreCompleto(aux) : ''],
      ['PREP. FÍS.', prep ? nombreCompleto(prep) : ''],
      ['MESA', ''],
    ];
  };

  autoTable(doc, {
    startY: ySeccionMedia,
    margin: { left: marginLeft },
    tableWidth: 60,
    body: cargosParaPlantel(cuerpoTecnicoLocal),
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
    body: cargosParaPlantel(cuerpoTecnicoVisitante),
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
      head: [
        [
          { content: 'EQUIPO', rowSpan: 2 },
          { content: '# JUG', rowSpan: 2 },
          { content: 'MIN', rowSpan: 2 },
          { content: 'REF', rowSpan: 2 },
          { content: 'PARCIAL', colSpan: 2 },
        ],
        ['L', 'V'],
      ],
      body: Array(10).fill(['', '', '', '', '', '']),
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center', cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [80, 80, 80] },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 10 },
        2: { cellWidth: 10 },
        3: { cellWidth: 10 },
        4: { cellWidth: 9 },
        5: { cellWidth: 9 },
      }
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

// ── Planilla completa (partido ya jugado) ────────────────────────────────────

export const generarPlanillaCompletaPDF = (detalle: any) => {
  // Parsers del formato Apellido|Nombre|... de la vista DB
  const parseJugadores = (str: string | null) => {
    if (!str) return [];
    return str.split('; ').filter(Boolean).map(item => {
      const [apellido = '', nombre = '', camiseta = '', rol = 'JUGADOR', capitan = 'false'] = item.split('|');
      return { apellido, nombre, camiseta, rol, capitan: capitan === 'true' };
    });
  };
  const parseGoles = (str: string | null) => {
    if (!str) return [];
    return str.split('; ').filter(Boolean).map(item => {
      const [apellido = '', nombre = '', minuto = '0', cuarto = '', esAutogol = 'false'] = item.split('|');
      return { apellido, nombre, minuto: Number(minuto), cuarto: cuarto ? Number(cuarto) : null, esAutogol: esAutogol === 'true' };
    });
  };
  const parseTarjetas = (str: string | null) => {
    if (!str) return [];
    return str.split('; ').filter(Boolean).map(item => {
      const [apellido = '', nombre = '', , , tipo = ''] = item.split('|');
      return { apellido, nombre, tipo };
    });
  };

  const allLocal   = parseJugadores(detalle.lista_jugadores_local);
  const allVisita  = parseJugadores(detalle.lista_jugadores_visitante);
  const golesL     = parseGoles(detalle.lista_goles_local);
  const golesV     = parseGoles(detalle.lista_goles_visitante);
  const tarjetasL  = parseTarjetas(detalle.lista_tarjetas_local);
  const tarjetasV  = parseTarjetas(detalle.lista_tarjetas_visitante);

  const jugadoresLocal  = allLocal.filter(j => j.rol === 'JUGADOR');
  const staffLocal      = allLocal.filter(j => j.rol !== 'JUGADOR');
  const jugadoresVisita = allVisita.filter(j => j.rol === 'JUGADOR');
  const staffVisita     = allVisita.filter(j => j.rol !== 'JUGADOR');

  // Marca de tarjetas por jugador [V, A1, A2, R]
  const marcasTarjetas = (apellido: string, nombre: string, tarjetas: ReturnType<typeof parseTarjetas>) => {
    const t = tarjetas.filter(x => x.apellido === apellido && x.nombre === nombre);
    const v = t.filter(x => x.tipo === 'VERDE').length;
    const a = t.filter(x => x.tipo === 'AMARILLA').length;
    const r = t.filter(x => x.tipo === 'ROJA').length;
    return [v > 0 ? 'V' : '', a > 0 ? 'A' : '', a > 1 ? 'A' : '', r > 0 ? 'R' : ''];
  };

  // Resultado por cuarto
  const scoreQ = [1,2,3,4].map(c => ({
    l: golesL.filter(g => g.cuarto === c).length,
    v: golesV.filter(g => g.cuarto === c).length,
  }));

  // Todos los goles ordenados con parcial acumulado
  let sL = 0, sV = 0;
  const golesOrdenados = [
    ...golesL.map(g => ({ ...g, lado: 'L' as const, equipo: detalle.equipo_local_nombre })),
    ...golesV.map(g => ({ ...g, lado: 'V' as const, equipo: detalle.equipo_visitante_nombre })),
  ]
    .sort((a, b) => (a.cuarto ?? 0) - (b.cuarto ?? 0) || a.minuto - b.minuto)
    .map(g => {
      if (g.lado === 'L') sL++; else sV++;
      const lista = g.lado === 'L' ? jugadoresLocal : jugadoresVisita;
      const jug = lista.find(j => j.apellido === g.apellido && j.nombre === g.nombre);
      return {
        equipo: (g.equipo || '').substring(0, 16),
        camiseta: jug?.camiseta || '',
        minuto: String(g.minuto),
        ref: g.esAutogol ? 'GC' : 'GJ',
        parcialL: String(sL),
        parcialV: String(sV),
      };
    });

  // Staff → filas para la tabla de cargos
  const staffRows = (staff: ReturnType<typeof parseJugadores>) => {
    const find = (rol: string) => staff.find(s => s.rol === rol);
    const dt   = find('DT');
    const aux  = find('ASISTENTE');
    const prep = find('PREPARADOR_FISICO');
    return [
      ['CAPITÁN', ''],
      ['DT',       dt   ? `${dt.apellido}, ${dt.nombre}`   : ''],
      ['AUX',      aux  ? `${aux.apellido}, ${aux.nombre}`  : ''],
      ['PREP. FÍS.', prep ? `${prep.apellido}, ${prep.nombre}` : ''],
      ['MESA', ''],
    ];
  };

  // ── Armar PDF ────────────────────────────────────────────────────────────
  const doc = new jsPDF();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const marginLeft = 8, marginRight = 8;
  const colWidth   = (pageWidth - marginLeft - marginRight - 10) / 2;

  // Cabecera
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PLANILLA - AHBLS', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(9);
  doc.rect(marginLeft, 14, pageWidth - marginLeft - marginRight, 18);

  doc.setFont('helvetica', 'bold');  doc.text('TORNEO:', marginLeft + 2, 19);
  doc.setFont('helvetica', 'normal'); doc.text(detalle.nombre_torneo || '', marginLeft + 20, 19);

  doc.setFont('helvetica', 'bold');  doc.text('N° FECHA:', pageWidth - 80, 19);
  doc.setFont('helvetica', 'normal'); doc.text(detalle.numero_fecha != null ? String(detalle.numero_fecha) : '—', pageWidth - 60, 19);

  doc.setFont('helvetica', 'bold');  doc.text('ENCUENTRO:', marginLeft + 2, 25);
  doc.setFont('helvetica', 'normal'); doc.text(`${detalle.equipo_local_nombre} VS ${detalle.equipo_visitante_nombre}`, marginLeft + 25, 25);

  const fechaTexto = detalle.fecha
    ? new Date(detalle.fecha + 'T00:00:00').toLocaleDateString('es-AR')
    : '—';
  doc.setFont('helvetica', 'bold');  doc.text('DÍA:', marginLeft + 2, 31);
  doc.setFont('helvetica', 'normal'); doc.text(fechaTexto, marginLeft + 12, 31);
  doc.setFont('helvetica', 'bold');  doc.text('LUGAR:', pageWidth / 2 - 10, 31);
  doc.setFont('helvetica', 'normal'); doc.text(detalle.ubicacion || '........................................', pageWidth / 2 + 5, 31);

  const startY = 40;

  // Plantel con tarjetas
  const dibujarPlantelCompleto = (jugadores: ReturnType<typeof parseJugadores>, titulo: string, xPos: number, tarjetas: ReturnType<typeof parseTarjetas>) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo.toUpperCase(), xPos, startY - 2);

    const filas = [...jugadores];
    while (filas.length < 15) filas.push({ apellido: '', nombre: '', camiseta: '', rol: '', capitan: false });

    autoTable(doc, {
      startY,
      margin: { left: xPos, right: pageWidth - (xPos + colWidth) },
      head: [
        [{ content: 'OK', rowSpan: 2 }, { content: '#', rowSpan: 2 }, { content: 'JUGADOR', rowSpan: 2 }, { content: 'TARJETAS', colSpan: 4 }],
        ['V', 'A', 'A', 'R'],
      ],
      body: filas.map(p => [
        p.capitan ? 'C' : '',
        p.camiseta,
        p.apellido ? `${p.apellido}, ${p.nombre}` : '',
        ...(p.apellido ? marcasTarjetas(p.apellido, p.nombre, tarjetas) : ['', '', '', '']),
      ]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 0.8, lineColor: [0,0,0], lineWidth: 0.1 },
      headStyles: { fillColor: [40,40,40], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8 }, 1: { cellWidth: 8 }, 2: { cellWidth: 49 },
        3: { cellWidth: 8, halign: 'center' }, 4: { cellWidth: 8, halign: 'center' },
        5: { cellWidth: 8, halign: 'center' }, 6: { cellWidth: 8, halign: 'center' },
      },
    });
    return (doc as any).lastAutoTable.finalY;
  };

  const finalYL = dibujarPlantelCompleto(jugadoresLocal,  `LOCAL: ${detalle.equipo_local_nombre}`,      marginLeft,      tarjetasL);
  const finalYV = dibujarPlantelCompleto(jugadoresVisita, `VISITANTE: ${detalle.equipo_visitante_nombre}`, pageWidth/2+5, tarjetasV);
  const yMid = Math.max(finalYL, finalYV) + 5;

  // Cargos local
  autoTable(doc, { startY: yMid, margin: { left: marginLeft }, tableWidth: 60,
    body: staffRows(staffLocal), theme: 'grid',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 18, fontStyle: 'bold' } } });

  // Resultado por cuarto con datos reales
  autoTable(doc, { startY: yMid, margin: { left: 72 }, tableWidth: 66,
    head: [['CUARTO', 'LOCAL', 'VISITA']],
    body: [
      ['1C',    scoreQ[0].l, scoreQ[0].v],
      ['2C',    scoreQ[1].l, scoreQ[1].v],
      ['3C',    scoreQ[2].l, scoreQ[2].v],
      ['FINAL', detalle.goles_local ?? 0, detalle.goles_visitante ?? 0],
    ],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', cellPadding: 1 },
    headStyles: { fillColor: [60,60,60] },
    columnStyles: { 0: { cellWidth: 16, fontStyle: 'bold' } } });

  // Cargos visitante
  autoTable(doc, { startY: yMid, margin: { left: 142 }, tableWidth: 60,
    body: staffRows(staffVisita), theme: 'grid',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 18, fontStyle: 'bold' } } });

  // Árbitros
  const yFirmas = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  const arbs = detalle.arbitros ? detalle.arbitros.split(' / ') : [];
  doc.text(`ÁRBITRO 1: ${arbs[0] || '_____________________________'}`, marginLeft + 2, yFirmas);
  doc.text(`ÁRBITRO 2: ${arbs[1] || '_____________________________'}`, pageWidth / 2 + 5, yFirmas);

  // Sección de goles
  const yGolesTitle = yFirmas + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Registro de goles - Referencia (GJ - GC - GP - DP)', pageWidth / 2, yGolesTitle, { align: 'center' });

  const MIN_FILAS = 8;
  const mitad = Math.max(Math.ceil(golesOrdenados.length / 2), MIN_FILAS);
  const izq = golesOrdenados.slice(0, mitad);
  const der = golesOrdenados.slice(mitad);
  while (izq.length < mitad) izq.push({ equipo: '', camiseta: '', minuto: '', ref: '', parcialL: '', parcialV: '' });
  while (der.length < mitad) der.push({ equipo: '', camiseta: '', minuto: '', ref: '', parcialL: '', parcialV: '' });

  const drawGoles = (xPos: number, filas: typeof izq) => {
    autoTable(doc, {
      startY: yGolesTitle + 2,
      margin: { left: xPos, right: pageWidth - (xPos + colWidth) },
      head: [
        [{ content: 'EQUIPO', rowSpan: 2 }, { content: '# JUG', rowSpan: 2 }, { content: 'MIN', rowSpan: 2 }, { content: 'REF', rowSpan: 2 }, { content: 'PARCIAL', colSpan: 2 }],
        ['L', 'V'],
      ],
      body: filas.map(g => [g.equipo, g.camiseta, g.minuto, g.ref, g.parcialL, g.parcialV]),
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center', cellPadding: 1, lineColor: [0,0,0], lineWidth: 0.1 },
      headStyles: { fillColor: [80,80,80] },
      columnStyles: { 0: { cellWidth: 40, halign: 'left' }, 1: { cellWidth: 10 }, 2: { cellWidth: 10 }, 3: { cellWidth: 10 }, 4: { cellWidth: 9 }, 5: { cellWidth: 9 } },
    });
  };

  drawGoles(marginLeft, izq);
  drawGoles(pageWidth / 2 + 5, der);

  const yObs = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(9);
  doc.text('OBSERVACIONES:', marginLeft, yObs);
  doc.line(marginLeft, yObs + 1,  pageWidth - marginRight, yObs + 1);
  doc.line(marginLeft, yObs + 7,  pageWidth - marginRight, yObs + 7);
  doc.line(marginLeft, yObs + 13, pageWidth - marginRight, yObs + 13);

  doc.save(`Planilla_${detalle.equipo_local_nombre}_vs_${detalle.equipo_visitante_nombre}_COMPLETA.pdf`);
};