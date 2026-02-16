# CLAUDE.md - AI-Trader Codebase Guide

## Project Overview

AI-Trader is an autonomous multi-agent trading platform where LLM-based agents compete in financial markets using real market data. Agents make fully autonomous buy/sell decisions across US stocks (NASDAQ 100), Chinese A-shares (SSE 50), and cryptocurrencies (BITWISE 10). A live dashboard at https://ai4trade.ai tracks performance.

**Language:** Python 3.10+
**License:** MIT
**Paper:** arXiv 2512.10971

## Repository Structure

```
AI-Trader/
├── main.py                    # Main entry point - orchestrates trading runs
├── main_parrallel.py          # Parallel execution variant for multiple models
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variable template
│
├── agent/                     # Trading agent implementations
│   ├── base_agent/            # US stock agents (daily + hourly)
│   ├── base_agent_astock/     # Chinese A-shares agents (daily + hourly)
│   └── base_agent_crypto/     # Cryptocurrency agents
│
├── agent_tools/               # MCP (Model Context Protocol) tool servers
│   ├── start_mcp_services.py  # Starts all MCP tool servers
│   ├── tool_trade.py          # Stock buy/sell operations
│   ├── tool_crypto_trade.py   # Crypto buy/sell operations
│   ├── tool_get_price_local.py # Price data retrieval
│   ├── tool_alphavantage_news.py # Market news integration
│   ├── tool_jina_search.py    # Web search capability
│   └── tool_math.py           # Basic math operations
│
├── tools/                     # Shared utility modules
│   ├── general_tools.py       # Config management, conversation parsing
│   ├── price_tools.py         # Price data helpers, symbol lists, position tracking
│   ├── calculate_metrics.py   # Performance metrics (CR, Sortino, MDD, Vol)
│   └── plot_metrics.py        # Visualization helpers
│
├── prompts/                   # System prompts and symbol definitions
│   ├── agent_prompt.py        # US market prompts + NASDAQ 100 symbols
│   ├── agent_prompt_astock.py # A-shares prompts + SSE 50 symbols
│   └── agent_prompt_crypto.py # Crypto prompts + trading pairs
│
├── configs/                   # Trading configuration files (JSON)
│   ├── default_config.json    # US stocks, daily
│   ├── default_hour_config.json
│   ├── default_astock_config.json
│   ├── astock_hour_config.json
│   ├── default_crypto_config.json
│   └── README.md              # Configuration guide
│
├── data/                      # Price data and trading logs
│   ├── *.json / *.jsonl       # US stock price files (gitignored)
│   ├── A_stock/               # Chinese A-shares data + fetchers
│   ├── crypto/                # Cryptocurrency data + fetchers
│   ├── agent_data/            # Trading logs organized by model signature
│   ├── get_daily_price.py     # Main US price data fetcher
│   ├── get_interdaily_price.py # Hourly data fetcher
│   └── merge_jsonl.py         # Consolidate price data into JSONL
│
├── scripts/                   # Shell scripts for execution workflows
│   ├── main.sh                # Full workflow (data + MCP + trading + UI)
│   ├── main_step1.sh          # Step 1: Fetch and merge price data
│   ├── main_step2.sh          # Step 2: Start MCP tool services
│   ├── main_step3.sh          # Step 3: Run trading agents
│   ├── main_a_stock_step*.sh  # A-shares multi-step scripts
│   ├── main_crypto_step*.sh   # Crypto multi-step scripts
│   ├── precompute_frontend_cache.py # Generate dashboard cache files
│   └── start_ui.sh            # Start web dashboard
│
├── docs/                      # Frontend dashboard (GitHub Pages)
│   ├── index.html             # Main dashboard page
│   ├── portfolio.html         # Portfolio view
│   ├── check_data.html        # Data verification tool
│   ├── config.yaml            # Frontend configuration
│   └── assets/                # Static CSS, JS, images
│
└── .github/workflows/
    └── deploy-pages.yml       # CI: GitHub Pages deployment
```

## Tech Stack

- **Agent Framework:** LangChain (`langchain==1.0.2`, `langchain-openai==1.0.1`)
- **Tool Protocol:** MCP via `fastmcp==2.12.5` and `langchain-mcp-adapters`
- **Data APIs:** Alpha Vantage (US stocks, news), TuShare (A-shares), Jina AI (web search)
- **Supported LLMs:** Claude, GPT-5, Deepseek, Qwen, Gemini (via OpenAI-compatible APIs)
- **Data Storage:** Filesystem-based JSON/JSONL (no database)
- **Frontend:** Static HTML/JS/CSS deployed to GitHub Pages
- **Async:** Python `asyncio` for agent execution

## Key Architecture Patterns

### Agent Registry (Dynamic Loading)
Agents are registered in `main.py:16` via `AGENT_REGISTRY` dict and loaded dynamically using `importlib`. To add a new agent type, add an entry to the registry and create the corresponding module.

Available agent types:
- `BaseAgent` - US stocks, daily
- `BaseAgent_Hour` - US stocks, hourly
- `BaseAgentAStock` - Chinese A-shares, daily
- `BaseAgentAStock_Hour` - Chinese A-shares, hourly
- `BaseAgentCrypto` - Cryptocurrency

### MCP Tool Architecture
Each tool runs as an independent HTTP server using `fastmcp`. Services are managed by `agent_tools/start_mcp_services.py` which handles port allocation, conflict detection, and graceful shutdown. Default ports:
- 8000: Math
- 8001: Jina Search
- 8002: Trade (stocks)
- 8003: Get Price
- 8005: Crypto Trade

### Configuration Hierarchy
Runtime config resolution order (in `tools/general_tools.py`):
1. `.runtime_env.json` (persistent runtime state)
2. Environment variables (from `.env`)
3. Default values

### File-Based Concurrency
Position updates in `tool_trade.py` and `tool_crypto_trade.py` use `fcntl` file locks (`.position.lock`) for thread-safe concurrent trading across multiple agents.

### Data Format Conventions
- **Daily dates:** `YYYY-MM-DD` (string-comparable)
- **Hourly dates:** `YYYY-MM-DD HH:MM:SS` (zero-padded)
- **Price data:** Standard OHLCV (Open, High, Low, Close, Volume) in JSON
- **Position logs:** JSONL format (one JSON record per line, append-only)

## Common Commands

### Setup
```bash
pip install -r requirements.txt
cp .env.example .env  # Then fill in API keys
```

### Running a Trading Simulation (Full Workflow)
```bash
bash scripts/main.sh
```

### Running Step by Step
```bash
# 1. Fetch and merge price data
bash scripts/main_step1.sh

# 2. Start MCP tool servers (runs in background)
bash scripts/main_step2.sh

# 3. Run trading agents
bash scripts/main_step3.sh
# Or with a specific config:
python main.py configs/default_config.json
```

### A-Shares / Crypto Variants
```bash
bash scripts/main_a_stock_step1.sh  # then step2, step3
bash scripts/main_crypto_step1.sh   # then step2, step3
```

### Frontend Dashboard
```bash
# Generate cache files, then serve
python scripts/precompute_frontend_cache.py
cd docs && python3 -m http.server 8888
```

### Regenerate Frontend Cache
```bash
bash scripts/regenerate_cache.sh
```

## Configuration Guide

Config files live in `configs/` as JSON. Key fields:

```json
{
  "agent_type": "BaseAgent",          // Agent class name from AGENT_REGISTRY
  "market": "us",                      // "us", "cn", or "crypto"
  "date_range": {
    "init_date": "2025-10-01",         // Start date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
    "end_date": "2025-10-21"           // End date
  },
  "models": [
    {
      "name": "gpt-5",                // Display name
      "basemodel": "openai/gpt-5",    // Provider/model-id
      "signature": "gpt-5",           // Unique ID for logs/positions
      "enabled": true,                 // Toggle model on/off
      "openai_base_url": "",           // Optional: override API base URL
      "openai_api_key": ""             // Optional: override API key
    }
  ],
  "agent_config": {
    "max_steps": 30,                   // Max LLM reasoning steps per trading day
    "max_retries": 3,                  // Retry count on failure
    "base_delay": 1.0,                 // Retry backoff base (seconds)
    "initial_cash": 10000.0,           // Starting capital
    "verbose": true                    // Detailed logging
  },
  "log_config": {
    "log_path": "./data/agent_data"    // Where trading logs are stored
  }
}
```

Initial capital defaults: $10,000 (US), 100,000 CNY (A-shares), 50,000 USDT (crypto).

## Environment Variables

Required in `.env`:
- `OPENAI_API_BASE` / `OPENAI_API_KEY` - LLM API access
- `ALPHAADVANTAGE_API_KEY` - US stock price data and news
- `JINA_API_KEY` - Web search for market intelligence
- `TUSHARE_TOKEN` - Chinese A-shares data (only for A-stock trading)

Port configuration (defaults shown):
- `MATH_HTTP_PORT=8000`
- `SEARCH_HTTP_PORT=8001`
- `TRADE_HTTP_PORT=8002`
- `GETPRICE_HTTP_PORT=8003`
- `CRYPTO_HTTP_PORT=8005`

Other:
- `AGENT_MAX_STEP=30`
- `RUNTIME_ENV_PATH` - Path to runtime env JSON file

## CI/CD

- **GitHub Actions** (`.github/workflows/deploy-pages.yml`): On push to `main`, generates frontend cache files and deploys `docs/` to GitHub Pages.
- No automated test pipeline exists. Testing is manual via shell scripts and test configs.

## Code Conventions

### Naming
- **Agent classes:** PascalCase (`BaseAgent`, `BaseAgentAStock`)
- **Tool functions:** snake_case (`get_price_local`, `buy_crypto`)
- **Config keys:** snake_case in JSON (`init_date`, `agent_type`)
- **Model IDs:** `provider/model-id` format (`openai/gpt-5`, `anthropic/claude-3.7-sonnet`)
- **Signatures:** Unique string identifiers for each model run, used as directory names

### File Organization
- Agent implementations go in `agent/<market_type>/`
- MCP tools go in `agent_tools/` as standalone server scripts
- Shared utilities go in `tools/`
- System prompts go in `prompts/`
- Config files go in `configs/`

### Error Handling
- Agent errors log with emoji-prefixed messages and continue to next model or exit
- MCP services detect port conflicts and auto-resolve
- File locks use context managers for clean resource cleanup
- JSON parsing includes fallback to string on decode errors

### Trading Constraints
- US stocks: Integer share quantities
- A-shares: Lot sizes must be multiples of 100 shares
- Crypto: Float quantities allowed
- All trades validate against cash balance before execution

## Testing

No formal test framework (pytest, unittest) is configured. Testing is done via:
- Shell scripts that run end-to-end trading simulations
- Test config files (`configs/test_*.json` - gitignored)
- Data validation via `docs/check_data.html`
- Manual verification of position JSONL files

Test-related files are gitignored: `test.py`, `test_*.py`, `configs/test_*.json`, `data/agent_data/test*/`.

## Adding a New Agent Type

1. Create a new module in `agent/<market_type>/`
2. Implement the agent class following the pattern of existing agents (inherit from or mirror `BaseAgent`)
3. Register it in `AGENT_REGISTRY` in `main.py`
4. Add prompts in `prompts/`
5. Create a config file in `configs/`

## Adding a New MCP Tool

1. Create `agent_tools/tool_<name>.py` using `fastmcp`:
   ```python
   from fastmcp import FastMCP
   mcp = FastMCP("ToolName")

   @mcp.tool()
   def my_tool(args): ...

   mcp.run(transport="streamable-http", host="0.0.0.0", port=PORT)
   ```
2. Add it to `agent_tools/start_mcp_services.py` service list
3. Add port env var to `.env.example`
4. Register the tool URL in the agent's MCP client setup

## Data Pipeline

```
External APIs (Alpha Vantage / TuShare / efinance)
    ↓
data/get_daily_price.py (or get_interdaily_price.py)
    ↓
Individual JSON files per symbol (data/*.json)
    ↓
data/merge_jsonl.py
    ↓
Consolidated JSONL files (data/merged_*.jsonl)
    ↓
agent_tools/tool_get_price_local.py (serves to agents via MCP)
```

## Gitignored Items to Be Aware Of

- `.env` - API keys (use `.env.example` as template)
- `.runtime_env.json` - Transient runtime state
- `data/*.json` / `data/*.jsonl` - Price data files (fetched at runtime)
- `logs/` - Application logs
- `configs/test_*.json` - Test configurations
- `data/agent_data/test*/` - Test trading data
