# Parachute Game

A simple 2D parachute game where you jump from a plane and navigate to land safely while avoiding obstacles.

## How to Play

1. Run the game with one of these methods:
   - Standard: `python3 parachute_game.py`
   - Without warning (macOS): `python3 hide_warning_launcher.py`
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

- macOS users may see a warning about "Secure coding is not enabled for restorable state". This is harmless and doesn't affect gameplay. To suppress this warning:
  - Use the `hide_warning_launcher.py` script to launch the game instead
  - This script redirects stderr to hide the warning message
- If sounds aren't playing, make sure you've run the `create_sounds_simple.py` script to generate the sound files.
  
## Web Version
The browser-based version is now **fully functional**, built with Phaser 3 and featuring all the desktop game mechanics:

### Features:
- **Complete gameplay parity** with the Python version
- **Physics simulation** including gravity, wind effects, and parachute deployment
- **Sound effects** generated using Web Audio API
- **Responsive design** that works on desktop and mobile browsers
- **High score persistence** using browser local storage
- **Real-time wind effects** with visual indicators
- **Safe landing zones** marked on the ground
- **Collision detection** for obstacles and landing
- **Score calculation** based on landing precision and parachute timing

### How to Play (Web Version):
1. **Navigate to the web folder:**
   ```bash
   cd web
   ```
2. **Start a local web server:**
   ```bash
   python3 -m http.server 8080
   ```
3. **Open your browser and visit:** `http://localhost:8080`
4. **Game Controls:**
   - Watch the plane fly across the screen
   - Your character automatically jumps from the plane
   - Press **SPACE** to deploy your parachute
   - Use **LEFT** and **RIGHT** arrow keys to control horizontal movement
   - Avoid obstacles (green blocks with yellow warning markers)
   - Land in the **green safe zones** for bonus points
   - Press **R** to restart after game over

### Game Mechanics:
- **Wind Effects:** Random wind pushes you left or right when parachute is deployed
- **Landing Speed:** Land too fast and you crash - deploy parachute to slow down
- **Safe Zones:** White-marked green areas between obstacles give bonus points
- **Scoring:** Based on landing precision, safe zone bonus, and parachute timing
- **High Scores:** Top 10 scores automatically saved in browser storage

### Deployment:
The web version can be deployed to any static hosting service:
- **GitHub Pages**
- **Netlify** 
- **Vercel**
- **Any web server** that can serve static HTML/CSS/JavaScript files

Simply upload the contents of the `web/` folder to your hosting service.