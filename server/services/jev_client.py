"""Small raw-HTTP client for Jev AI's documented SystemOne endpoint."""

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from dotenv import load_dotenv

BASE_URL = "https://jev-ai.pro/api"
DEFAULT_MODEL = "jev-latest"
MAX_BODY_BYTES = 256_000
MAX_QUESTIONS = 64

# Load local server/.env as a convenience for development; real deployment
# secrets should be injected through the hosting platform's environment.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class JevConfigurationError(RuntimeError):
    pass


class JevRequestError(RuntimeError):
    def __init__(self, status: int | None, code: int | str | None, retry_after: str | None, run_id: str | None, uncertain: bool = False):
        self.status = status
        self.code = code
        self.retry_after = retry_after
        self.run_id = run_id
        self.uncertain = uncertain
        super().__init__(f"Jev AI request failed (HTTP {status or 'network error'}).")


@dataclass
class JevResponse:
    body: dict[str, Any]
    metadata: dict[str, str]


def configured_model() -> str:
    return os.getenv("JEV_AI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL


def _api_key() -> str:
    key = os.getenv("JEV_AI_API_KEY", "").strip() or os.getenv("Jev_api_key", "").strip()
    if not key:
        raise JevConfigurationError("Set JEV_AI_API_KEY in the server environment before calling Jev AI.")
    return key


def _safe_metadata(headers) -> dict[str, str]:
    names = (
        "X-Jev-Run-Id",
        "X-Jev-Billing",
        "X-Jev-Paid-Input-Tokens-Used",
        "X-Jev-Model-Multiplier",
        "X-Jev-Credits-Charged",
        "X-Jev-Tokens-Remaining",
        "X-Jev-Credits-Remaining",
        "Retry-After",
    )
    return {name.lower().replace("-", "_"): headers.get(name) for name in names if headers.get(name) is not None}


def _request(path: str, method: str, body: dict[str, Any] | None = None) -> JevResponse:
    key = _api_key()
    data = json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf-8") if body is not None else None
    if data is not None and len(data) > MAX_BODY_BYTES:
        raise ValueError(f"Jev request body exceeds {MAX_BODY_BYTES} bytes.")
    headers = {"Authorization": f"Bearer {key}", "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=18 if method == "GET" else 28) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return JevResponse(payload, _safe_metadata(response.headers))
    except HTTPError as error:
        retry_after = error.headers.get("Retry-After") if error.headers else None
        run_id = error.headers.get("X-Jev-Run-Id") if error.headers else None
        error_code = None
        try:
            error_payload = json.loads(error.read().decode("utf-8"))
            error_code = (error_payload.get("error") or {}).get("code")
        except (ValueError, AttributeError):
            pass
        # Decision POSTs are never replayed automatically. 504 and transport
        # failures can have uncertain outcomes; callers must inspect usage first.
        raise JevRequestError(error.code, error_code, retry_after, run_id, uncertain=method == "POST" and error.code in (502, 503, 504)) from None
    except (URLError, TimeoutError, OSError):
        raise JevRequestError(None, None, None, None, uncertain=method == "POST") from None


def list_models() -> JevResponse:
    """Authenticated, no-inference connectivity check from Jev's docs."""
    return _request("/v1/models", "GET")


def system_one(state: dict[str, Any], questions: dict[str, Any], model: str | None = None) -> JevResponse:
    if not isinstance(state, (dict, list, str)) or not state:
        raise ValueError("Jev state must contain nonempty text, an object, or an array.")
    if not isinstance(questions, dict) or not 1 <= len(questions) <= MAX_QUESTIONS:
        raise ValueError(f"Jev requires between 1 and {MAX_QUESTIONS} questions.")
    for question_id in questions:
        if not isinstance(question_id, str) or not question_id or len(question_id) > 64:
            raise ValueError("Jev question IDs must be 1 to 64 characters.")
    body = {"model": model or configured_model(), "state": state, "questions": questions}
    return _request("/v1/systemone", "POST", body)
