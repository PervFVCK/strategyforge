package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/PervFVCK/strategyforge/internal/middleware"
)

// UploadedFileInfo represents metadata about uploaded file
type UploadedFileInfo struct {
	ID           string    `json:"id"`
	FileName     string    `json:"fileName"`
	FileSize     int64     `json:"fileSize"`
	FileType     string    `json:"fileType"`
	Pair         string    `json:"pair"`
	Timeframe    string    `json:"timeframe"`
	RecordCount  int       `json:"recordCount"`
	StartDate    time.Time `json:"startDate"`
	EndDate      time.Time `json:"endDate"`
	UploadedAt   time.Time `json:"uploadedAt"`
	ProcessingTime string  `json:"processingTime"`
}

// CandleData represents a single OHLC candle
type CandleData struct {
	Timestamp time.Time `json:"timestamp"`
	Open      float64   `json:"open"`
	High      float64   `json:"high"`
	Low       float64   `json:"low"`
	Close     float64   `json:"close"`
	Volume    int64     `json:"volume"`
}

// HandleFileUpload processes uploaded trading data files
func HandleFileUpload(c *fiber.Ctx) error {
	startTime := time.Now()
	
	// Get user ID from context
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
	}

	// Parse multipart form (max 100MB)
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "No file uploaded",
		})
	}

	// Validate file size (max 100MB)
	maxSize := int64(100 * 1024 * 1024) // 100MB
	if file.Size > maxSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "File Too Large",
			"message": fmt.Sprintf("File size must be less than 100MB (current: %.2fMB)", float64(file.Size)/(1024*1024)),
		})
	}

	// Get file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	
	// Validate file type
	allowedTypes := map[string]bool{
		".csv": true,
		".hst": true,
		".bin": true,
		".txt": true,
	}
	
	if !allowedTypes[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid File Type",
			"message": fmt.Sprintf("Only CSV, HST, BIN, and TXT files are allowed (got: %s)", ext),
		})
	}

	// Open uploaded file
	fileReader, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "File Read Error",
			"message": "Failed to read uploaded file",
		})
	}
	defer fileReader.Close()

	// Parse file based on type
	var fileInfo *UploadedFileInfo
	var candles []CandleData

	switch ext {
	case ".csv", ".txt":
		fileInfo, candles, err = parseCSVFile(fileReader, file.Filename, file.Size)
	case ".hst":
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"error":   "Not Implemented",
			"message": "HST file parsing coming soon",
		})
	case ".bin":
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"error":   "Not Implemented",
			"message": "BIN file parsing coming soon",
		})
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid File Type",
			"message": "Unsupported file format",
		})
	}

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Parse Error",
			"message": err.Error(),
		})
	}

	// Calculate processing time
	processingTime := time.Since(startTime)
	fileInfo.ProcessingTime = processingTime.String()

	// Return file info and sample data (first 100 candles)
	sampleSize := 100
	if len(candles) < sampleSize {
		sampleSize = len(candles)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "File uploaded and parsed successfully",
		"data": fiber.Map{
			"fileInfo": fileInfo,
			"sample":   candles[:sampleSize],
			"total":    len(candles),
		},
	})
}

// parseCSVFile parses CSV format trading data
func parseCSVFile(reader io.Reader, filename string, fileSize int64) (*UploadedFileInfo, []CandleData, error) {
	csvReader := csv.NewReader(reader)
	csvReader.TrimLeadingSpace = true
	
	// Read all records
	records, err := csvReader.ReadAll()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(records) < 2 {
		return nil, nil, fmt.Errorf("CSV file is empty or has no data rows")
	}

	// Try to detect format and parse
	candles, err := parseCSVRecords(records)
	if err != nil {
		return nil, nil, err
	}

	if len(candles) == 0 {
		return nil, nil, fmt.Errorf("no valid candles found in file")
	}

	// Auto-detect pair from filename
	pair := detectPairFromFilename(filename)
	
	// Auto-detect timeframe
	timeframe := detectTimeframe(candles)

	// Create file info
	fileInfo := &UploadedFileInfo{
		ID:          generateFileID(),
		FileName:    filename,
		FileSize:    fileSize,
		FileType:    "CSV",
		Pair:        pair,
		Timeframe:   timeframe,
		RecordCount: len(candles),
		StartDate:   candles[0].Timestamp,
		EndDate:     candles[len(candles)-1].Timestamp,
		UploadedAt:  time.Now(),
	}

	return fileInfo, candles, nil
}

// parseCSVRecords converts CSV records to candle data
func parseCSVRecords(records [][]string) ([]CandleData, error) {
	// Skip header row
	dataRows := records[1:]
	
	candles := make([]CandleData, 0, len(dataRows))
	
	for i, row := range dataRows {
		if len(row) < 6 {
			continue // Skip invalid rows
		}

		// Try to parse timestamp (handle multiple formats)
		timestamp, err := parseTimestamp(row[0])
		if err != nil {
			return nil, fmt.Errorf("invalid timestamp at row %d: %w", i+2, err)
		}

		// Parse OHLCV data
		candle := CandleData{
			Timestamp: timestamp,
		}

		// Parse prices
		fmt.Sscanf(row[1], "%f", &candle.Open)
		fmt.Sscanf(row[2], "%f", &candle.High)
		fmt.Sscanf(row[3], "%f", &candle.Low)
		fmt.Sscanf(row[4], "%f", &candle.Close)
		fmt.Sscanf(row[5], "%d", &candle.Volume)

		candles = append(candles, candle)
	}

	return candles, nil
}

// parseTimestamp handles multiple timestamp formats
func parseTimestamp(timeStr string) (time.Time, error) {
	// Common formats
	formats := []string{
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006.01.02 15:04:05",
		"2006.01.02 15:04",
		"01/02/2006 15:04:05",
		"01/02/2006 15:04",
		time.RFC3339,
	}

	for _, format := range formats {
		if t, err := time.Parse(format, timeStr); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unsupported timestamp format: %s", timeStr)
}

// detectPairFromFilename extracts currency pair from filename
func detectPairFromFilename(filename string) string {
	pairs := []string{
		"EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
		"EURJPY", "GBPJPY", "EURGBP", "AUDJPY", "EURAUD", "EURCHF", "AUDNZD",
		"NZDJPY", "GBPAUD", "GBPCAD", "EURNZD", "AUDCAD", "GBPCHF", "AUDCHF",
		"EURCAD", "CADJPY", "GBPNZD", "CADCHF", "CHFJPY", "NZDCAD", "NZDCHF",
	}

	upper := strings.ToUpper(filename)
	for _, pair := range pairs {
		if strings.Contains(upper, pair) {
			return pair
		}
	}

	return "UNKNOWN"
}

// detectTimeframe analyzes candle intervals to detect timeframe
func detectTimeframe(candles []CandleData) string {
	if len(candles) < 2 {
		return "UNKNOWN"
	}

	// Calculate average interval between candles
	totalInterval := int64(0)
	count := 0
	
	for i := 1; i < len(candles) && i < 100; i++ {
		interval := candles[i].Timestamp.Sub(candles[i-1].Timestamp).Minutes()
		if interval > 0 {
			totalInterval += int64(interval)
			count++
		}
	}

	if count == 0 {
		return "UNKNOWN"
	}

	avgMinutes := totalInterval / int64(count)

	// Map to timeframe
	switch {
	case avgMinutes <= 1:
		return "M1"
	case avgMinutes <= 5:
		return "M5"
	case avgMinutes <= 15:
		return "M15"
	case avgMinutes <= 30:
		return "M30"
	case avgMinutes <= 60:
		return "H1"
	case avgMinutes <= 240:
		return "H4"
	case avgMinutes <= 1440:
		return "D1"
	case avgMinutes <= 10080:
		return "W1"
	default:
		return "MN1"
	}
}

// generateFileID creates a unique file ID
func generateFileID() string {
	return fmt.Sprintf("file_%d", time.Now().UnixNano())
}
