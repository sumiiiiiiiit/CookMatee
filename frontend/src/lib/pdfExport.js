import jsPDF from 'jspdf';
import { getImageUrl } from 'lib/api';

export const exportRecipeToPDF = async (recipe, allergens = []) => {
  if (!recipe) throw new Error('Recipe data not available');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addText = (text, fontSize, bold = false, color = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, contentWidth);
    if (y + lines.length * fontSize * 0.35 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, margin, y);
    y += lines.length * fontSize * 0.35 + 3;
  };

  pdf.setDrawColor(255, 153, 0);
  pdf.setLineWidth(1);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  addText(recipe.title.toUpperCase(), 24, true, [26, 26, 26]);
  y += 2;
  addText(`By Chef ${recipe.user?.name || recipe.chefName}`, 12, false, [100, 100, 100]);
  y += 3;

  if (recipe.image) {
    try {
      const response = await fetch(getImageUrl(recipe.image));
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const maxWidth = contentWidth;
      const maxHeight = 80;
      const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;

      if (y + imgHeight > pageHeight - margin) { pdf.addPage(); y = margin; }
      pdf.addImage(dataUrl, 'JPEG', (pageWidth - imgWidth) / 2, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    } catch {
      // Skip image if fetch fails
    }
  }

  pdf.setFillColor(255, 153, 0);
  pdf.roundedRect(margin, y, 40, 8, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(recipe.category, margin + 20, y + 5.5, { align: 'center' });

  if (recipe.isPremium) {
    pdf.setFillColor(26, 26, 26);
    pdf.roundedRect(margin + 45, y, 45, 8, 2, 2, 'F');
    pdf.setTextColor(251, 191, 36);
    pdf.text(`PREMIUM - Rs. ${recipe.price}`, margin + 67.5, y + 5.5, { align: 'center' });
  }
  y += 12;

  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`⏱ Cooking Time: ${recipe.cookingTime}`, margin, y);

  if (recipe.cookingMethod) {
    const method = Array.isArray(recipe.cookingMethod)
      ? recipe.cookingMethod.join(', ')
      : String(recipe.cookingMethod);
    pdf.text(`🔥 Method: ${method.replace('_', ' ').toUpperCase()}`, margin + 80, y);
  }

  const stars = '★'.repeat(recipe.difficulty) + '☆'.repeat(5 - recipe.difficulty);
  pdf.text(`Difficulty: ${stars}`, margin, y + 6);
  y += 15;

  if (allergens?.length > 0) {
    pdf.setFillColor(254, 242, 242);
    pdf.setDrawColor(254, 202, 202);
    pdf.roundedRect(margin, y, contentWidth, allergens.length * 8 + 15, 3, 3, 'FD');
    y += 8;
    pdf.setTextColor(153, 27, 27);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('⚠️ POTENTIAL ALLERGENS (AI DETECTED)', margin + 5, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    allergens.forEach((item) => {
      pdf.text(`• ${item.allergen.toUpperCase()}: Detected in (${item.detected_ingredients.join(', ')})`, margin + 8, y);
      y += 7;
    });
    y += 5;
  }

  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  pdf.setTextColor(255, 153, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INGREDIENTS', margin, y);
  y += 8;

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  recipe.ingredients?.forEach((ingredient) => {
    if (y > pageHeight - margin - 10) { pdf.addPage(); y = margin; }
    const name = typeof ingredient === 'string' ? ingredient : ingredient.name || '';
    const qty = ingredient.quantity ? ` - ${ingredient.quantity}` : '';
    const lines = pdf.splitTextToSize(`• ${name}${qty}`, contentWidth - 5);
    pdf.text(lines, margin + 2, y);
    y += lines.length * 5;
  });
  y += 8;

  pdf.setTextColor(255, 153, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COOKING STEPS', margin, y);
  y += 8;

  if (recipe.steps) {
    const steps = recipe.steps.split('\n').filter((s) => s.trim());
    steps.forEach((step, index) => {
      const lines = pdf.splitTextToSize(step, contentWidth - 15);
      const stepHeight = lines.length * 5 + 6;
      if (y + stepHeight > pageHeight - margin - 10) { pdf.addPage(); y = margin; }

      pdf.setFillColor(50, 50, 50);
      pdf.circle(margin + 4, y - 1, 4, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}`, margin + 4, y + 1, { align: 'center' });

      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(lines, margin + 12, y);
      y += stepHeight;
    });
  }

  pdf.setDrawColor(255, 153, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Generated from CookMate Platform • AI Allergen Analysis Included', pageWidth / 2, pageHeight - 10, { align: 'center' });

  const fileName = `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`;
  pdf.save(fileName);
};
