
import { jsPDF } from 'jspdf';
import { Report } from '../types';

// Nuevo Logo oficial de Caishen Capital Group
const LOGO_URL = 'https://i.ibb.co/Gfsh5zj9/Captura-de-pantalla-2025-02-18-a-la-s-6-20-39-p-m.png';

const addInstitutionalHeader = (doc: jsPDF, title: string) => {
  const marginX = 20;
  
  doc.setTextColor(29, 28, 45); 
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CAISHEN CAPITAL GROUP S.A.S.', marginX, 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.text(title.toUpperCase(), marginX, 31);

  try {
    // Se usa el nuevo logo en formato contenedor para evitar distorsiones
    doc.addImage(LOGO_URL, 'PNG', 150, 12, 18, 18);
  } catch (e) {
    console.warn("No se pudo cargar el logo en el PDF", e);
  }

  doc.setDrawColor(206, 255, 4);
  doc.setLineWidth(0.6);
  doc.line(marginX, 38, 190, 38);
};

const addFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Este documento es una certificación electrónica oficial de Caishen Capital Group S.A.S. - Página ${i} de ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
    doc.text(
      `Generado el: ${new Date().toLocaleString('es-ES')}`,
      105,
      289,
      { align: 'center' }
    );
  }
};

export const generateReportPDF = async (report: Report) => {
  const doc = new jsPDF();
  const marginX = 20;
  
  addInstitutionalHeader(doc, `Reporte Institucional: ${report.category}`);
  
  let cursorY = 55;
  
  doc.setTextColor(29, 28, 45);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(report.title.toUpperCase(), 170);
  doc.text(titleLines, marginX, cursorY);
  cursorY += (titleLines.length * 10) + 5;
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Emisión: ${report.date}   |   Clasificación: Confidencial / Accionistas`, marginX, cursorY);
  cursorY += 15;
  
  if (report.highlight) {
    doc.setFillColor(250, 250, 250);
    doc.rect(marginX - 2, cursorY - 5, 174, 18, 'F');
    doc.setDrawColor(206, 255, 4);
    doc.setLineWidth(1);
    doc.line(marginX - 2, cursorY - 5, marginX - 2, cursorY + 13);
    
    doc.setTextColor(29, 28, 45);
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(11);
    const highlightLines = doc.splitTextToSize(report.highlight, 160);
    doc.text(highlightLines, marginX + 5, cursorY + 5);
    cursorY += (highlightLines.length * 7) + 20;
  }
  
  report.sections?.forEach((section, index) => {
    if (cursorY > 250) {
      doc.addPage();
      addInstitutionalHeader(doc, `Continuación: ${report.title}`);
      cursorY = 55;
    }
    
    doc.setTextColor(29, 28, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${index + 1}. ${section.titulo}`, marginX, cursorY);
    cursorY += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    section.parrafos?.forEach(p => {
      const splitText = doc.splitTextToSize(p, 170);
      if (cursorY + (splitText.length * 6) > 275) {
        doc.addPage();
        addInstitutionalHeader(doc, `Continuación: ${report.title}`);
        cursorY = 55;
      }
      doc.text(splitText, marginX, cursorY);
      cursorY += (splitText.length * 6) + 6;
    });
    
    section.items?.forEach(item => {
      doc.setDrawColor(206, 255, 4);
      doc.circle(marginX + 2, cursorY - 1, 0.8, 'F');
      doc.text(item, marginX + 6, cursorY);
      cursorY += 7;
    });
    
    cursorY += 12;
  });

  addFooter(doc);
  doc.save(`Reporte_CCG_${report.id}.pdf`);
};

export const generateShareholderStatementPDF = async (user: any, stats: any, year: number) => {
  const doc = new jsPDF();
  const marginX = 20;
  
  addInstitutionalHeader(doc, `Extracto Individual de Participación - Periodo ${year}`);
  
  let cursorY = 60;
  
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(marginX, cursorY, 170, 45, 4, 4, 'FD');
  
  doc.setTextColor(29, 28, 45);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CAISHEN CAPITAL GROUP', marginX + 10, cursorY + 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`IDENTIFICADOR ÚNICO (UID): ${user.uid}`, marginX + 10, cursorY + 25);
  doc.text(`CORREO ELECTRÓNICO: ${user.email}`, marginX + 10, cursorY + 31);
  doc.text(`ESTADO DE CUENTA: CERTIFICADA / ${user.status.toUpperCase()}`, marginX + 10, cursorY + 37);
  
  cursorY += 65;
  
  doc.setTextColor(29, 28, 45);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO DE CAPITALIZACIÓN', marginX, cursorY);
  cursorY += 6;

  const financialRows = [
    ['Acciones Poseídas', `${user.shares} Unidades`],
    ['Participación en el Fondo', `${stats.participation}%`],
    ['Valor Nominal del Capital', `$${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`],
    [`Rendimiento Acumulado ${year}`, `${(stats.totalYield * 100).toFixed(2)}%`],
    [`Utilidad Neta Generada ${year}`, `$${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`]
  ];

  const boxHeight = (financialRows.length * 10) + 5;
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(254, 254, 254);
  doc.roundedRect(marginX, cursorY, 170, boxHeight, 3, 3, 'FD');

  cursorY += 8;
  financialRows.forEach((row, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 100);
    doc.text(row[0], marginX + 8, cursorY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 28, 45);
    doc.text(row[1], 182, cursorY, { align: 'right' });

    if (index < financialRows.length - 1) {
      doc.setDrawColor(245, 245, 245);
      doc.line(marginX + 8, cursorY + 3, 182, cursorY + 3);
    }
    cursorY += 10;
  });
  
  cursorY += 15;
  
  if (cursorY > 200) {
    doc.addPage();
    addInstitutionalHeader(doc, `Detalle de Liquidaciones - Periodo ${year}`);
    cursorY = 55;
  }
  
  doc.setTextColor(29, 28, 45);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE LIQUIDACIONES MENSUALES', marginX, cursorY);
  cursorY += 10;
  
  doc.setFillColor(248, 249, 250);
  doc.rect(marginX, cursorY, 170, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('MES OPERATIVO', marginX + 5, cursorY + 6.5);
  doc.text('RENTABILIDAD', 80, cursorY + 6.5);
  doc.text('UTILIDAD USD', 125, cursorY + 6.5);
  doc.text('ESTADO PAGO', 165, cursorY + 6.5);
  
  cursorY += 18;
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  stats.yearData.sort((a: any, b: any) => parseInt(a.MES) - parseInt(b.MES)).forEach((d: any) => {
    if (cursorY > 265) {
      doc.addPage();
      addInstitutionalHeader(doc, `Continuación Liquidaciones - ${year}`);
      cursorY = 55;
      
      doc.setFillColor(248, 249, 250);
      doc.rect(marginX, cursorY, 170, 10, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('MES OPERATIVO', marginX + 5, cursorY + 6.5);
      doc.text('RENTABILIDAD', 80, cursorY + 6.5);
      doc.text('UTILIDAD USD', 125, cursorY + 6.5);
      doc.text('ESTADO PAGO', 165, cursorY + 6.5);
      cursorY += 18;
    }

    const mes = months[parseInt(d.MES) - 1];
    const rent = (parseFloat(d.RENTABILIDAD_MES_PCT) * 100).toFixed(2) + '%';
    const util = '$' + parseFloat(d.UTILIDAD_NETA_USD).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const status = d.ESTATUS_PAGO || 'PENDIENTE';
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(mes, marginX + 5, cursorY);
    doc.text(rent, 80, cursorY);
    doc.text(util, 125, cursorY);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 28, 45);
    doc.text(status, 165, cursorY);
    
    doc.setDrawColor(245, 245, 245);
    doc.line(marginX, cursorY + 2, 190, cursorY + 2);
    cursorY += 10;
  });
  
  let certificationY = Math.min(cursorY + 20, 250);
  
  if (cursorY > 240) {
    doc.addPage();
    addInstitutionalHeader(doc, `Certificación Final - ${year}`);
    certificationY = 60;
  }
  
  doc.setDrawColor(206, 255, 4);
  doc.setLineWidth(0.8);
  doc.line(75, certificationY, 135, certificationY);
  
  doc.setFontSize(9);
  doc.setTextColor(29, 28, 45);
  doc.setFont('helvetica', 'bold');
  doc.text('COMITÉ TÉCNICO OPERATIVO', 105, certificationY + 7, { align: 'center' });

  addFooter(doc);
  doc.save(`Extracto_CCG_${user.uid}_${year}.pdf`);
};
