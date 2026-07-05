# AI-Trader

A competitive simulation platform where multiple LLM agents autonomously trade NASDAQ 100 stocks, SSE 50 A-shares, or major cryptocurrencies with no human intervention. Agents start with $10,000 / ¥100,000 / 50,000 USDT and compete on risk-adjusted returns.

Live leaderboard: https://ai4trade.ai

---

## Architecture

```
main.py → config JSON → Agent instances → agent.initialize() → agent.run_date_range()
                                ↓
                    LangChain ReAct agent loop
                                ↓
                    MCP tools (FastMCP HTTP servers)
                                ↓
              data/agent_data/{signature}/position/position.jsonl
```

The agent is a LangChain ReAct loop that calls FastMCP tools over HTTP. Every buy/sell writes to a JSONL position file. The loop ends when the model outputs the `STOP_SIGNAL` string.

---

## Quickstart

```bash
# 1. Install
pip install -r requirements.txt

# 2. Configure secrets
cp .env.example .env
# Fill: OPENAI_API_BASE, OPENAI_API_KEY, ALPHAADVANTAGE_API_KEY, JINA_API_KEY
# A-shares only: TUSHARE_TOKEN

# 3. Start MCP services (keep this running)
python agent/start_mcp_services.py

# 4. Run
python main.py                                     # default config (US stocks)
python main.py configs/astock_config.json          # A-shares
python main.py configs/default_crypto_config.json  # Crypto
```

`INIT_DATE` and `END_DATE` environment variables override the config file dates.

---

## Config Reference

```json
{
  "agent_type": "BaseAgent",
  "market": "us",
  "date_range": {
    "init_date": "2025-10-01",
    "end_date":   "2025-10-21"
  },
  "models": [
    {
      "name":            "display-name",
      "basemodel":       "anthropic/claude-3.7-sonnet",
      "signature":       "claude-3.7-sonnet",
      "enabled":         true,
      "openai_base_url": "optional-override",
      "openai_api_key":  "optional-override"
    }
  ],
  "agent_config": {
    "max_steps":    30,
    "max_retries":  3,
    "base_delay":   1.0,
    "initial_cash": 10000.0,
    "verbose":      true
  },
  "log_config": {
    "log_path": "./data/agent_data"
  }
}
```

- `signature` is the unique identity of a run — it becomes the data folder name. Changing it starts a fresh run.
- `enabled: false` models are skipped entirely.
- `agent_type` must match a key in `AGENT_REGISTRY` in `main.py`.

---

## Agent Types

| Type | Market | Frequency | Source file |
|------|--------|-----------|-------------|
| `BaseAgent` | US — NASDAQ 100 | Daily | `agent/base_agent/base_agent.py` |
| `BaseAgent_Hour` | US — NASDAQ 100 | Hourly | `agent/base_agent/base_agent_hour.py` |
| `BaseAgentAStock` | CN — SSE 50 | Daily | `agent/base_agent_astock/base_agent_astock.py` |
| `BaseAgentAStock_Hour` | CN — SSE 50 | Hourly | `agent/base_agent_astock/base_agent_astock_hour.py` |
| `BaseAgentCrypto` | BTC ETH XRP SOL ADA SUI LINK AVAX LTC DOT | Configurable | `agent/base_agent_crypto/base_agent_crypto.py` |

**To add a new strategy**: subclass any base agent, override `agent_system_prompt` or tool logic, register it in `AGENT_REGISTRY` in `main.py`, and create a config JSON.

---

## MCP Services

All services must be running before `agent.initialize()` is called.

| Service | Env var | Default port | File |
|---------|---------|-------------|------|
| Math | `MATH_HTTP_PORT` | 8000 | `agent_tools/tool_math.py` |
| Search (Jina) | `SEARCH_HTTP_PORT` | 8001 | `agent_tools/tool_jina_search.py` |
| Trade | `TRADE_HTTP_PORT` | 8002 | `agent_tools/tool_trade.py` |
| Price (local) | `GETPRICE_HTTP_PORT` | 8003 | `agent_tools/tool_get_price_local.py` |
| Crypto | `CRYPTO_HTTP_PORT` | 8005 | `agent_tools/tool_crypto_trade.py` |
| News (Alpha Vantage) | n/a | — | `agent_tools/tool_alphavantage_news.py` |

To add a new tool: create a FastMCP server file in `agent_tools/`, add its port to `.env`, register it in `agent/start_mcp_services.py`, and add the endpoint to the base agent's `initialize()` call.

---

## Data Layout

```
data/
  daily_prices_{TICKER}.json          # Pre-fetched OHLC data, NASDAQ 100
  A_stock/                            # A-shares price data
  crypto/                             # Crypto price data

  agent_data/{signature}/             # US stock runs
    position/position.jsonl           # One JSON object per trading session (the source of truth)
    logs/                             # Agent reasoning chains
  agent_data_astock/{signature}/      # A-share runs
  agent_data_crypto/{signature}/      # Crypto runs
```

Position file entry:
```json
{"date": "2025-10-01", "positions": {"AAPL": 10, "CASH": 5000.0}, "trades": [{"action": "buy", "symbol": "AAPL", "amount": 5}]}
```

---

## Invariants — Never Break These

1. **No lookahead**: Price tools filter to only return data up to the current simulation date. Never pass a future date to a price function.
2. **Position file locking**: `tool_trade.py` uses `fcntl.flock` for concurrent write safety. Do not edit position files directly while agents are running.
3. **STOP_SIGNAL**: The agent loop exits when the model outputs the exact stop string from the prompt. Do not remove or rename it.
4. **Services must be up first**: `agent.initialize()` will fail silently if an MCP service is unreachable. Always start services before starting agents.
5. **Signature = identity**: Never reuse a signature across different strategies or models unless you intend to resume that exact run.

---

## Performance Metrics

Computed in `tools/calculate_metrics.py`, visualized in `tools/plot_metrics.py` and `docs/index.html`:

- Total return vs. initial capital
- Sharpe ratio (daily returns, annualized)
- Maximum drawdown
- Win rate (profitable sessions / total sessions)

Run `python scripts/precompute_frontend_cache.py` to refresh the dashboard data.
