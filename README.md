# Parachute Game

A simple 2D parachute game where you jump from a plane and navigate to land safely while avoiding obstacles.

## How to Play

1. Run the game: `python parachute_game.py`
2. Watch as the plane flies across the top of the screen
3. Your character will automatically jump out of the plane
4. Controls:
   - Press `SPACE` to deploy your parachute
   - Use `LEFT` and `RIGHT` arrow keys to control horizontal movement
   - Avoid obstacles on the ground
   - Land safely (slow descent) to win

## Requirements

- Python 3.x
- Pygame

## Installation

1. Make sure you have Python installed
2. Install Pygame: `pip install pygame`
3. Run the game: `python parachute_game.py`

## Sound Files

The game uses several sound effects that are stored in a `sounds` folder:
- `parachute_open.wav`: Played when deploying the parachute
- `crash.wav`: Played when crashing
- `landing.wav`: Played when landing safely
- `jump.wav`: Played when jumping from the plane
- `wind.wav`: Played when wind changes
- `background.wav`: Background music

To generate these sound files, run:
```
python3 create_sounds_simple.py
```

This script will create the necessary sound files with simple tones. If you want to use your own sound files, simply replace the files in the `sounds` directory with your own WAV files of the same names.

## Notes

- If you see a warning about "Secure coding is not enabled for restorable state" on macOS, this is a harmless warning related to macOS's state restoration feature and doesn't affect gameplay.
- If sounds aren't playing, make sure you've run the `create_sounds_simple.py` script to generate the sound files.