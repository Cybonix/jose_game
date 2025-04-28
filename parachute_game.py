import random
import os
import json
import platform
import sys
import pygame

# Initialize Pygame
pygame.init()
pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)

# Note about macOS secure coding warning:
# The warning "Secure coding is not enabled for restorable state!" is a macOS-specific
# warning that appears when running PyGame on macOS. It's related to macOS's state
# restoration feature and doesn't affect the game's functionality or security.
# A proper fix would require implementing macOS-specific AppKit/Cocoa code, which
# is beyond the scope of this simple game.

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
pygame.display.set_caption("Parachute Game")

# Colors
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLACK = (0, 0, 0)
SKY_BLUE = (135, 206, 235)
YELLOW = (255, 255, 0)
SAFE_ZONE_COLOR = (0, 200, 0, 100)  # Green with transparency

# Create a transparent surface for safe zone markers
def create_transparent_surface(width, height, color):
    surface = pygame.Surface((width, height), pygame.SRCALPHA)
    surface.fill(color)
    return surface

# Load sound files
def load_sound(sound_name):
    try:
        # First, ensure the sounds directory exists
        if not os.path.exists("sounds"):
            os.makedirs("sounds")
            # Create sound files if they don't exist
            print("Sound directory created. Please run create_sounds_simple.py to generate sound files.")
            return None
            
        sound_path = os.path.join("sounds", sound_name)
        
        # Check if the sound file exists
        if os.path.exists(sound_path):
            try:
                sound = pygame.mixer.Sound(sound_path)
                # Set reasonable volume
                sound.set_volume(0.7)
                return sound
            except pygame.error as e:
                print(f"Error loading sound {sound_name}: {e}")
                return None
        else:
            print(f"Sound file not found: {sound_name}")
            return None
    except Exception as e:
        print(f"Error loading sound {sound_name}: {e}")
        return None

# Check if sound files exist and suggest creating them if not
if not os.path.exists("sounds") or not os.listdir("sounds"):
    print("\nSound files missing! Creating sounds directory.")
    if not os.path.exists("sounds"):
        os.makedirs("sounds")
    print("Please run 'python3 create_sounds_simple.py' to generate sound files before playing.")

# Clock for controlling frame rate
clock = pygame.time.Clock()
FPS = 60

# Player class
class Player:
    def __init__(self):
        self.width = 40
        self.height = 60
        self.x = SCREEN_WIDTH // 2
        self.y = 50
        self.parachute_deployed = False
        self.parachute_width = 80
        self.parachute_height = 40
        self.speed_x = 0
        self.speed_y = 1
        self.gravity = 0.2
        self.max_speed = 7
        self.alive = True
        self.landed = False
        self.wind = 0
        self.parachute_deploy_height = 0  # Track height when parachute was deployed
        
    def deploy_parachute(self):
        if not self.parachute_deployed:
            self.parachute_deployed = True
            # Record the deployment height for scoring
            self.parachute_deploy_height = self.y
            # Play parachute deployment sound
            parachute_sound = load_sound("parachute_open.wav")
            if parachute_sound:
                parachute_sound.play()
            self.gravity = 0.05
            self.max_speed = 2
    
    def move(self, keys):
        # Left-right movement based on key presses
        if keys[pygame.K_LEFT]:
            self.speed_x = max(-3, self.speed_x - 0.2)
        elif keys[pygame.K_RIGHT]:
            self.speed_x = min(3, self.speed_x + 0.2)
        else:
            # Gradually slow down when no key is pressed
            if self.speed_x > 0:
                self.speed_x = max(0, self.speed_x - 0.1)
            elif self.speed_x < 0:
                self.speed_x = min(0, self.speed_x + 0.1)
        
        # Apply wind effect when parachute is deployed
        if self.parachute_deployed:
            self.speed_x += self.wind * 0.1
        
        # Update position
        self.x += self.speed_x
        
        # Keep player within screen bounds
        if self.x < 0:
            self.x = 0
            self.speed_x = 0
        elif self.x > SCREEN_WIDTH - self.width:
            self.x = SCREEN_WIDTH - self.width
            self.speed_x = 0
        
        # Apply gravity
        if not self.landed:
            self.speed_y = min(self.max_speed, self.speed_y + self.gravity)
            self.y += self.speed_y
    
    def draw(self, surface):
        if not self.alive:
            # Draw dead player (more detailed with X eyes and crashed position)
            # Body
            pygame.draw.rect(surface, RED, (self.x, self.y, self.width, self.height))
            
            # X eyes
            pygame.draw.line(surface, BLACK, (self.x + 12, self.y + 12), (self.x + 18, self.y + 18), 2)
            pygame.draw.line(surface, BLACK, (self.x + 18, self.y + 12), (self.x + 12, self.y + 18), 2)
            pygame.draw.line(surface, BLACK, (self.x + 22, self.y + 12), (self.x + 28, self.y + 18), 2)
            pygame.draw.line(surface, BLACK, (self.x + 28, self.y + 12), (self.x + 22, self.y + 18), 2)
            
            # Sad mouth
            pygame.draw.arc(surface, BLACK, (self.x + 10, self.y + 25, 20, 10), 3.14, 6.28, 2)
            return
            
        if self.parachute_deployed:
            # Draw parachute dome with more detail
            pygame.draw.ellipse(surface, RED, (
                self.x - (self.parachute_width - self.width) // 2, 
                self.y - self.parachute_height, 
                self.parachute_width, 
                self.parachute_height
            ))
            
            # Add parachute panels
            panel_width = self.parachute_width // 4
            for i in range(4):
                panel_x = self.x - (self.parachute_width - self.width) // 2 + i * panel_width
                pygame.draw.line(surface, WHITE, 
                               (panel_x, self.y - self.parachute_height + 5),
                               (panel_x, self.y - 5), 
                               1)
            
            # Draw strings
            pygame.draw.line(surface, BLACK, 
                            (self.x + 10, self.y), 
                            (self.x - 10 + (self.parachute_width - self.width) // 2, self.y - self.parachute_height + 10),
                            2)
            pygame.draw.line(surface, BLACK, 
                            (self.x + self.width - 10, self.y), 
                            (self.x + self.width + 10 - (self.parachute_width - self.width) // 2, self.y - self.parachute_height + 10),
                            2)
            # Add two more strings
            pygame.draw.line(surface, BLACK, 
                           (self.x + 15, self.y), 
                           (self.x + self.parachute_width//4, self.y - self.parachute_height + 10),
                           1)
            pygame.draw.line(surface, BLACK, 
                           (self.x + self.width - 15, self.y), 
                           (self.x + 3*self.parachute_width//4, self.y - self.parachute_height + 10),
                           1)
        
        # Draw player with more detail (blue jumpsuit figure)
        pygame.draw.rect(surface, BLUE, (self.x, self.y, self.width, self.height))
        
        # Add helmet
        pygame.draw.ellipse(surface, WHITE, (self.x + 5, self.y - 5, self.width - 10, 12))
        
        # Draw face
        pygame.draw.circle(surface, BLACK, (self.x + 15, self.y + 15), 3)  # Left eye
        pygame.draw.circle(surface, BLACK, (self.x + 25, self.y + 15), 3)  # Right eye
        
        # Draw limbs
        if self.parachute_deployed:
            # Arms up holding parachute strings
            pygame.draw.line(surface, BLUE, (self.x + 5, self.y + 20), (self.x - 5, self.y), 2)  # Left arm
            pygame.draw.line(surface, BLUE, (self.x + self.width - 5, self.y + 20), (self.x + self.width + 5, self.y), 2)  # Right arm
        else:
            # Skydiving position
            pygame.draw.line(surface, BLUE, (self.x + 5, self.y + 20), (self.x - 10, self.y + 15), 2)  # Left arm
            pygame.draw.line(surface, BLUE, (self.x + self.width - 5, self.y + 20), (self.x + self.width + 10, self.y + 15), 2)  # Right arm
        
        # Legs
        pygame.draw.line(surface, BLUE, (self.x + 15, self.y + self.height), (self.x + 10, self.y + self.height + 10), 2)  # Left leg
        pygame.draw.line(surface, BLUE, (self.x + 25, self.y + self.height), (self.x + 30, self.y + self.height + 10), 2)  # Right leg
        
        if self.alive:
            # Happy mouth
            pygame.draw.arc(surface, BLACK, (self.x + 10, self.y + 20, 20, 10), 0, 3.14, 2)
        else:
            # Sad mouth
            pygame.draw.arc(surface, BLACK, (self.x + 10, self.y + 25, 20, 10), 3.14, 6.28, 2)

    def check_collision(self, obstacles):
        player_rect = pygame.Rect(self.x, self.y, self.width, self.height)
        
        for obstacle in obstacles:
            if player_rect.colliderect(obstacle.rect):
                # Play crash sound
                crash_sound = load_sound("crash.wav")
                if crash_sound:
                    crash_sound.play()
                self.alive = False
                return True
        
        # Check if player has reached the ground
        if self.y + self.height >= SCREEN_HEIGHT - 20:  # Ground level
            self.y = SCREEN_HEIGHT - 20 - self.height
            self.landed = True
            
            # Check landing speed
            if self.speed_y > 3:
                # Too fast landing - crash
                crash_sound = load_sound("crash.wav")
                if crash_sound:
                    crash_sound.play()
                self.alive = False
            else:
                # Safe landing
                landing_sound = load_sound("landing.wav")
                if landing_sound:
                    landing_sound.play()
            
            return self.landed
        
        return False

# Obstacle class
class Obstacle:
    def __init__(self, x, width, height):
        self.x = x
        self.width = width
        self.height = height
        self.y = SCREEN_HEIGHT - 20 - height  # Position at ground level
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)
    
    def draw(self, surface):
        pygame.draw.rect(surface, GREEN, self.rect)
        
        # Draw warning markers on obstacles
        for i in range(0, self.width, 15):
            if (i // 15) % 2 == 0:  # Alternating pattern
                pygame.draw.rect(surface, YELLOW, (self.x + i, self.y, 15, 10))

# Plane class
class Plane:
    def __init__(self):
        self.width = 100
        self.height = 30
        self.x = -self.width
        self.y = 30
        self.speed = 3
        self.active = True
    
    def update(self):
        if self.active:
            self.x += self.speed
            
            # Reset plane when it goes off-screen
            if self.x > SCREEN_WIDTH:
                self.x = -self.width
                self.active = False
    
    def draw(self, surface):
        if self.active:
            # Draw plane body
            pygame.draw.rect(surface, WHITE, (self.x, self.y, self.width, self.height))
            
            # Draw wings
            pygame.draw.polygon(surface, WHITE, [
                (self.x + 30, self.y),
                (self.x + 50, self.y - 15),
                (self.x + 70, self.y)
            ])
            
            # Draw tail
            pygame.draw.polygon(surface, WHITE, [
                (self.x + self.width - 20, self.y),
                (self.x + self.width - 10, self.y - 15),
                (self.x + self.width, self.y)
            ])
            
            # Draw windows
            for i in range(3):
                pygame.draw.circle(surface, BLUE, (self.x + 30 + i*20, self.y + self.height//2), 5)

# Cloud class
class Cloud:
    def __init__(self):
        self.width = random.randint(50, 150)
        self.height = random.randint(30, 60)
        self.x = random.randint(0, SCREEN_WIDTH)
        self.y = random.randint(50, 200)
        self.speed = random.uniform(0.2, 1.0)
    
    def update(self):
        self.x += self.speed
        if self.x > SCREEN_WIDTH:
            self.x = -self.width
            self.y = random.randint(50, 200)
    
    def draw(self, surface):
        pygame.draw.ellipse(surface, WHITE, (self.x, self.y, self.width, self.height))
        pygame.draw.ellipse(surface, WHITE, (self.x + self.width*0.2, self.y - self.height*0.2, self.width*0.6, self.height*0.6))
        pygame.draw.ellipse(surface, WHITE, (self.x + self.width*0.4, self.y + self.height*0.2, self.width*0.6, self.height*0.6))

# Game class
class Game:
    def __init__(self):
        self.reset()
        
        # Load background sounds
        self.wind_sound = load_sound("wind.wav")
        self.background_music = load_sound("background.wav")
        
        # High scores list
        self.high_scores = []
        self.high_scores_file = "high_scores.json"
        self.load_high_scores()
        
        # Play background music (with error handling)
        try:
            if self.background_music:
                self.background_music.play(-1)  # Loop indefinitely
        except Exception as e:
            print(f"Could not play background music: {e}")
    
    def reset(self):
        self.player = Player()
        self.plane = Plane()
        self.obstacles = []
        self.clouds = [Cloud() for _ in range(5)]
        self.game_over = False
        self.jumping = False
        self.score = 0
        self.wind_direction = 0
        self.wind_timer = 0
        self.landing_zones = []
        
        # Create obstacles
        num_obstacles = random.randint(5, 8)
        obstacle_positions = sorted(random.sample(range(100, SCREEN_WIDTH - 100), num_obstacles))
        
        for pos in obstacle_positions:
            width = random.randint(30, 80)
            height = random.randint(40, 100)
            self.obstacles.append(Obstacle(pos, width, height))
        
        # Create landing zones between obstacles
        self.create_landing_zones()
    
    def create_landing_zones(self):
        """Create safe landing zones between obstacles"""
        self.landing_zones = []
        
        # Sort obstacles by x position
        sorted_obstacles = sorted(self.obstacles, key=lambda o: o.x)
        
        # Add a landing zone before the first obstacle
        if sorted_obstacles and sorted_obstacles[0].x > 100:
            width = min(100, sorted_obstacles[0].x - 50)
            self.landing_zones.append(pygame.Rect(
                sorted_obstacles[0].x - width - 10,
                SCREEN_HEIGHT - 30,
                width,
                10
            ))
        
        # Add landing zones between obstacles
        for i in range(len(sorted_obstacles) - 1):
            gap = sorted_obstacles[i+1].x - (sorted_obstacles[i].x + sorted_obstacles[i].width)
            if gap > 80:  # Only create a zone if there's enough space
                zone_width = min(gap - 20, 100)  # Leave some margin
                zone_x = sorted_obstacles[i].x + sorted_obstacles[i].width + (gap - zone_width) // 2
                self.landing_zones.append(pygame.Rect(
                    zone_x,
                    SCREEN_HEIGHT - 30,
                    zone_width,
                    10
                ))
        
        # Add a landing zone after the last obstacle
        if sorted_obstacles and sorted_obstacles[-1].x + sorted_obstacles[-1].width < SCREEN_WIDTH - 100:
            width = min(100, SCREEN_WIDTH - (sorted_obstacles[-1].x + sorted_obstacles[-1].width) - 50)
            self.landing_zones.append(pygame.Rect(
                sorted_obstacles[-1].x + sorted_obstacles[-1].width + 10,
                SCREEN_HEIGHT - 30,
                width,
                10
            ))
    
    def load_high_scores(self):
        """Load high scores from file"""
        try:
            if os.path.exists(self.high_scores_file):
                with open(self.high_scores_file, 'r') as f:
                    self.high_scores = json.load(f)
        except Exception as e:
            print(f"Error loading high scores: {e}")
            self.high_scores = []
    
    def save_high_scores(self):
        """Save high scores to file"""
        try:
            with open(self.high_scores_file, 'w') as f:
                json.dump(self.high_scores, f)
        except Exception as e:
            print(f"Error saving high scores: {e}")
    
    def update_high_scores(self):
        """Update high scores with current score"""
        if self.player.alive:  # Only add score if player survived
            self.high_scores.append(self.score)
            self.high_scores.sort(reverse=True)  # Sort in descending order
            self.high_scores = self.high_scores[:10]  # Keep only top 10
            self.save_high_scores()
    
    def update_wind(self):
        self.wind_timer -= 1
        if self.wind_timer <= 0:
            self.wind_timer = random.randint(180, 360)  # 3-6 seconds at 60 FPS
            self.wind_direction = random.uniform(-1, 1)
            self.player.wind = self.wind_direction
            
            # Play wind sound
            wind_sound = load_sound("wind.wav")
            if wind_sound:
                wind_sound.play()
    
    def update(self):
        keys = pygame.key.get_pressed()
        
        # Update plane
        self.plane.update()
        
        # Update clouds
        for cloud in self.clouds:
            cloud.update()
        
        # Update wind
        self.update_wind()
        
        # Check if player should jump from plane
        if not self.jumping and self.plane.x + self.plane.width // 2 > SCREEN_WIDTH // 3:
            self.jumping = True
            self.player.x = self.plane.x + self.plane.width // 2
            self.player.y = self.plane.y + self.plane.height
            
            # Play jump sound
            jump_sound = load_sound("jump.wav")
            if jump_sound:
                jump_sound.play()
        
        # If player has jumped, allow movement
        if self.jumping and not self.game_over and self.player.alive:
            # Deploy parachute with space key
            if keys[pygame.K_SPACE] and not self.player.parachute_deployed:
                self.player.deploy_parachute()
            
            # Update player position
            self.player.move(keys)
            
            # Check for collisions
            if self.player.check_collision(self.obstacles):
                self.game_over = True
            
            # Update score based on progress
            if self.player.landed and self.player.alive:
                # Base score from landing position
                landing_score = 1000 - sum(abs(self.player.x - (obstacle.x + obstacle.width // 2)) 
                                     for obstacle in self.obstacles) // len(self.obstacles)
                
                # Bonus for landing in safe zone
                for zone in self.landing_zones:
                    if zone.collidepoint(self.player.x + self.player.width // 2, SCREEN_HEIGHT - 21):
                        landing_score += 500
                        break
                
                # Speed bonus for deploying parachute later
                time_bonus = max(0, 200 - self.player.parachute_deploy_height)
                
                self.score = max(0, landing_score + time_bonus)
                self.update_high_scores()
                self.game_over = True
    
    def draw(self, surface):
        # Draw sky background
        surface.fill(SKY_BLUE)
        
        # Draw clouds
        for cloud in self.clouds:
            cloud.draw(surface)
        
        # Draw plane
        self.plane.draw(surface)
        
        # Draw ground
        pygame.draw.rect(surface, (139, 69, 19), (0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20))
        
        # Draw landing zones
        for zone in self.landing_zones:
            # Create transparent surface for landing zone
            safe_surface = create_transparent_surface(zone.width, zone.height, SAFE_ZONE_COLOR)
            surface.blit(safe_surface, (zone.left, zone.top))
            
            # Add landing zone markings
            pygame.draw.line(surface, WHITE, (zone.left, SCREEN_HEIGHT - 20), (zone.right, SCREEN_HEIGHT - 20), 3)
            
            # Add "SAFE" text
            font = pygame.font.SysFont(None, 20)
            text = font.render("SAFE", True, WHITE)
            surface.blit(text, (zone.centerx - text.get_width() // 2, SCREEN_HEIGHT - 35))
        
        # Draw obstacles
        for obstacle in self.obstacles:
            obstacle.draw(surface)
        
        # Draw player if jumped
        if self.jumping:
            self.player.draw(surface)
        
        # Display wind indicator
        wind_text = f"Wind: {'←' if self.wind_direction < 0 else '→' if self.wind_direction > 0 else '—'}"
        wind_text += "." * (1 + int(abs(self.wind_direction) * 5))
        font = pygame.font.SysFont(None, 24)
        wind_surface = font.render(wind_text, True, BLACK)
        surface.blit(wind_surface, (20, 20))
        
        # Draw game over screen
        if self.game_over:
            font = pygame.font.SysFont(None, 48)
            if self.player.alive:
                text = font.render(f"You landed safely! Score: {self.score}", True, BLACK)
            else:
                text = font.render("Game Over - You crashed!", True, RED)
            
            surface.blit(text, (SCREEN_WIDTH // 2 - text.get_width() // 2, SCREEN_HEIGHT // 2 - 80))
            
            # Draw high scores
            if self.high_scores:
                font = pygame.font.SysFont(None, 36)
                high_score_text = font.render("High Scores:", True, BLACK)
                surface.blit(high_score_text, (SCREEN_WIDTH // 2 - high_score_text.get_width() // 2, SCREEN_HEIGHT // 2 - 30))
                
                for i, score in enumerate(self.high_scores[:5]):  # Show top 5 scores
                    score_text = font.render(f"{i+1}. {score}", True, BLACK)
                    surface.blit(score_text, (SCREEN_WIDTH // 2 - score_text.get_width() // 2, SCREEN_HEIGHT // 2 + i*30))
            
            font = pygame.font.SysFont(None, 32)
            restart_text = font.render("Press R to restart", True, BLACK)
            surface.blit(restart_text, (SCREEN_WIDTH // 2 - restart_text.get_width() // 2, SCREEN_HEIGHT // 2 + 180))

# Create game
game = Game()

# Main game loop
running = True
while running:
    # Handle events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and game.game_over:
                game.reset()
    
    # Update game state
    game.update()
    
    # Draw everything
    game.draw(screen)
    
    # Update the display
    pygame.display.flip()
    
    # Control the frame rate
    clock.tick(FPS)

# Clean up
pygame.quit()
sys.exit()