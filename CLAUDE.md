# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-Trader is a benchmark/arena where autonomous LLM agents (GPT, Claude, Qwen, etc.) trade NASDAQ 100 stocks, SSE 50 A-shares, or cryptocurrencies (BITWISE10) against real historical market data with **zero human intervention**. Agents interact with the market exclusively through MCP (Model Context Protocol) tool calls — trading, price lookups, search, and math — never through direct code execution. A core design goal is **anti-look-ahead**: agents can only see market data/news up to the current simulated timestamp.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in API keys (see below)
```

Required env vars (`.env`, loaded via `python-dotenv` in nearly every entry point):
- `OPENAI_API_BASE`, `OPENAI_API_KEY` — LLM access (used for all model backends via an OpenAI-compatible proxy)
- `ALPHAADVANTAGE_API_KEY` — NASDAQ 100 + crypto price/news data
- `JINA_API_KEY` — market info search (legacy search tool)
- `TUSHARE_TOKEN` — A-share data (optional, Tushare preferred over Alpha Vantage for A-shares)
- `RUNTIME_ENV_PATH` — path to a shared runtime state JSON file (recommended: absolute path); defaults to `data/.runtime_env.json`
- `MATH_HTTP_PORT` (8000), `SEARCH_HTTP_PORT` (8001), `TRADE_HTTP_PORT` (8002), `GETPRICE_HTTP_PORT` (8003), `CRYPTO_HTTP_PORT` (8005)
- `AGENT_MAX_STEP` — max reasoning steps per agent turn

## Running

There is no test suite, linter, or build step in this repo — verification is done by running the pipeline end-to-end. Every run has three stages: prepare data → start MCP tool servers → run the agent loop.

```bash
# US stocks (NASDAQ 100) — one-shot
bash scripts/main.sh
# or step by step:
bash scripts/main_step1.sh   # fetch + merge price data (data/get_daily_price.py, data/merge_jsonl.py)
bash scripts/main_step2.sh   # start MCP tool servers (agent_tools/start_mcp_services.py)
bash scripts/main_step3.sh   # python main.py [config_path]

# A-shares (SSE 50)
bash scripts/main_a_stock_step1.sh
bash scripts/main_a_stock_step2.sh
bash scripts/main_a_stock_step3.sh   # python main.py configs/astock_config.json

# Crypto (BITWISE10)
bash scripts/main_crypto_step1.sh
bash scripts/main_crypto_step2.sh
bash scripts/main_crypto_step3.sh   # python main.py configs/default_crypto_config.json

# Web dashboard
bash scripts/start_ui.sh   # http://localhost:8888
```

`main.py` must always be run with the MCP tool servers (`agent_tools/start_mcp_services.py`) already running in the background — it connects to them over HTTP on the ports above, it does not spawn them.

To run a single model/config directly: `python main.py configs/<name>.json`. `main_parrallel.py` runs multiple configs/models concurrently instead of sequentially.

Performance metrics: `bash calc_perf.sh` (or `python data/calculate_performance.py`) computes Sharpe ratio, max drawdown, annualized return, etc. from the agent trading logs.

## Architecture

### Agent dispatch (`main.py`)
`main.py` reads a JSON config, looks up `agent_type` in `AGENT_REGISTRY` to dynamically import the right agent class, resolves `market` (`us`/`cn`/`crypto`, auto-forced by A-share/crypto agent types), then for each enabled model in `config["models"]`:
1. Checks `data/{log_path}/{signature}/position/position.jsonl` — if absent, treats it as a fresh start and wipes the shared runtime-env file so the agent restarts from `init_date`. This is what makes runs resumable: re-running the same config continues from wherever the position file left off instead of replaying from scratch.
2. Writes `SIGNATURE`, `IF_TRADE`, `MARKET`, `LOG_PATH` into the shared runtime-env JSON (path from `RUNTIME_ENV_PATH`) — this is how the out-of-process MCP tool servers know which agent/market/log-path a given tool call belongs to, since tools and agent run as separate processes communicating only via MCP.
3. Instantiates the agent class and drives the day-by-day (or hour-by-hour) simulation loop between `init_date` and `end_date`.

### Agent classes (`agent/`)
Five agent classes, one per market/granularity combination, kept intentionally separate rather than unified behind config flags:
- `agent.base_agent.base_agent.BaseAgent` / `base_agent_hour.BaseAgent_Hour` — US stocks, daily/hourly
- `agent.base_agent_astock.base_agent_astock.BaseAgentAStock` / `base_agent_astock_hour.BaseAgentAStock_Hour` — A-shares, daily/hourly (T+1 rules, hourly bars fixed at 10:30/11:30/14:00/15:00), Chinese-language prompts
- `agent.base_agent_crypto.base_agent_crypto.BaseAgentCrypto` — BITWISE10 crypto pool, USDT-denominated, 24/7 (no market-hours gating)

Each agent class owns the simulation clock, the LangChain agent loop (`langchain` + `langchain-mcp-adapters` connecting to the MCP tool servers over HTTP), trade/position logging, and retry/backoff around LLM calls (`max_retries`, `base_delay`).

### MCP tool servers (`agent_tools/`)
Each tool is a standalone FastMCP HTTP server process, started/stopped together by `start_mcp_services.py`:
- `tool_math.py` — math/financial calculations
- `tool_alphavantage_news.py` (current default) / `tool_jina_search.py` (legacy) — market news search
- `tool_trade.py` — stock/A-share buy/sell + position management (auto-applies T+0 vs T+1 and lot-size rules based on `MARKET`)
- `tool_get_price_local.py` — price lookups against local JSONL data, auto-recognizing symbol format
- `tool_crypto_trade.py` — crypto buy/sell (`buy_crypto()`/`sell_crypto()`)

Tools read agent identity/market context (`SIGNATURE`, `MARKET`, `LOG_PATH`) from the shared runtime-env file (`tools/general_tools.py: get_config_value`/`write_config_value`), not from function arguments — this is the coupling point between `main.py`/the agent loop and the tool servers. `_resolve_runtime_env_path()` resolves `RUNTIME_ENV_PATH` relative to the project root if given as a relative path.

### Data (`data/`)
Per-market raw price fetch + merge scripts producing a unified JSONL format consumed by `tool_get_price_local.py`:
- US: `data/get_daily_price.py` → `data/merge_jsonl.py` → `data/merged.jsonl` (Alpha Vantage)
- A-share: `data/A_stock/get_daily_price_tushare.py` (preferred) or `get_daily_price_alphavantage.py`, plus `get_interdaily_price_astock.py` for hourly (efinance) → respective `merge_*.py` scripts → `merged.jsonl` / `merged_hourly.jsonl`
- Crypto: `data/crypto/get_daily_price_crypto.py` → `merge_crypto_jsonl.py` → `crypto_merged.jsonl`

Agent trading logs are written under `data/agent_data/`, `data/agent_data_astock/`, `data/agent_data_astock_hour/`, `data/agent_data_crypto/`, one subdirectory per model `signature`, each containing a `position/position.jsonl` used both for resuming and for performance calculation. **Runtime trading data is intentionally not committed to the repo** (it's published to Hugging Face monthly instead) — don't assume `agent_data*/` reflects current state.

### Anti-look-ahead
All price/news tools filter by the current simulated timestamp (tracked via the runtime-env file), not wall-clock time — when adding or modifying a data tool, preserve this filtering or the backtest becomes invalid.

### Configs (`configs/`)
JSON files select `agent_type`, `market`, `date_range` (supports `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS` for hourly agents), the list of `models` (each with `basemodel`, `signature`, optional per-model `openai_base_url`/`openai_api_key`), and `agent_config`/`log_config`. `INIT_DATE`/`END_DATE` env vars override the config's date range if set. Adding a new strategy means adding an agent class inheriting from an existing base agent plus a config file — no core changes needed (this is the intended contribution path, see README "How to use this dataset").

### Frontend
`scripts/start_ui.sh` serves a web dashboard (leaderboard, per-agent reasoning traces) reading from the trading logs; `scripts/precompute_frontend_cache.py` / `regenerate_cache.sh` precompute the cache it reads from.
