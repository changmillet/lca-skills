"""MinIO configuration helpers for KB artifacts."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

from minio import Minio


@dataclass(slots=True)
class MinioConfig:
    """Connection parameters for the MinIO bucket storing KB artifacts."""

    endpoint: str
    access_key: str
    secret_key: str
    bucket_name: str
    prefix: str = ""
    secure: bool = True
    session_token: str | None = None

    def normalized_prefix(self) -> str:
        """Return the configured prefix without leading/trailing slashes."""
        text = (self.prefix or "").strip("/")
        return text

    def build_prefix(self, *parts: str | None) -> str:
        """Compose a remote key prefix using the configured root prefix."""
        components = [self.normalized_prefix(), *parts]
        return join_remote_path(*components)


def load_minio_config() -> MinioConfig:
    """Load MinIO config from environment variables."""
    endpoint_raw = _env_first("TIANGONG_MINIO_ENDPOINT", "MINIO_ENDPOINT") or ""
    access_key = _env_first("TIANGONG_MINIO_ACCESS_KEY", "MINIO_ACCESS_KEY") or ""
    secret_key = _env_first("TIANGONG_MINIO_SECRET_KEY", "MINIO_SECRET_KEY") or ""
    bucket_name = _env_first("TIANGONG_MINIO_BUCKET_NAME", "MINIO_BUCKET_NAME") or ""
    prefix = _env_first("TIANGONG_MINIO_PREFIX", "MINIO_PREFIX") or ""
    if not endpoint_raw:
        raise SystemExit("MinIO endpoint missing. Set TIANGONG_MINIO_ENDPOINT.")
    if not access_key:
        raise SystemExit("MinIO access_key missing. Set TIANGONG_MINIO_ACCESS_KEY.")
    if not secret_key:
        raise SystemExit("MinIO secret_key missing. Set TIANGONG_MINIO_SECRET_KEY.")
    if not bucket_name:
        raise SystemExit("MinIO bucket_name missing. Set TIANGONG_MINIO_BUCKET_NAME.")

    endpoint, secure_from_endpoint = _normalize_endpoint(endpoint_raw)
    secure_override = _optional_bool(_env_first("TIANGONG_MINIO_SECURE", "MINIO_SECURE"))
    secure = secure_override if secure_override is not None else secure_from_endpoint
    session_token = _optional_str(_env_first("TIANGONG_MINIO_SESSION_TOKEN", "MINIO_SESSION_TOKEN"))

    return MinioConfig(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        bucket_name=bucket_name,
        prefix=prefix,
        secure=secure,
        session_token=session_token,
    )


def create_minio_client(config: MinioConfig) -> Minio:
    """Instantiate a MinIO client based on the provided configuration."""
    return Minio(
        config.endpoint,
        access_key=config.access_key,
        secret_key=config.secret_key,
        secure=config.secure,
        session_token=config.session_token,
    )


def join_remote_path(*components: str | None) -> str:
    """Join multiple path components using POSIX separators."""
    parts: list[str] = []
    for component in components:
        if not component:
            continue
        text = str(component).strip("/")
        if text:
            parts.append(text)
    return "/".join(parts)


def _normalize_endpoint(value: str) -> tuple[str, bool]:
    parsed = urlparse(value)
    if parsed.scheme:
        endpoint = parsed.netloc or parsed.path
        if not endpoint:
            raise SystemExit(f"Invalid MinIO endpoint: {value}")
        secure = parsed.scheme.lower() != "http"
        return endpoint, secure
    sanitized = value.strip()
    if not sanitized:
        raise SystemExit("MinIO endpoint cannot be blank.")
    return sanitized, True


def _optional_bool(value: Any) -> bool | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return None


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _env_first(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None
