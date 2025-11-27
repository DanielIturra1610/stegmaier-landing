package adapters

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/ports"
	"github.com/jung-kurt/gofpdf"
	"github.com/google/uuid"
)

// PDFGenerator implements the CertificateGenerator interface using gofpdf
type PDFGenerator struct {
	// Configuration fields
	pageWidth  float64
	pageHeight float64
	fontSize   struct {
		title    float64
		subtitle float64
		body     float64
		footer   float64
	}
}

// NewPDFGenerator creates a new PDF generator with default settings
func NewPDFGenerator() ports.CertificateGenerator {
	gen := &PDFGenerator{
		pageWidth:  297.0, // A4 landscape width in mm
		pageHeight: 210.0, // A4 landscape height in mm
	}

	// Configure font sizes
	gen.fontSize.title = 32
	gen.fontSize.subtitle = 18
	gen.fontSize.body = 14
	gen.fontSize.footer = 10

	return gen
}

// GeneratePDF generates a PDF certificate with professional layout
func (g *PDFGenerator) GeneratePDF(ctx context.Context, certificate *domain.Certificate, template *domain.CertificateTemplate, data map[string]interface{}) ([]byte, error) {
	// Create PDF in landscape orientation (A4)
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(false, 0)
	pdf.AddPage()

	// Set margins
	leftMargin := 20.0
	rightMargin := 20.0
	topMargin := 30.0

	// Add decorative border
	g.addDecorativeBorder(pdf)

	// Add header logo/institution name
	pdf.SetFont("Arial", "B", 16)
	pdf.SetTextColor(44, 62, 80) // Dark blue-gray
	pdf.SetXY(leftMargin, topMargin)

	// Institution name from data or default
	institutionName := "Stegmaier Learning Platform"
	if name, ok := data["institution_name"].(string); ok && name != "" {
		institutionName = name
	}
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 10, institutionName, "", 0, "C", false, 0, "")

	// Add "Certificate of Completion" title
	pdf.SetFont("Arial", "B", float64(g.fontSize.title))
	pdf.SetTextColor(41, 128, 185) // Blue
	pdf.SetXY(leftMargin, topMargin+20)
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 15, "Certificate of Completion", "", 0, "C", false, 0, "")

	// Add decorative line
	pdf.SetDrawColor(41, 128, 185)
	pdf.SetLineWidth(0.5)
	lineY := topMargin + 37
	lineMargin := 80.0
	pdf.Line(lineMargin, lineY, g.pageWidth-lineMargin, lineY)

	// Add "This certifies that" text
	pdf.SetFont("Arial", "I", float64(g.fontSize.subtitle))
	pdf.SetTextColor(52, 73, 94)
	pdf.SetXY(leftMargin, lineY+15)
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 10, "This certifies that", "", 0, "C", false, 0, "")

	// Add student name (larger, emphasized)
	pdf.SetFont("Arial", "B", 24)
	pdf.SetTextColor(44, 62, 80)
	pdf.SetXY(leftMargin, lineY+30)

	// Get student name from data (required parameter)
	studentName := "Student Name"
	if name, ok := data["student_name"].(string); ok && name != "" {
		studentName = name
	}
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 12, studentName, "", 0, "C", false, 0, "")

	// Add "has successfully completed" text
	pdf.SetFont("Arial", "", float64(g.fontSize.subtitle))
	pdf.SetTextColor(52, 73, 94)
	pdf.SetXY(leftMargin, lineY+48)
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 10, "has successfully completed the course", "", 0, "C", false, 0, "")

	// Add course name (emphasized)
	pdf.SetFont("Arial", "B", 20)
	pdf.SetTextColor(41, 128, 185)
	pdf.SetXY(leftMargin, lineY+63)

	// Get course name from data (required parameter)
	courseName := "Course Name"
	if course, ok := data["course_name"].(string); ok && course != "" {
		courseName = course
	}
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 12, courseName, "", 0, "C", false, 0, "")

	// Add completion date
	pdf.SetFont("Arial", "", float64(g.fontSize.body))
	pdf.SetTextColor(52, 73, 94)
	pdf.SetXY(leftMargin, lineY+85)

	completionDate := certificate.CompletionDate.Format("January 2, 2006")
	dateText := fmt.Sprintf("Completed on %s", completionDate)
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 8, dateText, "", 0, "C", false, 0, "")

	// Add certificate number
	pdf.SetFont("Arial", "", float64(g.fontSize.footer))
	pdf.SetTextColor(127, 140, 141)
	pdf.SetXY(leftMargin, lineY+95)

	certNumber := fmt.Sprintf("Certificate No: %s", certificate.CertificateNumber)
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 6, certNumber, "", 0, "C", false, 0, "")

	// Add verification code
	pdf.SetXY(leftMargin, lineY+102)
	verifyText := fmt.Sprintf("Verification Code: %s", certificate.VerificationCode[:16]+"...")
	pdf.CellFormat(g.pageWidth-leftMargin-rightMargin, 6, verifyText, "", 0, "C", false, 0, "")

	// Add signature section (bottom area)
	signatureY := g.pageHeight - 40
	signatureWidth := 60.0
	signatureGap := 40.0

	// Instructor signature line
	instructorX := (g.pageWidth / 2) - signatureWidth - signatureGap/2
	pdf.SetDrawColor(52, 73, 94)
	pdf.SetLineWidth(0.3)
	pdf.Line(instructorX, signatureY, instructorX+signatureWidth, signatureY)

	pdf.SetFont("Arial", "", float64(g.fontSize.footer))
	pdf.SetTextColor(52, 73, 94)
	pdf.SetXY(instructorX, signatureY+2)

	// Get instructor name from data
	instructorName := "Instructor"
	if instructor, ok := data["instructor_name"].(string); ok && instructor != "" {
		instructorName = instructor
	}
	pdf.CellFormat(signatureWidth, 6, instructorName, "", 0, "C", false, 0, "")

	pdf.SetXY(instructorX, signatureY+8)
	pdf.CellFormat(signatureWidth, 6, "Instructor", "", 0, "C", false, 0, "")

	// Director/Admin signature line
	directorX := (g.pageWidth / 2) + signatureGap/2
	pdf.Line(directorX, signatureY, directorX+signatureWidth, signatureY)

	pdf.SetXY(directorX, signatureY+2)

	// Get director name from data or default
	directorName := "Platform Director"
	if director, ok := data["signatory_name"].(string); ok && director != "" {
		directorName = director
	}
	pdf.CellFormat(signatureWidth, 6, directorName, "", 0, "C", false, 0, "")

	pdf.SetXY(directorX, signatureY+8)
	pdf.CellFormat(signatureWidth, 6, "Platform Director", "", 0, "C", false, 0, "")

	// Add generation timestamp (bottom-right corner)
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(189, 195, 199)
	pdf.SetXY(g.pageWidth-rightMargin-60, g.pageHeight-10)
	generatedText := fmt.Sprintf("Generated: %s", time.Now().Format("2006-01-02 15:04:05"))
	pdf.CellFormat(60, 5, generatedText, "", 0, "R", false, 0, "")

	// Output PDF to bytes using a buffer
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("error generating PDF: %v", err)
	}

	return buf.Bytes(), nil
}

// GeneratePreview generates a preview of the certificate with sample data
func (g *PDFGenerator) GeneratePreview(ctx context.Context, template *domain.CertificateTemplate, data map[string]interface{}) ([]byte, error) {
	// Create a dummy certificate for preview
	dummyCert := &domain.Certificate{
		ID:                uuid.New(),
		TenantID:          uuid.New(),
		UserID:            uuid.New(),
		CourseID:          uuid.New(),
		CertificateNumber: "PREVIEW-2024-001",
		VerificationCode:  "preview-verification-code-12345678",
		CompletionDate:    time.Now(),
	}

	// Ensure default values in data map if not provided
	if _, ok := data["student_name"]; !ok {
		data["student_name"] = "John Doe"
	}
	if _, ok := data["course_name"]; !ok {
		data["course_name"] = "Sample Course Name"
	}

	return g.GeneratePDF(ctx, dummyCert, template, data)
}

// ValidateTemplate validates a certificate template
func (g *PDFGenerator) ValidateTemplate(ctx context.Context, templatePath string) error {
	// Basic validation - check if required fields are present
	if templatePath == "" {
		return fmt.Errorf("template path cannot be empty")
	}

	// For now, we're using code-based templates rather than file-based
	// This could be extended to validate actual template files in the future
	return nil
}

// addDecorativeBorder adds a decorative border to the certificate
func (g *PDFGenerator) addDecorativeBorder(pdf *gofpdf.Fpdf) {
	// Outer border (thicker)
	pdf.SetDrawColor(41, 128, 185) // Blue
	pdf.SetLineWidth(1.5)
	margin := 10.0
	pdf.Rect(margin, margin, g.pageWidth-2*margin, g.pageHeight-2*margin, "D")

	// Inner border (thinner)
	pdf.SetLineWidth(0.5)
	innerMargin := 12.0
	pdf.Rect(innerMargin, innerMargin, g.pageWidth-2*innerMargin, g.pageHeight-2*innerMargin, "D")

	// Add corner decorations
	g.addCornerDecorations(pdf)
}

// addCornerDecorations adds decorative elements to corners
func (g *PDFGenerator) addCornerDecorations(pdf *gofpdf.Fpdf) {
	cornerSize := 15.0
	cornerMargin := 15.0

	pdf.SetDrawColor(41, 128, 185)
	pdf.SetLineWidth(1.0)

	// Top-left corner
	pdf.Line(cornerMargin, cornerMargin+cornerSize, cornerMargin, cornerMargin)
	pdf.Line(cornerMargin, cornerMargin, cornerMargin+cornerSize, cornerMargin)

	// Top-right corner
	pdf.Line(g.pageWidth-cornerMargin-cornerSize, cornerMargin, g.pageWidth-cornerMargin, cornerMargin)
	pdf.Line(g.pageWidth-cornerMargin, cornerMargin, g.pageWidth-cornerMargin, cornerMargin+cornerSize)

	// Bottom-left corner
	pdf.Line(cornerMargin, g.pageHeight-cornerMargin-cornerSize, cornerMargin, g.pageHeight-cornerMargin)
	pdf.Line(cornerMargin, g.pageHeight-cornerMargin, cornerMargin+cornerSize, g.pageHeight-cornerMargin)

	// Bottom-right corner
	pdf.Line(g.pageWidth-cornerMargin-cornerSize, g.pageHeight-cornerMargin, g.pageWidth-cornerMargin, g.pageHeight-cornerMargin)
	pdf.Line(g.pageWidth-cornerMargin, g.pageHeight-cornerMargin-cornerSize, g.pageWidth-cornerMargin, g.pageHeight-cornerMargin)
}
