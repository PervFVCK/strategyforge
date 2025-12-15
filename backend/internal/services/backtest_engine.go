package services

import (
	"fmt"
	"math"
	"time"

	"github.com/PervFVCK/strategyforge/internal/models"
)

// Strategy types
type StrategyType string

const (
	StrategySMA        StrategyType = "SMA_CROSSOVER"
	StrategyEMA        StrategyType = "EMA_CROSSOVER"
	StrategyRSI        StrategyType = "RSI"
	StrategyMACD       StrategyType = "MACD"
	StrategyBollinger  StrategyType = "BOLLINGER_BANDS"
	StrategyCustom     StrategyType = "CUSTOM"
)

// Trade represents a single trade
type Trade struct {
	ID          int       `json:"id"`
	Type        string    `json:"type"` // "BUY" or "SELL"
	EntryPrice  float64   `json:"entryPrice"`
	ExitPrice   float64   `json:"exitPrice"`
	EntryTime   time.Time `json:"entryTime"`
	ExitTime    time.Time `json:"exitTime"`
	Profit      float64   `json:"profit"`
	ProfitPct   float64   `json:"profitPct"`
	Size        float64   `json:"size"`
	StopLoss    float64   `json:"stopLoss,omitempty"`
	TakeProfit  float64   `json:"takeProfit,omitempty"`
}

// BacktestRequest represents a backtest request
type BacktestRequest struct {
	Strategy      StrategyType       `json:"strategy"`
	Parameters    map[string]float64     `json:"parameters"`
	InitialBalance float64               `json:"initialBalance"`
	RiskPerTrade   float64               `json:"riskPerTrade"`
	Data           []models.CandleData   `json:"data"`
}

// BacktestResult represents the complete backtest results
type BacktestResult struct {
	Summary          BacktestSummary  `json:"summary"`
	Trades           []Trade          `json:"trades"`
	EquityCurve      []EquityPoint    `json:"equityCurve"`
	DrawdownCurve    []DrawdownPoint  `json:"drawdownCurve"`
	MonthlyReturns   []MonthlyReturn  `json:"monthlyReturns"`
	ExecutionTime    string           `json:"executionTime"`
}

type BacktestSummary struct {
	TotalTrades      int     `json:"totalTrades"`
	WinningTrades    int     `json:"winningTrades"`
	LosingTrades     int     `json:"losingTrades"`
	WinRate          float64 `json:"winRate"`
	TotalProfit      float64 `json:"totalProfit"`
	TotalLoss        float64 `json:"totalLoss"`
	NetProfit        float64 `json:"netProfit"`
	ProfitFactor     float64 `json:"profitFactor"`
	MaxDrawdown      float64 `json:"maxDrawdown"`
	MaxDrawdownPct   float64 `json:"maxDrawdownPct"`
	SharpeRatio      float64 `json:"sharpeRatio"`
	AverageWin       float64 `json:"averageWin"`
	AverageLoss      float64 `json:"averageLoss"`
	LargestWin       float64 `json:"largestWin"`
	LargestLoss      float64 `json:"largestLoss"`
	InitialBalance   float64 `json:"initialBalance"`
	FinalBalance     float64 `json:"finalBalance"`
	ReturnPct        float64 `json:"returnPct"`
}

type EquityPoint struct {
	Time    time.Time `json:"time"`
	Balance float64   `json:"balance"`
}

type DrawdownPoint struct {
	Time       time.Time `json:"time"`
	Drawdown   float64   `json:"drawdown"`
	DrawdownPct float64  `json:"drawdownPct"`
}

type MonthlyReturn struct {
	Month     string  `json:"month"`
	Return    float64 `json:"return"`
	ReturnPct float64 `json:"returnPct"`
}

// BacktestEngine is the main backtesting engine
type BacktestEngine struct{}

// RunBacktest executes a backtest
func (e *BacktestEngine) RunBacktest(req BacktestRequest) (*BacktestResult, error) {
	startTime := time.Now()

	if len(req.Data) < 100 {
		return nil, fmt.Errorf("insufficient data: need at least 100 candles")
	}

	var trades []Trade
	var equityCurve []EquityPoint
	
	balance := req.InitialBalance
	peakBalance := balance
	maxDrawdown := 0.0
	
	// Execute strategy
	switch req.Strategy {
	case StrategySMA:
		trades = e.runSMAStrategy(req.Data, req.Parameters, req.InitialBalance, req.RiskPerTrade)
	case StrategyEMA:
		trades = e.runEMAStrategy(req.Data, req.Parameters, req.InitialBalance, req.RiskPerTrade)
	case StrategyRSI:
		trades = e.runRSIStrategy(req.Data, req.Parameters, req.InitialBalance, req.RiskPerTrade)
	case StrategyMACD:
		trades = e.runMACDStrategy(req.Data, req.Parameters, req.InitialBalance, req.RiskPerTrade)
	default:
		return nil, fmt.Errorf("unsupported strategy: %s", req.Strategy)
	}

	// Build equity curve and calculate drawdown
	var drawdownCurve []DrawdownPoint
	
	for i, candle := range req.Data {
		// Find trades that closed at or before this candle
		for _, trade := range trades {
			if !trade.ExitTime.After(candle.Timestamp) {
				balance += trade.Profit
			}
		}
		
		equityCurve = append(equityCurve, EquityPoint{
			Time:    candle.Timestamp,
			Balance: balance,
		})
		
		// Calculate drawdown
		if balance > peakBalance {
			peakBalance = balance
		}
		drawdown := peakBalance - balance
		drawdownPct := (drawdown / peakBalance) * 100
		
		if drawdown > maxDrawdown {
			maxDrawdown = drawdown
		}
		
		drawdownCurve = append(drawdownCurve, DrawdownPoint{
			Time:        candle.Timestamp,
			Drawdown:    drawdown,
			DrawdownPct: drawdownPct,
		})
		
		// Sample every 10th point to reduce data size
		if i%10 != 0 && i != len(req.Data)-1 {
			equityCurve = equityCurve[:len(equityCurve)-1]
			drawdownCurve = drawdownCurve[:len(drawdownCurve)-1]
		}
	}

	// Calculate summary statistics
	summary := e.calculateSummary(trades, req.InitialBalance, balance, maxDrawdown, peakBalance)
	
	// Calculate monthly returns
	monthlyReturns := e.calculateMonthlyReturns(trades, req.InitialBalance)

	result := &BacktestResult{
		Summary:        summary,
		Trades:         trades,
		EquityCurve:    equityCurve,
		DrawdownCurve:  drawdownCurve,
		MonthlyReturns: monthlyReturns,
		ExecutionTime:  time.Since(startTime).String(),
	}

	return result, nil
}

// SMA Crossover Strategy
func (e *BacktestEngine) runSMAStrategy(data []models.CandleData, params map[string]float64, balance, riskPct float64) []Trade {
	fastPeriod := int(params["fastPeriod"])
	slowPeriod := int(params["slowPeriod"])
	
	if fastPeriod == 0 {
		fastPeriod = 20
	}
	if slowPeriod == 0 {
		slowPeriod = 50
	}

	var trades []Trade
	var currentTrade *Trade
	tradeID := 1

	for i := slowPeriod; i < len(data); i++ {
		fastSMA := calculateSMA(data, i, fastPeriod)
		slowSMA := calculateSMA(data, i, slowPeriod)
		
		prevFastSMA := calculateSMA(data, i-1, fastPeriod)
		prevSlowSMA := calculateSMA(data, i-1, slowPeriod)

		// Buy signal: fast crosses above slow
		if currentTrade == nil && prevFastSMA <= prevSlowSMA && fastSMA > slowSMA {
			positionSize := (balance * riskPct / 100) / data[i].Close
			currentTrade = &Trade{
				ID:         tradeID,
				Type:       "BUY",
				EntryPrice: data[i].Close,
				EntryTime:  data[i].Timestamp,
				Size:       positionSize,
			}
			tradeID++
		}

		// Sell signal: fast crosses below slow
		if currentTrade != nil && prevFastSMA >= prevSlowSMA && fastSMA < slowSMA {
			currentTrade.ExitPrice = data[i].Close
			currentTrade.ExitTime = data[i].Timestamp
			currentTrade.Profit = (currentTrade.ExitPrice - currentTrade.EntryPrice) * currentTrade.Size
			currentTrade.ProfitPct = ((currentTrade.ExitPrice - currentTrade.EntryPrice) / currentTrade.EntryPrice) * 100
			
			trades = append(trades, *currentTrade)
			balance += currentTrade.Profit
			currentTrade = nil
		}
	}

	// Close open trade at end
	if currentTrade != nil {
		lastCandle := data[len(data)-1]
		currentTrade.ExitPrice = lastCandle.Close
		currentTrade.ExitTime = lastCandle.Timestamp
		currentTrade.Profit = (currentTrade.ExitPrice - currentTrade.EntryPrice) * currentTrade.Size
		currentTrade.ProfitPct = ((currentTrade.ExitPrice - currentTrade.EntryPrice) / currentTrade.EntryPrice) * 100
		trades = append(trades, *currentTrade)
	}

	return trades
}

// EMA Crossover Strategy
func (e *BacktestEngine) runEMAStrategy(data []models.CandleData, params map[string]float64, balance, riskPct float64) []Trade {
	// Similar to SMA but with EMA calculation
	// Simplified for now
	return e.runSMAStrategy(data, params, balance, riskPct)
}

// RSI Strategy
func (e *BacktestEngine) runRSIStrategy(data []CandleData, params map[string]float64, balance, riskPct float64) []Trade {
	period := int(params["period"])
	oversold := params["oversold"]
	overbought := params["overbought"]
	
	if period == 0 {
		period = 14
	}
	if oversold == 0 {
		oversold = 30
	}
	if overbought == 0 {
		overbought = 70
	}

	var trades []Trade
	var currentTrade *Trade
	tradeID := 1

	for i := period + 1; i < len(data); i++ {
		rsi := calculateRSI(data, i, period)
		prevRSI := calculateRSI(data, i-1, period)

		// Buy signal: RSI crosses above oversold
		if currentTrade == nil && prevRSI <= oversold && rsi > oversold {
			positionSize := (balance * riskPct / 100) / data[i].Close
			currentTrade = &Trade{
				ID:         tradeID,
				Type:       "BUY",
				EntryPrice: data[i].Close,
				EntryTime:  data[i].Timestamp,
				Size:       positionSize,
			}
			tradeID++
		}

		// Sell signal: RSI crosses below overbought
		if currentTrade != nil && prevRSI >= overbought && rsi < overbought {
			currentTrade.ExitPrice = data[i].Close
			currentTrade.ExitTime = data[i].Timestamp
			currentTrade.Profit = (currentTrade.ExitPrice - currentTrade.EntryPrice) * currentTrade.Size
			currentTrade.ProfitPct = ((currentTrade.ExitPrice - currentTrade.EntryPrice) / currentTrade.EntryPrice) * 100
			
			trades = append(trades, *currentTrade)
			balance += currentTrade.Profit
			currentTrade = nil
		}
	}

	return trades
}

// MACD Strategy
func (e *BacktestEngine) runMACDStrategy(data []CandleData, params map[string]float64, balance, riskPct float64) []Trade {
	// Simplified MACD - full implementation would calculate MACD line and signal line
	return e.runSMAStrategy(data, params, balance, riskPct)
}

// Helper: Calculate SMA
func calculateSMA(data []CandleData, index, period int) float64 {
	if index < period-1 {
		return 0
	}
	
	sum := 0.0
	for i := index - period + 1; i <= index; i++ {
		sum += data[i].Close
	}
	return sum / float64(period)
}

// Helper: Calculate RSI
func calculateRSI(data []CandleData, index, period int) float64 {
	if index < period {
		return 50
	}

	gains := 0.0
	losses := 0.0

	for i := index - period + 1; i <= index; i++ {
		change := data[i].Close - data[i-1].Close
		if change > 0 {
			gains += change
		} else {
			losses += math.Abs(change)
		}
	}

	avgGain := gains / float64(period)
	avgLoss := losses / float64(period)

	if avgLoss == 0 {
		return 100
	}

	rs := avgGain / avgLoss
	rsi := 100 - (100 / (1 + rs))
	return rsi
}

// Calculate summary statistics
func (e *BacktestEngine) calculateSummary(trades []Trade, initialBalance, finalBalance, maxDrawdown, peakBalance float64) BacktestSummary {
	summary := BacktestSummary{
		TotalTrades:    len(trades),
		InitialBalance: initialBalance,
		FinalBalance:   finalBalance,
		MaxDrawdown:    maxDrawdown,
		MaxDrawdownPct: (maxDrawdown / peakBalance) * 100,
	}

	if len(trades) == 0 {
		return summary
	}

	totalProfit := 0.0
	totalLoss := 0.0
	winningTrades := 0
	losingTrades := 0
	largestWin := 0.0
	largestLoss := 0.0

	for _, trade := range trades {
		if trade.Profit > 0 {
			winningTrades++
			totalProfit += trade.Profit
			if trade.Profit > largestWin {
				largestWin = trade.Profit
			}
		} else {
			losingTrades++
			totalLoss += math.Abs(trade.Profit)
			if trade.Profit < largestLoss {
				largestLoss = trade.Profit
			}
		}
	}

	summary.WinningTrades = winningTrades
	summary.LosingTrades = losingTrades
	summary.WinRate = (float64(winningTrades) / float64(len(trades))) * 100
	summary.TotalProfit = totalProfit
	summary.TotalLoss = totalLoss
	summary.NetProfit = totalProfit - totalLoss
	
	if totalLoss > 0 {
		summary.ProfitFactor = totalProfit / totalLoss
	}
	
	if winningTrades > 0 {
		summary.AverageWin = totalProfit / float64(winningTrades)
	}
	if losingTrades > 0 {
		summary.AverageLoss = totalLoss / float64(losingTrades)
	}
	
	summary.LargestWin = largestWin
	summary.LargestLoss = largestLoss
	summary.ReturnPct = ((finalBalance - initialBalance) / initialBalance) * 100
	
	// Simplified Sharpe Ratio calculation
	summary.SharpeRatio = summary.ReturnPct / math.Max(summary.MaxDrawdownPct, 1)

	return summary
}

// Calculate monthly returns
func (e *BacktestEngine) calculateMonthlyReturns(trades []Trade, initialBalance float64) []MonthlyReturn {
	monthlyMap := make(map[string]float64)
	
	for _, trade := range trades {
		monthKey := trade.ExitTime.Format("2006-01")
		monthlyMap[monthKey] += trade.Profit
	}
	
	var returns []MonthlyReturn
	for month, profit := range monthlyMap {
		returns = append(returns, MonthlyReturn{
			Month:     month,
			Return:    profit,
			ReturnPct: (profit / initialBalance) * 100,
		})
	}
	
	return returns
}
