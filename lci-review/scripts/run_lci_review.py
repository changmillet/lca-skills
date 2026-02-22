#!/usr/bin/env python3
"""Backward-compatible wrapper for legacy invocations."""
import subprocess
import sys
from pathlib import Path


def main():
    entry = Path(__file__).resolve().parent / "run_review.py"
    cmd = [sys.executable, str(entry), "--profile", "process", *sys.argv[1:]]
    raise SystemExit(subprocess.call(cmd))


if __name__ == "__main__":
    main()
