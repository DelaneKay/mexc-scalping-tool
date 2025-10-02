# MEXC Futures Scalping Tool

A production-ready monorepo for real-time MEXC futures volatility detection and burst analysis. Built with modern web technologies and deployed entirely on Netlify.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/mexc-scalping-tool)

## 🚀 Features

- **Real-time Market Analysis**: Scans MEXC USDT-M perpetual futures for volatility and burst signals
- **Advanced Technical Indicators**: RSI, ATR, ADX, EMA, Donchian Channels, and custom volatility metrics
- **Intelligent Scoring**: Proprietary burst score algorithm combining multiple market factors
- **Modern UI**: Dark-themed crypto platform with virtualized tables and smooth animations
- **Soft Updates**: Real-time data refresh every 10s without table reloads or loaders
- **Smart Notifications**: In-app toasts and Discord webhook alerts for significant events
- **Risk Management**: Leverage suggestions based on current volatility (informational only)
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🏗️ Architecture

### Monorepo Structure
```
mexc-scalping-tool/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Netlify Functions backend
├── packages/
│   └── shared/       # Shared types, indicators, utilities
├── netlify.toml      # Deployment configuration
└── README.md
```

### Tech Stack

**Frontend (apps/web)**
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- TanStack Query for data fetching
- Framer Motion for animations
- React Virtual for table virtualization

**Backend (apps/api)**
- Netlify Functions (serverless)
- TypeScript
- CCXT for MEXC integration
- Scheduled functions for data backfill

**Shared (packages/shared)**
- TypeScript types and interfaces
- Technical indicator calculations
- Scoring algorithms
- Utility functions
- Environment validation (Zod)

## 🛠️ Local Development

### Prerequisites
- Node.js 20.x or higher
- pnpm 8.x or higher

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mexc-scalping-tool.git
   cd mexc-scalping-tool
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

This will start:
- Web app at `http://localhost:3000`
- Netlify Functions at `http://localhost:8888`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Environment
NODE_ENV=development

# MEXC API (Optional - not required for public data)
MEXC_API_KEY=your_api_key_here
MEXC_API_SECRET=your_api_secret_here
MEXC_SANDBOX=false

# Discord Notifications (Optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url

# Application Settings
DEFAULT_TIMEFRAME=1m
DEFAULT_UNIVERSE=oi200
MIN_VOLUME_24H=500000
REFRESH_INTERVAL=10000

# Alert Thresholds
BURST_THRESHOLD=75
VOLATILITY_THRESHOLD=1.5
VOLUME_SURGE_THRESHOLD=0.6

# Development API Base
VITE_API_BASE=http://localhost:8888/.netlify/functions
```

## 🚀 Deployment

### Deploy to Netlify

1. **One-click deploy**
   
   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/mexc-scalping-tool)

2. **Manual deployment**
   
   ```bash
   # Build the project
   pnpm build
   
   # Deploy to Netlify
   npx netlify deploy --prod
   ```

3. **Environment Variables in Netlify**
   
   Set these in your Netlify dashboard under Site Settings > Environment Variables:
   - `DISCORD_WEBHOOK_URL` (optional)
   - `MEXC_API_KEY` (optional)
   - `MEXC_API_SECRET` (optional)
   - `MEXC_SANDBOX` (optional)

### Automatic Deployments

The project is configured for automatic deployments:
- Push to `main` branch triggers production deployment
- Pull requests create preview deployments
- Scheduled functions run automatically (backfill every hour)

## 📊 API Endpoints

### Public Endpoints

- `GET /api/symbols?universe=oi200|gainers50` - Get filtered symbol universe
- `GET /api/scan?tf=1m|5m&universe=oi200|gainers50` - Get scan results with scores
- `GET /api/detail?symbol=BTCUSDT&tf=1m|5m` - Get detailed symbol analysis
- `GET /api/health` - Health check and system status

### Internal Endpoints

- `POST /api/notify-discord` - Send Discord notifications
- `POST /api/jobs/backfill` - Manual data backfill (scheduled automatically)

## 🎯 Signal States

The system classifies symbols into four states:

### 🚀 ABOUT_TO_BURST (Amber/Red)
- Burst score ≥ 75
- High volume surge (≥ 0.6) OR breakout proximity (≥ 0.6)
- Volatility trending up over last 3 bars

### ⚡ VOLATILE (Purple)
- Volatility Z-score ≥ +1.5σ
- OR ATR% ≥ threshold

### 📉 LOSING_VOL (Blue)
- Volatility drop ≥ 0.8 over last 5 bars
- OR ADX declining ≥10 with volume slope down

### 📊 NORMAL (Gray)
- Default state for symbols not meeting other criteria

## 🧮 Scoring Algorithm

### Burst Score (0-100)
Combines normalized features with weighted importance:

```
burst_raw = 0.35 × volatility_z_score_norm +
            0.30 × volume_surge_norm +
            0.20 × breakout_proximity_score +
            0.15 × momentum_norm +
            0.10 × trend_quality_norm (optional)

burst_score = clamp(0..100, 50 + 50 × tanh(burst_raw))
```

### Key Metrics

- **Realized Volatility Z-Score**: Volatility vs universe median/MAD
- **Volume Surge**: Current volume / EMA(volume, 20), capped at 5x
- **Breakout Proximity**: Distance to 20-bar high normalized by ATR
- **Momentum**: Normalized RSI14 + ROC3
- **Trend Quality**: ADX14 normalized (optional weight)

## 🎨 UI Features

### Modern Crypto Design
- Dark theme with glass morphism effects
- Gradient accents and glowing elements
- Smooth animations and transitions
- Responsive layout for all devices

### Interactive Elements
- **State Badges**: Color-coded signal states with icons
- **Delta Chips**: Show 10-second changes with Δ symbol
- **Leverage Suggestions**: Risk-based color coding (5-10x)
- **Tooltips**: Detailed breakdowns on hover
- **Virtualized Table**: Smooth scrolling for large datasets

### Real-time Updates
- Soft refresh every 10 seconds
- Animated number transitions
- Row highlighting on state changes
- No loaders or table reloads

## ⚠️ Risk Disclaimer

**This tool is for informational purposes only:**
- No account connection or trading execution
- Leverage suggestions are educational only
- Always do your own research (DYOR)
- Past performance doesn't guarantee future results
- Cryptocurrency trading involves significant risk

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## 📈 Performance

### Optimizations
- Virtualized table rendering for large datasets
- Debounced sorting and filtering (250ms)
- Efficient WebSocket connection management
- Circuit breaker pattern for API resilience
- Exponential backoff with jitter for rate limiting

### Monitoring
- Real-time performance metrics in header
- API response time tracking
- WebSocket latency monitoring
- Error rate and circuit breaker status

## 🔧 Configuration

### Feature Windows
Customize technical indicator periods in settings:
- RSI: 14 periods (default)
- ATR: 14 periods (default)
- ADX: 14 periods (default)
- EMA: 20 periods (default)
- Donchian: 20 periods (default)
- Volume EMA: 20 periods (default)

### Universe Filters
- **Top 200 OI**: Symbols ranked by open interest
- **Top 50 Gainers**: Symbols ranked by 24h percentage change
- **Minimum Volume**: Filter by 24h volume (default: $500k)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MEXC Exchange](https://mexc.com) for providing market data
- [CCXT](https://github.com/ccxt/ccxt) for exchange integration
- [TanStack](https://tanstack.com) for excellent React libraries
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [Netlify](https://netlify.com) for seamless deployment

## 📞 Support

- Create an [issue](https://github.com/your-username/mexc-scalping-tool/issues) for bug reports
- Join our [Discord](https://discord.gg/your-server) for community support
- Check the [documentation](https://your-docs-site.com) for detailed guides

---

**⚡ Built with modern web technologies for the crypto trading community**