"""Application configuration primitives."""

from __future__ import annotations

import os
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from pydantic import HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

from .models import SettingsProfile

ENV_REMOTE_TRANSPORT = "TIANGONG_LCA_REMOTE_TRANSPORT"
ENV_REMOTE_SERVICE_NAME = "TIANGONG_LCA_REMOTE_SERVICE_NAME"
ENV_REMOTE_URL = "TIANGONG_LCA_REMOTE_URL"
ENV_REMOTE_API_KEY = "TIANGONG_LCA_REMOTE_API_KEY"
ENV_REMOTE_AUTHORIZATION = "TIANGONG_LCA_REMOTE_AUTHORIZATION"
ENV_REMOTE_TIMEOUT = "TIANGONG_LCA_REMOTE_TIMEOUT"
ENV_KB_REMOTE_TRANSPORT = "TIANGONG_KB_REMOTE_TRANSPORT"
ENV_KB_REMOTE_SERVICE_NAME = "TIANGONG_KB_REMOTE_SERVICE_NAME"
ENV_KB_REMOTE_URL = "TIANGONG_KB_REMOTE_URL"
ENV_KB_REMOTE_API_KEY = "TIANGONG_KB_REMOTE_API_KEY"
ENV_KB_REMOTE_AUTHORIZATION = "TIANGONG_KB_REMOTE_AUTHORIZATION"
ENV_KB_REMOTE_TIMEOUT = "TIANGONG_KB_REMOTE_TIMEOUT"


def _authorization_header(
    api_key: str | None,
    header_name: str | None = None,
    prefix: str | None = None,
) -> dict[str, str]:
    if not api_key:
        return {}
    header = (header_name or "Authorization").strip()
    if not header:
        return {}
    if prefix is None:
        prefix = "Bearer"
    prefix = prefix.strip()
    if prefix:
        value = f"{prefix} {api_key}".strip()
    else:
        value = api_key
    return {header: value}


class Settings(BaseSettings):
    """Central configuration for the spec coding workflow."""

    mcp_base_url: HttpUrl = "https://lcamcp.tiangong.earth/mcp"
    mcp_api_key: str | None = None
    mcp_transport: Literal["streamable_http"] = "streamable_http"
    mcp_connections: dict[str, dict[str, Any]] | None = None
    flow_search_service_name: str = "tiangong_lca_remote"
    flow_search_tool_name: str = "Search_Flows_Tool"
    flow_search_max_parallel: int = 1
    flow_search_state_code: int | None = 100

    request_timeout: float = 30.0
    flow_search_timeout: float | None = None
    max_retries: int = 3
    retry_backoff: float = 0.5
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    workflow_profile: Literal["default", "batch", "debug"] = "default"
    max_concurrency: int = 4

    cache_dir: Path = Path("artifacts/cache")
    artifacts_dir: Path = Path("artifacts")
    flow_hint_catalog_path: Path | None = None
    stage2_exchange_retry_attempts: int = 2

    model_config = SettingsConfigDict(env_prefix="LCA_", env_file=(), extra="ignore")

    @property
    def profile(self) -> SettingsProfile:
        """Expose derived profile information for orchestrator policies."""
        if self.workflow_profile == "batch":
            return SettingsProfile(
                concurrency=self.max_concurrency,
                retry_attempts=self.max_retries + 2,
                cache_results=True,
                profile_name="batch",
            )
        if self.workflow_profile == "debug":
            return SettingsProfile(
                concurrency=1,
                retry_attempts=1,
                cache_results=False,
                profile_name="debug",
            )
        return SettingsProfile(
            concurrency=min(self.max_concurrency, 4),
            retry_attempts=self.max_retries,
            cache_results=True,
            profile_name="default",
        )

    def flow_search_mcp_config(self) -> dict[str, Any]:
        """Return the MCP configuration block for the flow search service."""
        config: dict[str, Any] = {
            "transport": self.mcp_transport,
            "url": str(self.mcp_base_url),
        }
        headers = _authorization_header(self.mcp_api_key)
        if headers:
            config["headers"] = headers
        timeout = self.flow_search_timeout or self.request_timeout
        if timeout and timeout > 0:
            config["timeout"] = float(timeout)
        return config

    def mcp_service_configs(self) -> dict[str, dict[str, Any]]:
        """Return a mapping of MCP service names to their configuration blocks."""
        configs: dict[str, dict[str, Any]] = dict(self.mcp_connections or {})
        flow_service_name = self.flow_search_service_name or "tiangong_lca_remote"
        configs.setdefault(flow_service_name, self.flow_search_mcp_config())
        return configs


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""
    overrides = _load_settings_overrides()
    settings = Settings(**overrides)
    settings.artifacts_dir.mkdir(parents=True, exist_ok=True)
    settings.cache_dir.mkdir(parents=True, exist_ok=True)
    return settings


def get_mcp_service_configs() -> dict[str, dict[str, Any]]:
    """Convenience helper returning the configured MCP service blocks."""
    return get_settings().mcp_service_configs()


def _load_settings_overrides() -> dict[str, Any]:
    """Load configuration overrides from environment variables only."""
    overrides: dict[str, Any] = {}

    # Dedicated environment variables for the flow-search MCP target.
    env_overrides = _load_tiangong_lca_remote_env_overrides()
    overrides.update(env_overrides)

    kb_timeout_default = _coerce_float(_env_text("LCA_REQUEST_TIMEOUT"))
    if kb_timeout_default is None:
        kb_timeout_default = float(Settings.model_fields["request_timeout"].default)
    kb_service_name, kb_connection = _load_tiangong_kb_remote_env_connection(timeout_default=kb_timeout_default)
    if kb_service_name and kb_connection:
        existing = _load_mcp_connections_env()
        existing.update(dict(overrides.get("mcp_connections") or {}))
        existing[kb_service_name] = kb_connection
        overrides["mcp_connections"] = existing

    return {key: value for key, value in overrides.items() if value is not None}


def _load_mcp_connections_env() -> dict[str, dict[str, Any]]:
    raw = _env_text("LCA_MCP_CONNECTIONS")
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    if not isinstance(parsed, dict):
        return {}
    normalized: dict[str, dict[str, Any]] = {}
    for key, value in parsed.items():
        if not isinstance(key, str) or not isinstance(value, dict):
            continue
        normalized[key] = value
    return normalized


def _load_tiangong_lca_remote_env_overrides() -> dict[str, Any]:
    overrides: dict[str, Any] = {}

    transport = _env_text(ENV_REMOTE_TRANSPORT)
    if transport:
        overrides["mcp_transport"] = transport

    service_name = _env_text(ENV_REMOTE_SERVICE_NAME)
    if service_name:
        overrides["flow_search_service_name"] = service_name

    base_url = _env_text(ENV_REMOTE_URL)
    if base_url:
        overrides["mcp_base_url"] = base_url

    api_key_raw = _env_text(ENV_REMOTE_API_KEY) or _env_text(ENV_REMOTE_AUTHORIZATION)
    api_key = _sanitize_api_key(api_key_raw)
    if api_key:
        overrides["mcp_api_key"] = api_key

    timeout_value = _coerce_float(_env_text(ENV_REMOTE_TIMEOUT))
    if timeout_value is not None:
        overrides["flow_search_timeout"] = timeout_value
    return overrides


def _load_tiangong_kb_remote_env_connection(*, timeout_default: float) -> tuple[str | None, dict[str, Any] | None]:
    base_url = _env_text(ENV_KB_REMOTE_URL)
    if not base_url:
        return None, None

    transport = _env_text(ENV_KB_REMOTE_TRANSPORT) or "streamable_http"
    service_name = _env_text(ENV_KB_REMOTE_SERVICE_NAME) or "TianGong_KB_Remote"
    api_key_raw = _env_text(ENV_KB_REMOTE_API_KEY) or _env_text(ENV_KB_REMOTE_AUTHORIZATION)
    api_key = _sanitize_api_key(api_key_raw)
    timeout_value = _coerce_float(_env_text(ENV_KB_REMOTE_TIMEOUT))
    if timeout_value is None:
        timeout_value = float(timeout_default)

    config: dict[str, Any] = {
        "transport": transport,
        "url": base_url,
        "timeout": float(timeout_value),
    }
    headers = _authorization_header(api_key)
    if headers:
        config["headers"] = headers
    return service_name, config


def _env_text(name: str) -> str | None:
    value = os.getenv(name)
    if value is None:
        return None
    text = value.strip()
    return text or None


def _sanitize_api_key(value: str | None, prefix: str | None = None) -> str | None:
    if not value:
        return None
    token = value.strip()
    if prefix is None:
        prefix_text = "Bearer"
    elif isinstance(prefix, str):
        prefix_text = prefix.strip()
    else:
        prefix_text = ""
    if prefix_text and token.lower().startswith(f"{prefix_text.lower()} "):
        token = token[len(prefix_text) + 1 :].strip()
    return token or None


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        try:
            return float(text)
        except ValueError:
            return None
