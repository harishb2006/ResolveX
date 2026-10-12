"""Demo-only authentication settings and signed JWT helpers."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

APP_ENV = os.getenv("APP_ENV", "development").lower()
IS_PRODUCTION = APP_ENV == "production"
if IS_PRODUCTION:
    raise RuntimeError("ResolveX's fixed OTP/password demo authentication is local-development only")


def setting(name: str, development_default: str, *aliases: str) -> str:
    for variable in (name, *aliases):
        value = os.getenv(variable, "").strip()
        if value:
            return value
    return development_default


ADMIN_USERNAME = setting("DEMO_ADMIN_USERNAME", "admin", "ADMIN_USERNAME", "username")
ADMIN_PASSWORD = setting("DEMO_ADMIN_PASSWORD", "admin123", "ADMIN_PASSWORD", "password")
DEMO_USER_MOBILE = setting("DEMO_USER_MOBILE", "2222222222")
DEMO_USER_OTP = setting("DEMO_USER_OTP", "654321")
JWT_SECRET_KEY = setting("JWT_SECRET_KEY", "local-development-only-change-before-deploy")
JWT_ISSUER = "resolvex"
JWT_SESSION_HOURS = 8
