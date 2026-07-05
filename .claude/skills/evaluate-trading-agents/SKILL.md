---
name: evaluate-trading-agents
description: Evaluate and compare AI trading agent performance in the AI-Trader project. Use when asked to analyze agent results, compare models, diagnose trading behavior, run metrics, check who's winning, or identify what's wrong with a strategy. Knows the exact file layout, metrics definitions, and how to call the existing tools. Do NOT use for general financial analysis unrelated to this project.
---

# Evaluate Trading Agents

Produces a structured performance report for one or more AI trading agents running in the AI-Trader project. Uses the project's existing `tools/calculate_metrics.py` and `tools/plot_metrics.py` where possible, and falls back to direct Python analysis when needed.

---

## File layout (memorize this)

```
data/
  agent_data/{signature}/position/position.jsonl      # US stocks
  agent_data_astock/{signature}/position/position.jsonl  # CN A-shares
  agent_data_crypto/{signature}/position/position.jsonl  # Crypto

  daily_prices_{TICKER}.json    # US stock OHLC (hourly + daily)
  A_stock/daily_prices_{TICKER}.json   # A-share OHLC
  crypto/coin/daily_prices_{PAIR}.json # Crypto OHLC
```

**Position file entry (one JSON object per line):**
```json
{
  "date": "2025-10-01 10:00:00",
  "id": 0,
  "this_action": {"action": "buy", "symbol": "NVDA", "amount": 10},
  "positions": {"NVDA": 10, "MSFT": 0, ..., "CASH": 8500.0}
}
```

- `date` format is `YYYY-MM-DD HH:MM:SS` for hourly agents, `YYYY-MM-DD` for daily
- `this_action` is absent on the first (initializing) line
- `CASH` is always in the positions dict; stock keys are present even at zero
- `id` is the sequential step counter within the simulation

**Known agent signatures** (as of the current runs):
- US stocks: `gpt-5`, `claude-3.7-sonnet`, `deepseek-chat-v3.1`, `MiniMax-M2`, `qwen3-max`, `gemini-2.5-flash`
- Check `ls data/agent_data/` for the current list — do not assume

---

## Metrics definitions

The project's canonical metrics (from `tools/calculate_metrics.py`):

| Metric | Symbol | Definition | Good value |
|--------|--------|------------|------------|
| Cumulative Return | CR | `(final - initial) / initial` | Higher is better |
| Sortino Ratio | SR | Excess return / downside std deviation, annualized | > 1.0 is good, > 2.0 is excellent |
| Volatility | Vol | Annualized std dev of period returns | Lower is better for same return |
| Maximum Drawdown | MDD | Largest peak-to-trough decline | Closer to 0 is better |
| Sharpe Ratio | — | Excess return / total std deviation, annualized | > 1.0 acceptable, > 2.0 strong |
| Calmar Ratio | — | Annualized return / abs(MDD) | > 1.0 is good |
| Win Rate | — | Profitable periods / total periods | > 50% is baseline |
| Number of Trades | — | Position changes across all periods | Context-dependent |

**Annualization periods:**
- Hourly US/A-shares: 252 × 6.5 = 1638 periods/year
- Daily: 252 periods/year
- Crypto: 365 periods/year

---

## Workflow

### Step 1 — Identify what to evaluate

Determine:
- Which market? US (`agent_data`), A-shares (`agent_data_astock`), or Crypto (`agent_data_crypto`)
- Which agents? List the target signatures or evaluate all
- Which date range? Check the earliest and latest dates in the position files

```bash
ls data/agent_data/                                    # list all US agent signatures
wc -l data/agent_data/*/position/position.jsonl       # check record counts per agent
head -1 data/agent_data/gpt-5/position/position.jsonl # check start date
tail -1 data/agent_data/gpt-5/position/position.jsonl # check end date
```

### Step 2 — Run the existing metrics tool

Use the project's tool first — it handles price lookup, annualization, and file output automatically.

```bash
# US stocks (hourly)
python tools/calculate_metrics.py \
  data/agent_data/gpt-5/position/position.jsonl \
  --data-dir data \
  --is-hourly

# A-shares
python tools/calculate_metrics.py \
  data/agent_data_astock/claude-3.7-sonnet/position/position.jsonl \
  --data-dir data/A_stock \
  --is-astock

# Crypto
python tools/calculate_metrics.py \
  data/agent_data_crypto/gpt-5/position/position.jsonl \
  --data-dir data/crypto \
  --is-crypto
```

The tool writes `performance_metrics.json` and `portfolio_values.csv` into the same directory as the position file.

**Run for every agent in the comparison, not just one.**

### Step 3 — If metrics tool fails, compute manually

Use this when price data is missing or the tool errors:

```python
import json, pandas as pd, numpy as np
from pathlib import Path

def load_positions(path: str) -> pd.DataFrame:
    records = [json.loads(l) for l in Path(path).read_text().strip().splitlines()]
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date").reset_index(drop=True)

def trade_summary(df: pd.DataFrame) -> dict:
    """Compute what we can from positions alone (no price lookup needed)."""
    initial_cash = df.iloc[0]["positions"].get("CASH", 10000.0)

    # Trades: entries where this_action exists and action != "no_trade"
    trades = [
        r["this_action"] for r in df.to_dict("records")
        if r.get("this_action") and r["this_action"].get("action") not in ("no_trade", None, "")
    ]
    buys  = [t for t in trades if t["action"] == "buy"]
    sells = [t for t in trades if t["action"] == "sell"]

    # Cash trajectory
    cash_series = df["positions"].apply(lambda p: p.get("CASH", 0))

    # Symbols traded
    all_symbols = set()
    for _, row in df.iterrows():
        for sym, amt in row["positions"].items():
            if sym != "CASH" and amt > 0:
                all_symbols.add(sym)

    return {
        "initial_cash": initial_cash,
        "final_cash": cash_series.iloc[-1],
        "total_periods": len(df),
        "total_trades": len(trades),
        "buy_count": len(buys),
        "sell_count": len(sells),
        "no_trade_count": len(df) - 1 - len(trades),  # -1 for init row
        "symbols_traded": sorted(all_symbols),
        "unique_symbols_count": len(all_symbols),
        "cash_min": cash_series.min(),
        "cash_max": cash_series.max(),
        "date_start": str(df["date"].iloc[0].date()),
        "date_end":   str(df["date"].iloc[-1].date()),
    }
```

### Step 4 — Diagnose behavioral patterns

After metrics, check for behavioral issues by scanning the trade log:

```python
def diagnose_behavior(df: pd.DataFrame) -> list[str]:
    issues = []
    trades = [
        r["this_action"] for r in df.to_dict("records")
        if r.get("this_action") and r["this_action"].get("action") not in ("no_trade", None, "")
    ]
    total_periods = len(df) - 1  # exclude init row

    if total_periods == 0:
        return ["⚠️ No trading periods found"]

    # 1. Overtrading: trades > 2× average
    trade_rate = len(trades) / total_periods
    if trade_rate > 0.5:  # more than one trade every 2 periods
        issues.append(f"⚠️ Overtrading: {len(trades)} trades over {total_periods} periods ({trade_rate:.1%} trade rate)")

    # 2. Excessive cash-holding: never deploys capital
    cash_series = df["positions"].apply(lambda p: p.get("CASH", 0))
    initial_cash = cash_series.iloc[0]
    pct_periods_all_cash = (cash_series >= initial_cash * 0.98).mean()
    if pct_periods_all_cash > 0.6:
        issues.append(f"⚠️ Cash hoarding: holds 100% cash in {pct_periods_all_cash:.0%} of periods — prompt may be too risk-averse")

    # 3. Concentration: > 80% of trades in 3 or fewer symbols
    from collections import Counter
    symbol_counts = Counter(t["symbol"] for t in trades if t.get("symbol"))
    if symbol_counts:
        top3 = sum(v for _, v in symbol_counts.most_common(3))
        concentration = top3 / len(trades)
        if concentration > 0.8:
            top3_syms = [s for s, _ in symbol_counts.most_common(3)]
            issues.append(f"⚠️ Over-concentration: {concentration:.0%} of trades in {top3_syms} — recency or anchoring bias likely")

    # 4. Asymmetric buy/sell: buys >> sells (or vice versa)
    buys  = sum(1 for t in trades if t["action"] == "buy")
    sells = sum(1 for t in trades if t["action"] == "sell")
    if sells > 0 and buys / sells > 5:
        issues.append(f"⚠️ Buy-heavy: {buys} buys vs {sells} sells — agent may not be taking profits")
    if buys > 0 and sells / buys > 5:
        issues.append(f"⚠️ Sell-heavy: {sells} sells vs {buys} buys — agent may be panic-selling")

    if not issues:
        issues.append("✅ No behavioral anomalies detected")

    return issues
```

### Step 5 — Compute benchmark return for the same period

Always compare agent performance to the market index for the same date range. Read the QQQ price file (US), SSE 50 index (A-shares), or spot BTC (crypto):

```python
def benchmark_return(start_date: str, end_date: str, market: str = "us") -> float:
    """Returns the benchmark's cumulative return over the same period."""
    if market == "us":
        # QQQ is the NASDAQ 100 ETF — proxy for the trading universe
        price_file = Path("data/daily_prices_QQQ.json")
    elif market == "crypto":
        price_file = Path("data/crypto/coin/daily_prices_BTC.json")
    else:
        return None  # A-shares benchmark varies; skip if unavailable

    if not price_file.exists():
        return None

    data = json.loads(price_file.read_text())
    ts_key = next((k for k in data if "Time Series" in k), None)
    if not ts_key:
        return None

    ts = data[ts_key]
    dates = sorted(d for d in ts if start_date[:10] <= d <= end_date[:10])
    if len(dates) < 2:
        return None

    p_start = float(ts[dates[0]].get("4. close", 0))
    p_end   = float(ts[dates[-1]].get("4. close", 0))
    return (p_end - p_start) / p_start if p_start else None
```

### Step 6 — Assemble and output the report

---

## Output format

Produce exactly this structure. Do not abbreviate, do not skip sections.

```markdown
## AI-Trader Performance Report
**Market**: US Stocks (NASDAQ 100) | A-Shares (SSE 50) | Crypto
**Period**: YYYY-MM-DD to YYYY-MM-DD  (N trading sessions)
**Initial capital**: $10,000 / ¥100,000 / 50,000 USDT
**Benchmark**: QQQ / SSE 50 Index / BTC  +X.X% over period

---

### Performance Summary

| Agent | CR | SR (Sortino) | MDD | Vol | Win Rate | Trades | vs Benchmark |
|-------|----|-------------|-----|-----|----------|--------|--------------|
| gpt-5 | +X.X% | X.XX | -X.X% | X.X% | XX% | XXX | +X.Xpp |
| claude-3.7-sonnet | ... | ... | ... | ... | ... | ... | ... |
| deepseek-chat-v3.1 | ... | ... | ... | ... | ... | ... | ... |
| qwen3-max | ... | ... | ... | ... | ... | ... | ... |

_Sorted by SR (Sortino) descending. "pp" = percentage points vs benchmark._

---

### Agent-by-Agent Findings

**[Agent name] (signature: `{signature}`)**
- **Verdict**: [Outperforming / Inline with market / Underperforming / Inactive]
- **Behavior**: [1–2 sentences on what the agent actually does — what it buys, how often, any pattern]
- **Issues**: [Behavioral diagnosis output, or "None detected"]
- **Recommendation**: [Keep running / Tune prompt / Disable — with specific reason]

[Repeat for each agent]

---

### Key Findings

1. [Finding 1 — quantified, e.g. "GPT-5 leads on risk-adjusted return (SR 2.1) while taking less drawdown (-3.8%) than DeepSeek (-8.7%)"]
2. [Finding 2]
3. [Finding 3]

### Recommended Actions

| Action | Agent | Reason |
|--------|-------|--------|
| Keep running | gpt-5 | Highest SR, below-average drawdown |
| Tune prompt — reduce overtrading | deepseek-chat-v3.1 | 212 trades vs 98 average; excess costs, similar return |
| Disable | qwen3-max | Negative return (-2.1%), below benchmark by 7pp |

---

### Data Quality Notes

[Any missing price files, partial date ranges, agents with fewer than 10 sessions, or lookahead risk flags.]
```

---

## Concrete example — great result

**Prompt**: "Who's winning in the US stock competition?"

**Expected output (abbreviated):**
```markdown
## AI-Trader Performance Report
**Market**: US Stocks (NASDAQ 100)
**Period**: 2025-10-01 to 2025-10-21  (147 hourly sessions)
**Initial capital**: $10,000
**Benchmark**: QQQ +4.8% over period

### Performance Summary

| Agent | CR | SR | MDD | Vol | Win Rate | Trades | vs Benchmark |
|-------|----|----|-----|-----|----------|--------|--------------|
| gpt-5 | +12.4% | 2.10 | -3.8% | 14.2% | 58% | 147 | +7.6pp |
| claude-3.7-sonnet | +9.1% | 1.54 | -4.1% | 16.8% | 55% | 98 | +4.3pp |
| deepseek-chat-v3.1 | +6.3% | 0.97 | -8.7% | 22.1% | 51% | 212 | +1.5pp |
| MiniMax-M2 | +3.2% | 0.51 | -6.1% | 19.4% | 49% | 178 | -1.6pp |
| qwen3-max | -2.1% | -0.31 | -14.2% | 28.7% | 44% | 183 | -6.9pp |

### Agent-by-Agent Findings

**GPT-5 (signature: `gpt-5`)**
- **Verdict**: Outperforming
- **Behavior**: Concentrates in semiconductors (NVDA, AVGO) early, rotates to cash during dips. Average hold: 4.2 sessions.
- **Issues**: ✅ No behavioral anomalies detected
- **Recommendation**: Keep running. Best risk-adjusted return in the cohort.

**Qwen3-Max (signature: `qwen3-max`)**
- **Verdict**: Underperforming
- **Behavior**: High trade frequency (183 trades), 44% win rate. Sells into strength and buys into weakness in 60% of observed sessions.
- **Issues**: ⚠️ Overtrading (183 trades, 1.25 trade/session) ⚠️ Buy-heavy in down sessions (possible panic-buying pattern)
- **Recommendation**: Disable. Negative return below benchmark by 6.9pp. Suggest prompt revision to add explicit position-sizing rules before re-enabling.

### Key Findings

1. GPT-5 achieves a Sortino of 2.10 — significantly above all peers — while holding MDD to -3.8%, the tightest in the cohort.
2. DeepSeek-v3.1 trades 2.2× more than Claude but earns only 69% as much return — the excess trading is destroying value, not creating it.
3. Three of five agents (GPT-5, Claude, DeepSeek) beat the QQQ benchmark; two do not.

### Recommended Actions

| Action | Agent | Reason |
|--------|-------|--------|
| Keep running | gpt-5, claude-3.7-sonnet | Consistent positive alpha vs QQQ |
| Tune prompt | deepseek-chat-v3.1 | Reduce trade frequency; add "only trade if conviction > 7/10" rule |
| Disable | qwen3-max | Negative absolute return, worst Sortino, high drawdown |
| Watch | MiniMax-M2 | Below benchmark but early data — 7 more sessions needed before decision |
```

---

## Do-nots

- **Never skip the benchmark comparison.** A +6% return looks great until you see QQQ returned +8%. Always compute alpha.
- **Never evaluate fewer than 10 trading sessions.** With fewer than 10 data points, win rates and Sortino ratios are statistically meaningless — flag this and defer judgment.
- **Never compute metrics by hand when `calculate_metrics.py` exists and the price data is present.** Use the tool; it handles edge cases (missing prices, hourly vs. daily annualization) that manual code misses.
- **Never use `total_value` from positions alone without price lookup.** Cash balance alone is not portfolio value — unrealized stock positions are invisible without pricing. If price data is unavailable, explicitly state that the metrics are cash-only and may be understated.
- **Never confuse Sharpe and Sortino.** This project's canonical risk-adjusted metric is SR = Sortino Ratio. Sharpe is also computed but is secondary. Lead the table with Sortino.
- **Never report a recommendation without a reason.** "Disable qwen3-max" is not actionable. "Disable qwen3-max — negative return, below benchmark by 6.9pp, overtrading confirmed" is.
- **Never compare agents with mismatched date ranges as if they ran the same experiment.** If GPT-5 has 147 sessions and Claude has 83, normalize or flag it before ranking.
- **Never suggest editing position files directly** — they are the source of truth and are write-locked during agent runs. Analysis is always read-only.
