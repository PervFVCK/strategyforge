package main

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"payom/internal/services" // adjust if module name different
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Could not load .env file:", err)
	}

	fmt.Println("=== Monnify Connection Test ===")
	fmt.Println("Base URL:", os.Getenv("MONNIFY_BASE_URL"))
	fmt.Println("API Key starts with:", os.Getenv("MONNIFY_API_KEY")[:8]+"...")
	fmt.Println("Contract Code:", os.Getenv("MONNIFY_CONTRACT_CODE"))

	client, err := services.NewMonnifyClient()
	if err != nil {
		fmt.Println("Failed to initialize client:", err)
		os.Exit(1)
	}

	fmt.Println("Client initialized successfully")

	// Test with /bank-transfer/banks endpoint
	fmt.Println("\nTesting GET /banks ...")
	result, err := client.TestConnection()
	if err != nil {
		fmt.Println("Test FAILED:", err)
		os.Exit(1)
	}


	fmt.Println("SUCCESS! Connected and received data")
fmt.Println("Full response:")
fmt.Printf("%+v\n", result)

// Or more readable: extract banks
if body, ok := result["responseBody"].(map[string]interface{}); ok {
	if banks, ok := body["banks"].([]interface{}); ok {
		fmt.Printf("\nNumber of banks: %d\n", len(banks))
		if len(banks) > 0 {
			fmt.Println("\nFirst few banks:")
			for i, bank := range banks[:min(5, len(banks))] {
				b := bank.(map[string]interface{})
				fmt.Printf("%d. %s (%s)\n", i+1, b["name"], b["code"])
			}
		} else {
			fmt.Println("No banks returned (possible empty list in sandbox)")
		}
	} else {
		fmt.Println("No 'banks' key in responseBody")
	}
}

// Test Reserve Account (with fixes)
fmt.Println("\n=== Testing Reserve Account Creation (with fixes) ===")

uniqueRef := "reserve-test-" + fmt.Sprintf("%d", time.Now().UnixNano())
name := "Emmanuel Test"
email := "test@tester.com" // change if needed, or "" to omit
bvn := "" // try "12345678901" if fails

payloadDebug := map[string]interface{}{
	"accountReference": uniqueRef,
	"accountName":      name,
	"currencyCode":     "NGN",
	"contractCode":     client.ContractCode,
	"customerEmail":    email,
	"customerName":     name,
}
if bvn != "" {
	payloadDebug["bvn"] = bvn
}
fmt.Println("Payload debug:", payloadDebug)

account, err := client.ReserveAccount(uniqueRef, name, email, bvn)
if err != nil {
	fmt.Println("ReserveAccount FAILED:", err)
} else {
	fmt.Println("SUCCESS!")
	fmt.Printf("Full response:\n%+v\n", account)
}

}
