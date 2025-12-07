function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gradient-primary mb-4">
          StrategyForge
        </h1>
        <p className="text-muted-foreground text-lg">
          Your Trading Strategy Platform
        </p>
        
        <div className="mt-8 card-premium p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
          <p>
            Your application is running successfully!
            <br />
            <br />
            Next: File upload + live candle chart in &lt; 24 hours.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
