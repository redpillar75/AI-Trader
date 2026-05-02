# Free Claude Code Proxy

Routes Claude Code API calls to alternative providers (NVIDIA NIM, OpenRouter, DeepSeek, LM Studio, llama.cpp, Ollama).

## Installation

Already installed as a `uv` tool:

```bash
uv tool install git+https://github.com/Alishahryar1/free-claude-code.git
fcc-init   # creates ~/.config/free-claude-code/.env
```

## Configuration

Edit `/root/.config/free-claude-code/.env` and set your API key and model:

**OpenRouter (free models available):**
```dotenv
OPENROUTER_API_KEY="sk-or-your-key"
MODEL="open_router/deepseek/deepseek-r1-0528:free"
```

**NVIDIA NIM:**
```dotenv
NVIDIA_NIM_API_KEY="nvapi-your-key"
MODEL="nvidia_nim/z-ai/glm4.7"
```

**Per-tier routing:**
```dotenv
MODEL_OPUS="nvidia_nim/moonshotai/kimi-k2.5"
MODEL_SONNET="open_router/deepseek/deepseek-r1-0528:free"
MODEL_HAIKU="ollama/llama3.2"
```

## Start the Proxy

```bash
free-claude-code
# Proxy runs on http://localhost:8082
```

## Connect Claude Code

```bash
ANTHROPIC_AUTH_TOKEN="freecc" ANTHROPIC_BASE_URL="http://localhost:8082" claude
```
