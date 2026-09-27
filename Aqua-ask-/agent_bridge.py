"""Voice-agent command bridge. ElevenLabs posts an action; the open page polls and runs it."""
from __future__ import annotations

import os
import threading
import time
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()
_lock = threading.Lock()
_state = {
    "id": 0,
    "action": "",
    "detail": "",
    "at": 0.0,
}

ACTIONS = {
    "open_home": "Opening the home screen.",
    "open_globe": "Opening the 3D globe.",
    "open_maps": "Opening the 2D maps.",
    "close_maps": "Closing the map.",
    "open_ask": "Opening Ask.",
    "search_city": "Searching that coastal city.",
    "open_card": "Opening that card.",
    "zoom_in": "Zooming the globe in.",
    "zoom_out": "Zooming the globe out.",
    "set_layer": "Switching the globe layer.",
    "open_compass": "Opening the GPS compass.",
    "open_wallet": "Opening Wallet.",
    "open_milestone": "Opening Milestone.",
}


class AgentCommand(BaseModel):
    action: str = Field(description="UX action to run in the open browser.")
    detail: str = Field(default="", description="City, card, question, or layer.")


def _secret() -> str:
    return os.getenv("AGENT_WEBHOOK_SECRET", "").strip()


def _authorized(header_secret: Optional[str], authorization: Optional[str]) -> bool:
    expected = _secret()
    if not expected:
        return True
    provided = (header_secret or "").strip()
    if not provided and authorization:
        token = authorization.strip()
        if token.lower().startswith("bearer "):
            token = token[7:].strip()
        provided = token
    if len(provided) != len(expected):
        return False
    import hmac
    return hmac.compare_digest(provided, expected)


@router.post("/api/agent/command")
def post_command(
    body: AgentCommand,
    x_agent_secret: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    if not _authorized(x_agent_secret, authorization):
        raise HTTPException(status_code=401, detail="Invalid agent secret.")
    action = (body.action or "").strip().lower().replace(" ", "_").replace("-", "_")
    if action not in ACTIONS:
        raise HTTPException(status_code=400, detail="Unknown action. Use one of: " + ", ".join(ACTIONS))
    detail = (body.detail or "").strip()
    with _lock:
        _state["id"] += 1
        _state["action"] = action
        _state["detail"] = detail
        _state["at"] = time.time()
        command_id = _state["id"]
    said = ACTIONS[action]
    if detail and action in ("open_maps", "search_city", "open_card", "open_ask", "set_layer"):
        said = said[:-1] + ": " + detail + "."
    return {
        "ok": True,
        "id": command_id,
        "action": action,
        "detail": detail,
        "said": said,
    }


@router.get("/api/agent/command")
def get_command(since: int = 0):
    with _lock:
        if _state["id"] <= since:
            return {"ok": True, "command": None}
        command = {
            "id": _state["id"],
            "action": _state["action"],
            "detail": _state["detail"],
            "at": _state["at"],
        }
    return {"ok": True, "command": command}
