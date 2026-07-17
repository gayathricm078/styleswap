"""Start every service in one terminal.

    python run_all.py

Ctrl-C stops all of them. Each line of output is prefixed with the service
name. If a service dies, its exit is reported and the rest keep running.
"""
import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from shared.config import PORTS  # noqa: E402

SERVICES = [
    ("auth", "services/auth_service/app.py"),
    ("catalog", "services/catalog_service/app.py"),
    ("cart", "services/cart_service/app.py"),
    ("wishlist", "services/wishlist_service/app.py"),
    ("order", "services/order_service/app.py"),
    ("coupon", "services/coupon_service/app.py"),
    ("notification", "services/notification_service/app.py"),
    ("ai", "services/ai_service/app.py"),
    ("gateway", "gateway/app.py"),
]

# The standalone try-on service lives outside backend/ and launches as a module
# from its own directory. Started here only if present, so the stack still runs
# for anyone who hasn't set it up. ai-service degrades to a clear 503 without it.
VTON_DIR = BACKEND_ROOT.parent / "vton-service"

COLORS = ["\033[36m", "\033[32m", "\033[33m", "\033[35m", "\033[34m",
          "\033[91m", "\033[92m", "\033[93m", "\033[95m"]
RESET = "\033[0m"

procs: list[tuple[str, subprocess.Popen]] = []


def pump(name: str, color: str, proc: subprocess.Popen) -> None:
    prefix = f"{color}{name:<13}{RESET}|"
    for line in iter(proc.stdout.readline, ""):
        if line:
            print(f"{prefix} {line.rstrip()}", flush=True)
    code = proc.wait()
    if code not in (0, -signal.SIGTERM, signal.SIGTERM):
        print(f"{prefix} \033[91mexited with code {code}{RESET}", flush=True)


def shutdown(*_args) -> None:
    print("\nStopping services...", flush=True)
    for _name, proc in procs:
        if proc.poll() is None:
            proc.terminate()
    for _name, proc in procs:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    sys.exit(0)


def main() -> int:
    if not (BACKEND_ROOT / ".env").exists():
        print("backend/.env is missing. Copy backend/.env.example to backend/.env first.")
        return 1

    env = os.environ.copy()
    # Services import `shared.*`; make that resolvable regardless of cwd.
    env["PYTHONPATH"] = str(BACKEND_ROOT) + os.pathsep + env.get("PYTHONPATH", "")
    env["PYTHONUNBUFFERED"] = "1"

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # (name, argv, cwd) for every process to launch.
    launches: list[tuple[str, list[str], str]] = [
        (name, [sys.executable, str(BACKEND_ROOT / rel)], str(BACKEND_ROOT))
        for name, rel in SERVICES
    ]
    if (VTON_DIR / "app" / "main.py").exists():
        launches.append(("vton", [sys.executable, "-m", "app.main"], str(VTON_DIR)))

    for i, (name, argv, cwd) in enumerate(launches):
        proc = subprocess.Popen(
            argv,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        procs.append((name, proc))
        threading.Thread(
            target=pump, args=(name, COLORS[i % len(COLORS)], proc), daemon=True
        ).start()
        port = PORTS.get(name, "8009" if name == "vton" else "?")
        print(f"  started {name:<13} :{port}", flush=True)

    print(f"\n  Gateway    http://localhost:{PORTS['gateway']}")
    print(f"  Health     http://localhost:{PORTS['gateway']}/api/health")
    print("  Ctrl-C to stop everything\n", flush=True)

    try:
        while True:
            time.sleep(1)
            for name, proc in procs:
                if proc.poll() is not None and proc.returncode != 0:
                    pass  # reported by the pump thread
    except KeyboardInterrupt:
        shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
