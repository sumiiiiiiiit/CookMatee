import jsPDF from 'jspdf';
import { getImageUrl } from 'lib/api';

export const exportRecipeToPDF = async (recipe, allergens = []) => {
    if (!recipe) {
        throw new Error('Recipe data not available');
    }

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        let yPosition = margin;

        // Helper function to add text with word wrap
        const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            pdf.setTextColor(...color);
            const lines = pdf.splitTextToSize(text, contentWidth);

            if (yPosition + (lines.length * fontSize * 0.35) > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }

            pdf.text(lines, margin, yPosition);
            yPosition += lines.length * fontSize * 0.35 + 3;
        };

        // Add decorative header line
        pdf.setDrawColor(255, 153, 0); // Orange color
        pdf.setLineWidth(1);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Title
        addText(recipe.title.toUpperCase(), 24, true, [26, 26, 26]);
        yPosition += 2;

        // Chef name
        addText(`By Chef ${recipe.user?.name || recipe.chefName}`, 12, false, [100, 100, 100]);
        yPosition += 3;

        // Add Recipe Photo
        if (recipe.image) {
            try {
                const imgUrl = getImageUrl(recipe.image);
                const response = await fetch(imgUrl);
                const blob = await response.blob();
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });

                const imgProps = pdf.getImageProperties(dataUrl);
                const maxWidth = contentWidth;
                const maxHeight = 80; // Limit height to avoid taking over the whole page
                let imgWidth = imgProps.width;
                let imgHeight = imgProps.height;

                // Scale image
                const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                imgWidth *= ratio;
                imgHeight *= ratio;

                if (yPosition + imgHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.addImage(dataUrl, 'JPEG', (pageWidth - imgWidth) / 2, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10;
            } catch (err) {
                console.warn('Image skip in PDF:', err);
            }
        }

        // Category & Price
        pdf.setFillColor(255, 153, 0);
        pdf.roundedRect(margin, yPosition, 40, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(recipe.category, margin + 20, yPosition + 5.5, { align: 'center' });

        if (recipe.isPremium) {
            pdf.setFillColor(26, 26, 26);
            pdf.roundedRect(margin + 45, yPosition, 45, 8, 2, 2, 'F');
            pdf.setTextColor(251, 191, 36);
            pdf.text(`PREMIUM - Rs. ${recipe.price}`, margin + 67.5, yPosition + 5.5, { align: 'center' });
        }
        yPosition += 12;

        // Cooking info section
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Time and Difficulty
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');

        const timeText = `⏱ Cooking Time: ${recipe.cookingTime}`;
        pdf.text(timeText, margin, yPosition);

        const difficultyStars = '★'.repeat(recipe.difficulty) + '☆'.repeat(5 - recipe.difficulty);
        const difficultyText = `Difficulty: ${difficultyStars}`;
        pdf.text(difficultyText, margin, yPosition + 6);
        yPosition += 15;

        // Allergen Info Section (AI)
        if (allergens && allergens.length > 0) {
            pdf.setFillColor(254, 242, 242); // bg-red-50
            pdf.setDrawColor(254, 202, 202); // border-red-200
            pdf.roundedRect(margin, yPosition, contentWidth, (allergens.length * 8) + 15, 3, 3, 'FD');

            yPosition += 8;
            pdf.setTextColor(153, 27, 27); // text-red-900
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('⚠️ POTENTIAL ALLERGENS (AI DETECTED)', margin + 5, yPosition);
            yPosition += 7;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            allergens.forEach(item => {
                const allergenText = `• ${item.allergen.toUpperCase()}: Detected in (${item.detected_ingredients.join(', ')})`;
                pdf.text(allergenText, margin + 8, yPosition);
                yPosition += 7;
            });
            yPosition += 5;
        }

        // Divider
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Ingredients Section
        pdf.setTextColor(255, 153, 0);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INGREDIENTS', margin, yPosition);
        yPosition += 8;

        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');

        if (recipe.ingredients && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach((ingredient) => {
                if (yPosition > pageHeight - margin - 10) {
                    pdf.addPage();
                    yPosition = margin;
                }
                const bulletText = `• ${ingredient}`;
                const lines = pdf.splitTextToSize(bulletText, contentWidth - 5);
                pdf.text(lines, margin + 2, yPosition);
                yPosition += lines.length * 5;
            });
        }
        yPosition += 8;

        // Steps Section
        pdf.setTextColor(255, 153, 0);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('COOKING STEPS', margin, yPosition);
        yPosition += 8;

        if (recipe.steps) {
            const steps = recipe.steps.split('\n').filter(s => s.trim());
            steps.forEach((step, index) => {
                const stepLines = pdf.splitTextToSize(step, contentWidth - 15);
                const stepHeight = stepLines.length * 5 + 6;

                if (yPosition + stepHeight > pageHeight - margin - 10) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.setFillColor(50, 50, 50);
                pdf.circle(margin + 4, yPosition - 1, 4, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${index + 1}`, margin + 4, yPosition + 1, { align: 'center' });

                pdf.setTextColor(60, 60, 60);
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');
                pdf.text(stepLines, margin + 12, yPosition);
                yPosition += stepHeight;
            });
        }

        // Footer
        pdf.setDrawColor(255, 153, 0);
        pdf.setLineWidth(0.5);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Generated from CookMate Platform • AI Allergen Analysis Included', pageWidth / 2, pageHeight - 10, { align: 'center' });

        const fileName = `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error('PDF Export error:', error);
        throw error;
    }
};
