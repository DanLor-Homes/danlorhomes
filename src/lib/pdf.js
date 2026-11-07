import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const safeName = (value) =>
  String(value || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'documento';

export async function downloadElementAsPdf(element, filename = 'documento') {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    width: element.scrollWidth,
    height: element.scrollHeight,
  });

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const imageData = canvas.toDataURL('image/jpeg', 0.95);

  pdf.addImage(imageData, 'JPEG', 0, 0, imageWidth, imageHeight);

  let rendered = pageHeight;
  while (rendered < imageHeight) {
    pdf.addPage();
    pdf.addImage(imageData, 'JPEG', 0, -rendered, imageWidth, imageHeight);
    rendered += pageHeight;
  }

  pdf.save(`${safeName(filename)}.pdf`);
}