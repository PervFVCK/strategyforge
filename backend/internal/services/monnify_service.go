package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"
)

type MonnifyClient struct {
	BaseURL      string
	APIKey       string
	SecretKey    string
	ContractCode string
	HTTPClient   *http.Client
	accessToken  string
	tokenExpiry  time.Time
	tokenMutex   sync.Mutex
}

func NewMonnifyClient() (*MonnifyClient, error) {
	baseURL := os.Getenv("MONNIFY_BASE_URL")
	if baseURL == "" {
		baseURL = "https://sandbox.monnify.com/api/v1"
	}

	apiKey := os.Getenv("MONNIFY_API_KEY")
	secret := os.Getenv("MONNIFY_SECRET_KEY")
	contract := os.Getenv("MONNIFY_CONTRACT_CODE")

	if apiKey == "" || secret == "" || contract == "" {
		return nil, fmt.Errorf("missing Monnify env vars: API_KEY, SECRET_KEY or CONTRACT_CODE")
	}

	fmt.Printf("[DEBUG] Monnify initialized with BaseURL: %s\n", baseURL)
	fmt.Printf("[DEBUG] API Key starts with: %s...\n", apiKey[:8])

	return &MonnifyClient{
		BaseURL:      baseURL,
		APIKey:       apiKey,
		SecretKey:    secret,
		ContractCode: contract,
		HTTPClient:   &http.Client{Timeout: 30 * time.Second},
	}, nil
}

// getAccessToken fetches a new Bearer token using Basic Auth
func (c *MonnifyClient) getAccessToken() (string, error) {
	c.tokenMutex.Lock()
	defer c.tokenMutex.Unlock()

	// Refresh if expired or missing
	if c.accessToken == "" || time.Now().After(c.tokenExpiry) {
		fmt.Println("[DEBUG] Refreshing Monnify access token...")

		authStr := c.APIKey + ":" + c.SecretKey
		authEncoded := base64.StdEncoding.EncodeToString([]byte(authStr))

		fmt.Printf("[DEBUG] Auth header prefix: Basic %s...\n", authEncoded[:20])

		req, err := http.NewRequest("POST", c.BaseURL+"/api/v1/auth/login", nil)
		if err != nil {
			return "", fmt.Errorf("failed to create login request: %w", err)
		}

		req.Header.Set("Authorization", "Basic "+authEncoded)

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			return "", fmt.Errorf("login request failed: %w", err)
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return "", fmt.Errorf("failed to read login response: %w", err)
		}

		fmt.Printf("[DEBUG] Login status: %d | Body starts: %s...\n", resp.StatusCode, string(body[:min(200, len(body))]))

		if resp.StatusCode != http.StatusOK {
			return "", fmt.Errorf("Monnify login failed (%d): %s", resp.StatusCode, string(body))
		}

		var res struct {
			RequestSuccessful bool `json:"requestSuccessful"`
			ResponseMessage   string `json:"responseMessage"`
			ResponseCode      string `json:"responseCode"`
			ResponseBody      struct {
				AccessToken string `json:"accessToken"`
				ExpiresIn   int    `json:"expiresIn"`
			} `json:"responseBody"`
		}

		if err := json.Unmarshal(body, &res); err != nil {
			return "", fmt.Errorf("failed to parse login JSON: %w", err)
		}

		if !res.RequestSuccessful {
			return "", fmt.Errorf("Monnify auth unsuccessful: %s", res.ResponseMessage)
		}

		c.accessToken = res.ResponseBody.AccessToken
		c.tokenExpiry = time.Now().Add(time.Duration(res.ResponseBody.ExpiresIn) * time.Second)

		fmt.Println("[DEBUG] New access token received. Expires in", res.ResponseBody.ExpiresIn, "seconds")
	}

	return c.accessToken, nil
}

// makeRequest sends authenticated API requests
func (c *MonnifyClient) makeRequest(method, endpoint string, payload interface{}) (map[string]interface{}, error) {
	token, err := c.getAccessToken()
	if err != nil {
		return nil, err
	}

	fullURL := c.BaseURL + endpoint
	fmt.Printf("[DEBUG] Request: %s %s\n", method, fullURL)

	var body io.Reader
	if payload != nil {
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, fullURL, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("invalid JSON response: %v (body: %s)", err, string(respBody))
	}

	if resp.StatusCode >= 400 {
		msg := fmt.Sprintf("Monnify API error (%d)", resp.StatusCode)
		if m, ok := result["responseMessage"]; ok {
			msg += fmt.Sprintf(" - %v", m)
		}
		return nil, errors.New(msg)
	}

	return result, nil
}

// TestConnection tests authentication and a simple GET endpoint
func (c *MonnifyClient) TestConnection() (map[string]interface{}, error) {
	// Use /bank-transfer/banks as a simple authenticated GET test
	return c.makeRequest("GET", "/api/v1/banks", nil)
}


func (c *MonnifyClient) ReserveAccount(
	accountReference string,
	customerName string,
	customerEmail string,
	bvn string,
) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"accountReference": accountReference,
		"accountName":      customerName,
		"currencyCode":     "NGN",
		"contractCode":     c.ContractCode,
		"customerEmail":    customerEmail,
		"customerName":     customerName,
	}

	if bvn != "" {
		payload["bvn"] = bvn
	}

	// Use v2 explicitly for this endpoint
	endpoint := "/api/v2/bank-transfer/reserved-accounts"

	return c.makeRequest("POST", endpoint, payload)
}
