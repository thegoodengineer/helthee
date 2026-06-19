import os
import sys
import subprocess
import time
import signal

def main():
    # Detect execution path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to virtual environment binaries
    if os.name == 'nt':
        python_executable = os.path.join(base_dir, '.venv', 'Scripts', 'python.exe')
        npm_cmd = 'npm.cmd'
    else:
        python_executable = os.path.join(base_dir, '.venv', 'bin', 'python')
        npm_cmd = 'npm'
        
    if not os.path.exists(python_executable):
        print(f"Error: Python virtual environment not found at: {python_executable}")
        print("Please ensure the environment is initialized first.")
        sys.exit(1)

    print("====================================================")
    print("           STARTING HELTHEE HEALTH FRAMEWORK        ")
    print("====================================================")
    
    processes = []
    
    try:
        # 1. Start FastAPI backend
        print("[Backend] Launching FastAPI server on http://localhost:8000...")
        backend_proc = subprocess.Popen(
            [python_executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=base_dir,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(backend_proc)
        
        # Give backend a moment to start
        time.sleep(2)
        
        # 2. Start React frontend dev server
        frontend_dir = os.path.join(base_dir, 'frontend')
        print(f"[Frontend] Starting Vite dev server on http://localhost:5173...")
        
        # Use shell=True on Windows to call npm command correctly
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=frontend_dir,
            shell=(os.name == 'nt'),
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(frontend_proc)
        
        print("\nBoth servers are running!")
        print("Press Ctrl+C to terminate both servers.\n")
        
        # Keep main thread alive and monitor processes
        while True:
            for proc in processes:
                if proc.poll() is not None:
                    # One of the processes exited
                    raise KeyboardInterrupt
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n[System] Shutting down servers...")
    finally:
        # Terminate all processes
        for proc in processes:
            if proc.poll() is None:
                try:
                    if os.name == 'nt':
                        # Windows termination
                        subprocess.Popen(f"taskkill /F /T /PID {proc.pid}", shell=True, stdout=subprocess.DEVNULL)
                    else:
                        proc.terminate()
                        proc.wait(timeout=2)
                except Exception as e:
                    print(f"Error stopping process: {e}")
                    
        print("[System] All servers stopped. Thank you for using Helthee!")

if __name__ == '__main__':
    main()
