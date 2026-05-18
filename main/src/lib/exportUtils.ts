import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportToPDF = async (elementId: string, filename: string = "Report.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Export element not found");
    toast.error("Export element not found");
    return;
  }

  try {
    toast.info("Generating PDF...");
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
    toast.success("PDF exported successfully!");
  } catch (error) {
    console.error("PDF Export failed:", error);
    toast.error("PDF Export failed");
  }
};

export const simulateEmailSend = async (to: string, subject?: string, message?: string) => {
  toast.info("Sending email...");
  return new Promise((resolve) => {
    setTimeout(() => {
      toast.success(`Email sent to ${to}!`);
      resolve(true);
    }, 1500);
  });
};


