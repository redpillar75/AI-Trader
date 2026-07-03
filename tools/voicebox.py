"""
Voicebox REST API integration for trade voice alerts.
Requires Voicebox desktop app running at http://127.0.0.1:17493.
Failures are logged but never raise — voice alerts are best-effort.
"""

import logging
import threading
from typing import Optional

logger = logging.getLogger(__name__)

VOICEBOX_URL = "http://127.0.0.1:17493"
CLIENT_ID = "ai-trader"


def _post_speak(text: str, profile: Optional[str] = None) -> None:
    try:
        import urllib.request, json as _json
        payload = {"text": text}
        if profile:
            payload["profile"] = profile
        data = _json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{VOICEBOX_URL}/speak",
            data=data,
            headers={"Content-Type": "application/json", "X-Voicebox-Client-Id": CLIENT_ID},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5):
            pass
    except Exception as e:
        logger.debug("Voicebox speak failed (app may not be running): %s", e)


def speak(text: str, profile: Optional[str] = None) -> None:
    """Fire-and-forget voice alert via Voicebox. Never blocks the caller."""
    threading.Thread(target=_post_speak, args=(text, profile), daemon=True).start()


def trade_alert(action: str, symbol: str, amount: int, price: Optional[float] = None) -> None:
    """Announce a trade execution."""
    price_str = f" at ${price:.2f}" if price is not None else ""
    text = f"{action} {amount} shares of {symbol}{price_str}."
    speak(text)
