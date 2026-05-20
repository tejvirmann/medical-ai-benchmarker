from fpdf import FPDF
from datetime import datetime
from schema import BenchmarkRun


def _safe(text: str) -> str:
    """Replace characters outside latin-1 so fpdf Helvetica doesn't error."""
    return (
        text.replace("—", " - ")   # em dash
            .replace("–", " - ")   # en dash
            .replace("’", "'")     # right single quote
            .replace("“", '"')     # left double quote
            .replace("”", '"')     # right double quote
            .encode("latin-1", errors="replace")
            .decode("latin-1")
    )


class MedBenchReport(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 41, 59)  # slate-900
        self.cell(0, 10, "MedBench Clinical AI Evaluation Report", align="L")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 10, f"Generated {datetime.now().strftime('%B %d, %Y')}", align="R")
        self.ln(4)
        self.set_draw_color(226, 232, 240)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(148, 163, 184)
        self.cell(
            0, 10,
            "DISCLAIMER: MedBench provides evaluation tools only. Results do not constitute "
            "clinical recommendations. Deployment decisions remain the responsibility of the "
            "institution's clinical governance committee.",
            align="C",
        )


def generate_pdf(run: BenchmarkRun) -> bytes:
    pdf = MedBenchReport()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title block
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 10, "AI Model Evaluation Report", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 7, "Task: Pneumonia Detection  ·  Modality: Chest X-Ray  ·  Population: Adult ICU", ln=True)
    pdf.cell(0, 7, f"Cases evaluated: {run.n_cases}  ·  Run ID: {run.id}", ln=True)
    pdf.ln(6)

    # Summary box
    pdf.set_fill_color(241, 245, 249)
    pdf.set_draw_color(226, 232, 240)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, "Executive Summary", ln=True, fill=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(51, 65, 85)
    if run.summary:
        pdf.multi_cell(0, 6, _safe(run.summary))
    pdf.ln(4)

    # Results table
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, "Model Comparison", ln=True)
    pdf.ln(2)

    # Table header
    cols = [52, 22, 28, 28, 60]
    headers = ["Model", "AUC", "Sensitivity", "Specificity", "Bias Status"]
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(248, 250, 252)
    pdf.set_text_color(71, 85, 105)
    for w, h in zip(cols, headers):
        pdf.cell(w, 8, h, border=1, fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 8)
    for r in (run.results or []):
        pdf.set_text_color(30, 41, 59)
        pdf.cell(cols[0], 8, r.model_name, border=1)
        pdf.cell(cols[1], 8, f"{r.auc:.3f}", border=1, align="C")
        pdf.cell(cols[2], 8, f"{r.sensitivity*100:.1f}%", border=1, align="C")
        pdf.cell(cols[3], 8, f"{r.specificity*100:.1f}%", border=1, align="C")
        status = _safe(f"FLAGGED: {r.bias_description}") if r.bias_flagged else "No gaps detected"
        pdf.set_text_color(185, 28, 28) if r.bias_flagged else pdf.set_text_color(21, 128, 61)
        pdf.cell(cols[4], 8, status, border=1)
        pdf.set_text_color(30, 41, 59)
        pdf.ln()

    pdf.ln(6)

    # Subgroup detail
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, "Subgroup Performance Detail", ln=True)
    pdf.ln(2)

    for r in (run.results or []):
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(67, 56, 202)
        pdf.cell(0, 7, r.model_name, ln=True)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(71, 85, 105)
        for sg in r.subgroups:
            label = _safe(f"  {sg.group_name.replace('_', ' ').title()} - {sg.group_value}")
            pdf.cell(70, 6, label)
            pdf.cell(25, 6, f"AUC: {sg.auc:.3f}")
            pdf.cell(30, 6, f"Sens: {sg.sensitivity*100:.1f}%")
            pdf.cell(30, 6, f"Spec: {sg.specificity*100:.1f}%")
            pdf.cell(20, 6, f"n={sg.n}", ln=True)
        pdf.ln(2)

    # Methodology
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, "Methodology", ln=True)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(
        0, 5,
        "All models were evaluated on the same labeled validation dataset using identical preprocessing "
        "pipelines. AUC computed via sklearn.metrics.roc_auc_score. Subgroup bias flagged when any "
        "subgroup AUC deviates from overall AUC by more than 0.05. Sensitivity and specificity computed "
        "at a prediction threshold of 0.50. This report was generated by MedBench v0.1 (POC)."
    )

    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 7, "Governance Sign-off", ln=True)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(100, 116, 139)
    for role in ["Clinical Lead", "AI Governance Committee Chair", "CISO / IT Security"]:
        pdf.cell(80, 14, f"{role}: _______________________________")
        pdf.cell(60, 14, "Date: _______________", ln=True)

    return bytes(pdf.output())
