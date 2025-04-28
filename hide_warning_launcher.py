#!/usr/bin/env python3
"""
A special launcher for the parachute game that redirects stderr to hide the macOS warning.

This script redirects the warning about "Secure coding is not enabled for restorable state"
to /dev/null, which prevents it from appearing in the terminal.
"""

import os
import sys
import platform
import subprocess

if __name__ == "__main__":
    # Path to the game script
    game_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'parachute_game.py')
    
    if platform.system() == 'Darwin':
        # On macOS, redirect stderr to /dev/null to hide the warning
        with open(os.devnull, 'w') as devnull:
            # Run the game with stderr redirected
            process = subprocess.Popen(
                [sys.executable, game_script],
                stderr=devnull
            )
            # Wait for the game to finish
            process.wait()
            # Exit with the same code
            sys.exit(process.returncode)
    else:
        # On other platforms, just run the game normally
        result = subprocess.run([sys.executable, game_script])
        sys.exit(result.returncode)