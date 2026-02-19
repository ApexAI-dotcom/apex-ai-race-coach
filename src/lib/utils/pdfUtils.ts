/**
 * Apex AI - PDF Utilities
 * Fonctions utilitaires pour générer des PDFs professionnels
 */

import jsPDF from "jspdf";
import type { jsPDF } from "jspdf";

/**
 * Charge une image depuis une URL et la convertit en base64
 */
export const loadImageFromUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Ajoute le header Apex AI rouge sur une page PDF
 */
export const addApexHeader = (doc: jsPDF) => {
  doc.setFillColor(239, 68, 68); // Rouge Apex
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("APEX AI", 20, 25);
  doc.setFontSize(16);
  doc.text("RAPPORT D'ANALYSE COMPLET", 20, 35);
};

/**
 * Ajoute le footer Apex AI bleu sur toutes les pages
 */
export const addFooter = (doc: jsPDF, pageCount: number) => {
  const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(30, 58, 138); // Bleu footer
  doc.rect(0, pageHeight - 30, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Apex AI SARL - contact@apexai.run - www.apexai.run", 20, pageHeight - 15);
  doc.text(`Page ${pageNum}/${pageCount}`, 180, pageHeight - 15, { align: "right" });
};
