import jsPDF from 'jspdf';

export const exportRecipeToPDF = async (recipe) => {
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

        // Category badge
        pdf.setFillColor(255, 153, 0);
        pdf.roundedRect(margin, yPosition, 40, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(recipe.category, margin + 20, yPosition + 5.5, { align: 'center' });
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
                // Check if we need a new page
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

        // Divider
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Steps Section
        pdf.setTextColor(255, 153, 0);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('COOKING STEPS', margin, yPosition);
        yPosition += 8;

        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(11);

        if (recipe.steps) {
            const steps = recipe.steps.split('\n').filter(s => s.trim());
            steps.forEach((step, index) => {
                // Check if we need a new page
                if (yPosition > pageHeight - margin - 20) {
                    pdf.addPage();
                    yPosition = margin;
                }

                // Step number circle
                pdf.setFillColor(50, 50, 50);
                pdf.circle(margin + 4, yPosition - 1, 4, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${index + 1}`, margin + 4, yPosition + 1, { align: 'center' });

                // Step text
                pdf.setTextColor(60, 60, 60);
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');
                const stepLines = pdf.splitTextToSize(step, contentWidth - 15);
                pdf.text(stepLines, margin + 12, yPosition);
                yPosition += stepLines.length * 5 + 6;
            });
        }

        // Footer
        yPosition = pageHeight - 15;
        pdf.setDrawColor(255, 153, 0);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Generated from CookMate Recipe Platform', pageWidth / 2, yPosition + 5, { align: 'center' });

        // Save the PDF
        const fileName = `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`;

        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'PDF Document',
                        accept: { 'application/pdf': ['.pdf'] },
                    }],
                });
                const writable = await handle.createWritable();
                const pdfBlob = pdf.output('blob');
                await writable.write(pdfBlob);
                await writable.close();
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('File system access denied, falling back to direct download.', err);
            }
        }

        pdf.save(fileName);
    } catch (error) {
        console.error('PDF Export error:', error);
        throw error;
    }
};
