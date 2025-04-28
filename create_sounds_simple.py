import pygame
import numpy as np
import os
import wave
import struct

# Initialize pygame
pygame.init()
pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)

# Make sounds directory if it doesn't exist
if not os.path.exists("sounds"):
    os.makedirs("sounds")

# Function to create WAV files directly
def create_wav_file(filename, duration=1.0, frequency=440):
    sample_rate = 44100
    amplitude = 32767  # Max amplitude for 16-bit audio
    num_samples = int(sample_rate * duration)
    
    # Create empty arrays for left and right channels
    data = []
    for i in range(num_samples):
        # Simple sine wave
        value = int(amplitude * np.sin(2 * np.pi * frequency * i / sample_rate))
        # Pack as signed 16-bit value
        data.append(struct.pack('<h', value))
    
    # Convert to bytes
    data = b''.join(data)
    
    # Write to WAV file
    with wave.open(filename, 'wb') as wav_file:
        # Set parameters (nchannels, sampwidth, framerate, nframes, comptype, compname)
        wav_file.setparams((1, 2, sample_rate, num_samples, 'NONE', 'not compressed'))
        wav_file.writeframes(data)
    
    print(f"Created {filename}")

# Create sound files with different characteristics
sound_files = [
    ("parachute_open.wav", 0.5, 300),  # filename, duration, frequency
    ("crash.wav", 0.8, 100),
    ("landing.wav", 0.3, 500),
    ("jump.wav", 0.2, 400),
    ("wind.wav", 1.0, 200),
    ("background.wav", 3.0, 350)
]

# Create all sound files
for sound_file, duration, frequency in sound_files:
    path = os.path.join("sounds", sound_file)
    create_wav_file(path, duration, frequency)

print("All sound files created successfully!")