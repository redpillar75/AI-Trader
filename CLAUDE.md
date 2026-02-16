# CLAUDE.md — AI-Trader

## Project Overview

AI-Trader is an autonomous AI-powered trading platform that benchmarks multiple LLMs (Claude, GPT, DeepSeek, Qwen, Gemini, etc.) competing in financial markets. Each AI agent receives identical starting capital, market data, and tools, then makes fully autonomous trading decisions. The system supports three markets: US stocks (NASDAQ 100), Chinese A-shares (SSE 50), and cryptocurrencies (BITWISE10).

**Repository**: https://github.com/HKUDS/AI-Trader
**License**: MIT
**Paper**: arXiv:2512.10971

## Tech Stack

- **Language**: Python 3.10+
- **AI Framework**: LangChain 1.0.2 + LangChain-OpenAI 1.0.1
- **Tool Protocol**: FastMCP 2.12.5 (Model Context Protocol)
- **Data APIs**: Alpha Vantage (US/crypto), Tushare + efinance (A-shares), Jina AI (news search)
- **Frontend**: Static HTML/CSS/JS with Chart.js, configured via YAML
- **CI/CD**: GitHub Actions (deploys frontend to GitHub Pages)

## Directory Structure

```
AI-Trader/
├── main.py                    # Primary entry point — runs single/multi-agent trading
├── main_parrallel.py          # Parallel multi-agent execution
├── agent/                     # Agent implementations by market
│   ├── base_agent/            # US stocks (NASDAQ 100)
│   │   ├── base_agent.py      #   Daily trading agent (~600 lines, core logic)
│   │   └── base_agent_hour.py #   Hourly trading agent
│   ├── base_agent_astock/     # Chinese A-shares (SSE 50)
│   │   ├── base_agent_astock.py      # Daily (T+1 rules, 100-share lots)
│   │   └── base_agent_astock_hour.py # Hourly
│   └── base_agent_crypto/     # Cryptocurrencies (BITWISE10)
│       └── base_agent_crypto.py      # 24/7 trading, USDT pricing
├── agent_tools/               # MCP tool services (each runs as HTTP server)
│   ├── start_mcp_services.py  # Orchestrates all MCP services
│   ├── tool_trade.py          # Buy/sell execution (stocks)
│   ├── tool_crypto_trade.py   # Buy/sell execution (crypto)
│   ├── tool_get_price_local.py# Price data queries (auto-detects market from symbol)
│   ├── tool_alphavantage_news.py # News data from Alpha Vantage
│   ├── tool_jina_search.py    # Market intelligence via Jina AI
│   └── tool_math.py           # Math calculations
├── configs/                   # JSON trading configurations
│   ├── default_config.json    # US stocks config (reference example)
│   ├── astock_config.json     # A-shares daily
│   ├── astock_hour_config.json# A-shares hourly
│   └── default_crypto_config.json # Crypto
├── data/                      # Market data and trading records
│   ├── merged.jsonl           # Unified US stock price data
│   ├── agent_data/            # US trading logs (per-agent subdirectories)
│   ├── A_stock/               # A-share data + scripts
│   │   ├── merged.jsonl / merged_hourly.jsonl
│   │   └── agent_data_astock/
│   └── crypto/                # Crypto data + scripts
│       ├── crypto_merged.jsonl
│       └── agent_data_crypto/
├── prompts/                   # LLM prompt templates
│   ├── agent_prompt.py        # US stocks (includes NASDAQ 100 symbol list)
│   ├── agent_prompt_astock.py # A-shares (Chinese language prompts)
│   └── agent_prompt_crypto.py # Crypto
├── tools/                     # Utility modules
│   ├── general_tools.py       # Config/runtime env management
│   ├── price_tools.py         # Market data helpers, symbol lists
│   ├── calculate_metrics.py   # Sharpe, MDD, CR, Sortino, etc.
│   └── plot_metrics.py        # Visualization
├── scripts/                   # Shell scripts for quick workflows
│   ├── main.sh                # One-click US market workflow
│   ├── main_step1.sh … main_step3.sh
│   ├── main_a_stock_step1.sh … main_a_stock_step3.sh
│   ├── main_crypto_step1.sh … main_crypto_step3.sh
│   └── precompute_frontend_cache.py # CI cache generation
├── docs/                      # Frontend dashboard (GitHub Pages)
│   ├── index.html             # Main leaderboard + dashboard
│   ├── portfolio.html         # Portfolio tracking
│   ├── config.yaml            # Agent display config (names, icons, colors)
│   └── assets/                # CSS, JS, images
└── .github/workflows/
    └── deploy-pages.yml       # CI: generates cache, deploys to Pages
```

## Development Workflow

### Prerequisites

1. Python 3.10+
2. Copy `.env.example` to `.env` and fill in API keys:
   - `OPENAI_API_BASE` / `OPENAI_API_KEY` — LLM API access (OpenAI-compatible)
   - `ALPHAADVANTAGE_API_KEY` — US stocks and crypto price data
   - `JINA_API_KEY` — Market news search
   - `TUSHARE_TOKEN` — Chinese A-share data (only needed for A-shares)
3. Install dependencies: `pip install -r requirements.txt`

### 3-Step Trading Workflow

**Step 1 — Fetch and prepare market data:**
```bash
# US stocks
cd data && python get_daily_price.py && python merge_jsonl.py

# A-shares
cd data/A_stock && python get_daily_price_tushare.py && python merge_jsonl_tushare.py

# Crypto
cd data/crypto && python get_daily_price_crypto.py && python merge_crypto_jsonl.py
```

**Step 2 — Start MCP tool services:**
```bash
cd agent_tools && python start_mcp_services.py
# Starts services on ports: Math(8000), Search(8001), Trade(8002), Price(8003), Crypto(8005)
```

**Step 3 — Run trading agents:**
```bash
python main.py configs/default_config.json        # US stocks
python main.py configs/astock_config.json          # A-shares
python main.py configs/default_crypto_config.json  # Crypto
```

Or use the one-click scripts: `bash scripts/main.sh`

### Quick-start Scripts

Each market has step scripts (`scripts/main_step1.sh`, `main_step2.sh`, `main_step3.sh`) that automate the three steps above. The `main.sh` script runs all three sequentially.

### Frontend Dashboard

The frontend in `docs/` is deployed automatically to GitHub Pages via CI on push to `main`. To preview locally:
```bash
bash scripts/start_ui.sh
# or just open docs/index.html in a browser
```

Frontend configuration lives in `docs/config.yaml` — add/remove agents, change display names, icons, and colors without touching code.

## Architecture & Key Patterns

### Agent Registry (Dynamic Loading)

`main.py` uses a registry pattern with `importlib` to dynamically load agent classes:

```python
AGENT_REGISTRY = {
    "BaseAgent":        {"module": "agent.base_agent.base_agent", "class": "BaseAgent"},
    "BaseAgent_Hour":   {"module": "agent.base_agent.base_agent_hour", "class": "BaseAgent_Hour"},
    "BaseAgentAStock":  {"module": "agent.base_agent_astock.base_agent_astock", "class": "BaseAgentAStock"},
    "BaseAgentAStock_Hour": {"module": "agent.base_agent_astock.base_agent_astock_hour", "class": "BaseAgentAStock_Hour"},
    "BaseAgentCrypto":  {"module": "agent.base_agent_crypto.base_agent_crypto", "class": "BaseAgentCrypto"},
}
```

To add a new agent type, create its module under `agent/` and register it here.

### MCP Tool Services

All agent actions (buy, sell, get prices, search news) go through MCP tool servers running as HTTP services. Each tool is a standalone FastMCP server. The `start_mcp_services.py` script manages lifecycle, port conflicts, and health checks.

**Port assignments** (configurable via `.env`):
| Service | Port | Script |
|---------|------|--------|
| Math | 8000 | `tool_math.py` |
| Search/News | 8001 | `tool_alphavantage_news.py` |
| Stock Trade | 8002 | `tool_trade.py` |
| Price Data | 8003 | `tool_get_price_local.py` |
| Crypto Trade | 8005 | `tool_crypto_trade.py` |

### Market Auto-Detection

The system auto-detects market type from stock symbol format:
- Symbols ending in `.SH` or `.SZ` → A-shares
- Symbols ending in `-USDT` → Crypto
- All others → US stocks

### Data Format

- **Price data**: JSONL files (one JSON object per line) in `data/`
- **Position records**: `position.jsonl` files under each agent's log directory
- **Runtime config**: `runtime_env.json` (transient, gitignored)

### Concurrency & Locking

Multi-agent trading uses `fcntl.flock` file-based locking to prevent race conditions when multiple agents update position files concurrently.

### DeepSeek Compatibility

A custom `DeepSeekChatOpenAI` wrapper class handles DeepSeek's non-standard JSON argument serialization in tool call responses, automatically converting string arguments to dicts.

## Configuration Reference

### Trading Config (JSON in `configs/`)

```json
{
  "agent_type": "BaseAgent",           // Registry key for agent class
  "market": "us",                      // "us", "cn", or "crypto"
  "date_range": {
    "init_date": "2025-10-01",         // Backtest start (YYYY-MM-DD)
    "end_date": "2025-10-31"           // Backtest end
  },
  "models": [
    {
      "name": "claude-3.7-sonnet",     // Display name
      "basemodel": "anthropic/claude-3.7-sonnet",  // API model identifier
      "signature": "claude-3.7-sonnet", // Used for log directory naming
      "enabled": true,                  // Toggle model on/off
      "openai_base_url": "...",         // Optional per-model API base
      "openai_api_key": "..."           // Optional per-model API key
    }
  ],
  "agent_config": {
    "max_steps": 30,                   // Max reasoning steps per trading day
    "max_retries": 3,                  // Retry count on failures
    "base_delay": 1.0,                 // Retry delay (seconds)
    "initial_cash": 10000.0,           // Starting capital
    "verbose": true                    // Verbose logging
  },
  "log_config": {
    "log_path": "./data/agent_data"    // Where trading records are stored
  }
}
```

### Environment Variables (`.env`)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_BASE` | LLM API base URL |
| `OPENAI_API_KEY` | LLM API key |
| `ALPHAADVANTAGE_API_KEY` | Alpha Vantage data API |
| `JINA_API_KEY` | Jina AI search API |
| `TUSHARE_TOKEN` | Tushare A-share data token |
| `MATH_HTTP_PORT` | Math MCP service port (default: 8000) |
| `SEARCH_HTTP_PORT` | Search MCP service port (default: 8001) |
| `TRADE_HTTP_PORT` | Trade MCP service port (default: 8002) |
| `GETPRICE_HTTP_PORT` | Price MCP service port (default: 8003) |
| `CRYPTO_HTTP_PORT` | Crypto MCP service port (default: 8005) |
| `AGENT_MAX_STEP` | Max agent steps (default: 30) |
| `RUNTIME_ENV_PATH` | Path to runtime env JSON |

### Frontend Config (`docs/config.yaml`)

Controls the dashboard display — agent names, icons, colors, and enabled state. See `docs/CONFIG_GUIDE.md` for full reference.

## Market-Specific Rules

| Market | Agent Types | Capital | Trading Rules | Data Source |
|--------|-------------|---------|---------------|-------------|
| US Stocks | `BaseAgent`, `BaseAgent_Hour` | $10,000 | T+0, flexible lots | Alpha Vantage |
| A-Shares | `BaseAgentAStock`, `BaseAgentAStock_Hour` | ¥100,000 | T+1, 100-share lots | Tushare/efinance |
| Crypto | `BaseAgentCrypto` | 50,000 USDT | T+0, 24/7 | Alpha Vantage |

## Code Conventions

- **Async/await**: All agent execution is async (`asyncio.run` in `main.py`). Agent classes use `async def initialize()` and `async def run_date_range()`.
- **Configuration over code**: Market parameters, model lists, and UI settings are all driven by JSON/YAML config files — avoid hardcoding.
- **Module organization**: Each market type has its own agent subdirectory, prompt file, and data directory.
- **Prompt templates**: Located in `prompts/`. A-share prompts are in Chinese. Crypto and US prompts are in English.
- **Logging**: Uses print statements with emoji prefixes for status indication (not Python `logging` module).
- **File locking**: Use `fcntl.flock` for any concurrent writes to shared files.
- **No test suite**: The project currently has no automated tests. Exercise caution when refactoring.
- **Dependencies**: Keep minimal — `requirements.txt` is intentionally lean. `python-dotenv` is used but not listed (implicit dependency).

## CI/CD

The single GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) runs on push to `main`:
1. Checks out the repo
2. Installs Python 3.10 + `pyyaml`
3. Runs `scripts/precompute_frontend_cache.py` to generate optimized data caches
4. Deploys the `docs/` directory to GitHub Pages

## Common Tasks for AI Assistants

### Adding a new AI model

1. Add a model entry to the relevant config file in `configs/` with `name`, `basemodel`, `signature`, and `enabled: true`
2. Ensure the model is accessible via an OpenAI-compatible API endpoint
3. Optionally add the model to `docs/config.yaml` for dashboard display

### Adding a new market

1. Create a new agent class under `agent/` following the existing pattern
2. Register it in `AGENT_REGISTRY` in `main.py`
3. Create corresponding prompt templates in `prompts/`
4. Add data fetch/merge scripts in `data/`
5. Create a new MCP trade tool if the market has unique rules
6. Add a config file in `configs/`

### Adding a new MCP tool

1. Create a new FastMCP server script in `agent_tools/`
2. Register the port in `.env.example` and `.env`
3. Add the service to `MCPServiceManager.service_configs` in `start_mcp_services.py`
4. Connect to the tool in the relevant agent's `initialize()` method

### Modifying the frontend dashboard

Edit `docs/config.yaml` for agent display settings. For structural changes, edit `docs/index.html` and `docs/portfolio.html`. CSS/JS are in `docs/assets/`.
