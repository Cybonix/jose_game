import pygame
import os

# Initialize pygame mixer
pygame.mixer.init()

# Create sounds directory if it doesn't exist
if not os.path.exists("sounds"):
    os.makedirs("sounds")

# Function to create a simple sound file
def create_sound(filename, duration=1.0, frequency=440):
    """Create a simple sound file with the given parameters"""
    sample_rate = 44100
    buffer = pygame.mixer.Sound.from_buffer(
        pygame.mixer.Sound(pygame.mixer.Sound(
            bytes([127 + int(127 * pygame.math.sin(2 * 3.14159 * frequency * i / sample_rate)) 
                  for i in range(int(sample_rate * duration))])
        ).get_buffer())
    )
    buffer.set_volume(0.5)
    buffer.save(os.path.join("sounds", filename))
    print(f"Created sound file: {filename}")

# Create all needed sound files
create_sound("parachute_open.wav", duration=0.5, frequency=300)
create_sound("crash.wav", duration=0.8, frequency=100)
create_sound("landing.wav", duration=0.3, frequency=500)
create_sound("jump.wav", duration=0.2, frequency=400)
create_sound("wind.wav", duration=1.0, frequency=200)
create_sound("background.wav", duration=3.0, frequency=350)

print("All sound files created successfully!")