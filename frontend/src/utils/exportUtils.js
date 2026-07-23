import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  ShadingType,
} from "docx";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOptionLabel(correctAnswer, options = []) {
  if (correctAnswer === undefined || correctAnswer === null) return "N/A";

  if (typeof correctAnswer === "number" && options[correctAnswer]) {
    const label = String.fromCharCode(65 + correctAnswer);
    const optText =
      typeof options[correctAnswer] === "object"
        ? options[correctAnswer].text
        : options[correctAnswer];
    return `${label} (${optText})`;
  }

  if (
    typeof correctAnswer === "string" &&
    /^[A-D]$/i.test(correctAnswer.trim())
  ) {
    const letter = correctAnswer.trim().toUpperCase();
    const idx = letter.charCodeAt(0) - 65;
    if (options[idx]) {
      const optText =
        typeof options[idx] === "object" ? options[idx].text : options[idx];
      return `${letter} (${optText})`;
    }
    return letter;
  }

  const matchedIdx = options.findIndex((opt) => {
    const text = typeof opt === "object" ? opt.text : opt;
    return String(text).trim() === String(correctAnswer).trim();
  });

  if (matchedIdx !== -1) {
    const label = String.fromCharCode(65 + matchedIdx);
    return `${label} (${correctAnswer})`;
  }

  return String(correctAnswer);
}

function cleanFilename(rawName, defaultName = "Document") {
  if (!rawName) return defaultName;
  let name = String(rawName).trim();
  name = name.replace(/(\.(docx?|pdf|txt))+/gi, "");
  name = name.replace(/[/\\?%*:|"<>]/g, "_");
  return name || defaultName;
}

/**
 * Generate Quiz HTML string for PDF rendering (English)
 */
export function generateQuizHTML(quiz, answerMode = "separate") {
  const title = quiz.title || quiz.name || quiz.topic || "Quiz Assessment";
  const description = quiz.description || "";
  const questions = quiz.questions || quiz.quizItems || [];

  let bodyContent = `
    <div style="font-family: 'Segoe UI', Arial, Roboto, sans-serif; padding: 24px; color: #1e293b; background: #ffffff; width: 720px; margin: 0 auto;">
      <h1 style="color: #f26522; font-size: 22px; font-weight: 800; border-bottom: 3px solid #f26522; padding-bottom: 8px; margin-bottom: 8px;">
        ${escapeHtml(title)}
      </h1>
      ${
        description
          ? `<p style="color: #64748b; font-style: italic; margin-bottom: 16px; font-size: 13px;">${escapeHtml(description)}</p>`
          : ""
      }
      <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Total questions: <strong style="color: #0f172a;">${questions.length}</strong> questions</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
  `;

  questions.forEach((q, index) => {
    const qText = q.content || q.question || q.questionText || `Question ${index + 1}`;
    const options = q.options || [];
    const correctAnswer = q.correctAnswer;
    const explanation = q.explanation;

    bodyContent += `
      <div style="margin-bottom: 18px; page-break-inside: avoid;">
        <p style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px;">
          <span style="color: #f26522; margin-right: 6px;">Question ${index + 1}:</span> ${escapeHtml(qText)}
        </p>
        <div style="margin-left: 16px;">
    `;

    options.forEach((opt, optIdx) => {
      const label = String.fromCharCode(65 + optIdx);
      const optText = typeof opt === "object" ? opt.text || opt.content || "" : opt;

      const isCorrect =
        answerMode === "inline" &&
        (optText === correctAnswer ||
          label === correctAnswer ||
          optIdx === correctAnswer ||
          String(optIdx) === String(correctAnswer));

      bodyContent += `
        <p style="margin: 4px 0; color: ${
          isCorrect ? "#16a34a" : "#334155"
        }; font-weight: ${isCorrect ? "bold" : "normal"}; font-size: 13px;">
          <strong style="color: ${isCorrect ? "#16a34a" : "#475569"};">${label}.</strong> ${escapeHtml(optText)} ${
        isCorrect ? " ✔" : ""
      }
        </p>
      `;
    });

    bodyContent += `</div>`;

    if (answerMode === "inline" && (correctAnswer !== undefined || explanation)) {
      bodyContent += `
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 8px 12px; margin-top: 8px; border-radius: 6px;">
          ${
            correctAnswer !== undefined
              ? `<p style="margin: 0; color: #15803d; font-weight: bold; font-size: 12px;">Correct Answer: ${escapeHtml(getOptionLabel(correctAnswer, options))}</p>`
              : ""
          }
          ${
            explanation
              ? `<p style="margin: 4px 0 0 0; color: #166534; font-size: 12px;">Explanation: ${escapeHtml(explanation)}</p>`
              : ""
          }
        </div>
      `;
    }

    bodyContent += `</div>`;
  });

  if (answerMode === "separate") {
    bodyContent += `
      <div style="page-break-before: always; margin-top: 30px; padding-top: 10px;">
        <h2 style="color: #f26522; font-size: 17px; font-weight: 700; border-bottom: 2px solid #f26522; padding-bottom: 6px; margin-bottom: 14px;">
          ANSWER KEY AND EXPLANATIONS
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f26522; color: #ffffff;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 80px; font-size: 12px;">Question</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 110px; font-size: 12px;">Answer</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px;">Explanation / Notes</th>
            </tr>
          </thead>
          <tbody>
    `;

    questions.forEach((q, index) => {
      const options = q.options || [];
      const correctAnswer = q.correctAnswer;
      const explanation = q.explanation || "No detailed explanation provided.";
      const ansLabel = getOptionLabel(correctAnswer, options);

      bodyContent += `
        <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Q${index + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; color: #16a34a; font-size: 12px;">${escapeHtml(ansLabel)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; color: #334155; font-size: 12px; line-height: 1.4;">${escapeHtml(explanation)}</td>
        </tr>
      `;
    });

    bodyContent += `
          </tbody>
        </table>
      </div>
    `;
  }

  bodyContent += `</div>`;
  return bodyContent;
}

/**
 * Generate Flashcard HTML string for PDF rendering (English)
 */
export function generateFlashcardHTML(flashcardSet) {
  const title = flashcardSet.title || flashcardSet.name || flashcardSet.topic || "Flashcard Study Set";
  const description = flashcardSet.description || "";
  const cards = flashcardSet.flashcards || flashcardSet.cards || flashcardSet.items || [];

  let bodyContent = `
    <div style="font-family: 'Segoe UI', Arial, Roboto, sans-serif; padding: 24px; color: #1e293b; background: #ffffff; width: 720px; margin: 0 auto;">
      <h1 style="color: #f26522; font-size: 22px; font-weight: 800; border-bottom: 3px solid #f26522; padding-bottom: 8px; margin-bottom: 8px;">
        ${escapeHtml(title)}
      </h1>
      ${
        description
          ? `<p style="color: #64748b; font-style: italic; margin-bottom: 16px; font-size: 13px;">${escapeHtml(description)}</p>`
          : ""
      }
      <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Total cards: <strong style="color: #0f172a;">${cards.length}</strong> cards</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        <thead>
          <tr style="background-color: #f26522; color: #ffffff;">
            <th style="border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; width: 35%; font-size: 13px;">Term</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; width: 65%; font-size: 13px;">Definition / Explanation</th>
          </tr>
        </thead>
        <tbody>
  `;

  cards.forEach((card, index) => {
    const term = card.term || card.front || card.question || `Card ${index + 1}`;
    const definition = card.definition || card.back || card.answer || "";

    bodyContent += `
      <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8fafc"}; page-break-inside: avoid;">
        <td style="border: 1px solid #cbd5e1; padding: 10px 12px; font-weight: bold; color: #0f172a; vertical-align: top; font-size: 13px;">
          ${escapeHtml(term)}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 12px; color: #334155; vertical-align: top; font-size: 13px; line-height: 1.5;">
          ${escapeHtml(definition)}
        </td>
      </tr>
    `;
  });

  bodyContent += `
        </tbody>
      </table>
    </div>
  `;

  return bodyContent;
}

/**
 * Generate and download native Microsoft Word .docx file (English)
 */
export async function downloadWord(filename, data, type = "quiz", answerMode = "separate") {
  const titleStr = data?.title || data?.name || data?.topic || (type === "quiz" ? "Quiz" : "Flashcard");
  const safeName = cleanFilename(filename || titleStr, "Document");
  const description = data?.description || "";
  
  const children = [];

  // Title
  children.push(
    new Paragraph({
      text: titleStr,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    })
  );

  if (description) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: description, italic: true, color: "64748B" })],
        spacing: { after: 240 },
      })
    );
  }

  if (type === "quiz") {
    const questions = data?.questions || data?.quizItems || [];
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Total questions: `, color: "64748B" }),
          new TextRun({ text: `${questions.length} questions`, bold: true, color: "1E293B" }),
        ],
        spacing: { after: 240 },
      })
    );

    questions.forEach((q, index) => {
      const qText = q.content || q.question || q.questionText || `Question ${index + 1}`;
      const options = q.options || [];
      const correctAnswer = q.correctAnswer;
      const explanation = q.explanation;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Question ${index + 1}: `, bold: true, color: "F26522" }),
            new TextRun({ text: qText, bold: true, color: "0F172A" }),
          ],
          spacing: { before: 180, after: 60 },
        })
      );

      options.forEach((opt, optIdx) => {
        const label = String.fromCharCode(65 + optIdx);
        const optText = typeof opt === "object" ? opt.text || opt.content || "" : opt;
        const isCorrect =
          answerMode === "inline" &&
          (optText === correctAnswer ||
            label === correctAnswer ||
            optIdx === correctAnswer ||
            String(optIdx) === String(correctAnswer));

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `    ${label}. `, bold: true, color: isCorrect ? "16A34A" : "334155" }),
              new TextRun({ text: optText, color: isCorrect ? "16A34A" : "334155", bold: isCorrect }),
              ...(isCorrect ? [new TextRun({ text: "  ✔", bold: true, color: "16A34A" })] : []),
            ],
            spacing: { after: 40 },
          })
        );
      });

      if (answerMode === "inline" && (correctAnswer !== undefined || explanation)) {
        const ansLabel = getOptionLabel(correctAnswer, options);
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Correct Answer: ${ansLabel}`, bold: true, color: "15803D" }),
              ...(explanation ? [new TextRun({ text: `\nExplanation: ${explanation}`, color: "166534" })] : []),
            ],
            spacing: { before: 80, after: 160 },
          })
        );
      }
    });

    if (answerMode === "separate") {
      children.push(
        new Paragraph({
          text: "ANSWER KEY AND EXPLANATIONS",
          heading: HeadingLevel.HEADING_2,
          pageBreakBefore: true,
          spacing: { before: 240, after: 180 },
        })
      );

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: "F26522", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Question", bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { fill: "F26522", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Answer", bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              shading: { fill: "F26522", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Explanation / Notes", bold: true, color: "FFFFFF" })] })],
            }),
          ],
        }),
      ];

      questions.forEach((q, index) => {
        const options = q.options || [];
        const correctAnswer = q.correctAnswer;
        const explanation = q.explanation || "No detailed explanation provided.";
        const ansLabel = getOptionLabel(correctAnswer, options);

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `Q${index + 1}`, bold: true })], alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: ansLabel, bold: true, color: "16A34A" })], alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: explanation, color: "334155" })] })],
              }),
            ],
          })
        );
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );
    }
  } else {
    // Flashcard
    const cards = data?.flashcards || data?.cards || data?.items || [];
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Total cards: `, color: "64748B" }),
          new TextRun({ text: `${cards.length} cards`, bold: true, color: "1E293B" }),
        ],
        spacing: { after: 240 },
      })
    );

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: "F26522", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Term", bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { fill: "F26522", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Definition / Explanation", bold: true, color: "FFFFFF" })] })],
          }),
        ],
      }),
    ];

    cards.forEach((card, index) => {
      const term = card.term || card.front || card.question || `Card ${index + 1}`;
      const definition = card.definition || card.back || card.answer || "";

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: term, bold: true, color: "0F172A" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: definition, color: "334155" })] })],
            }),
          ],
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Direct PDF Download (no blank page, no popup window)
 */
export async function downloadPDF(filename, htmlContent) {
  const safeName = cleanFilename(filename, "Document");

  // Create temporary container positioned behind body z-index but fully opaque (opacity 1) for full text contrast
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "750px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#1e293b";
  container.style.padding = "24px";
  container.style.margin = "0";
  container.style.opacity = "1";
  container.style.visibility = "visible";
  container.style.zIndex = "-9999";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
    await new Promise((r) => setTimeout(r, 200));

    const dataUrl = await toPng(container, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      style: {
        opacity: "1",
        visibility: "visible",
      },
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (img.height * imgWidth) / img.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${safeName}.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
