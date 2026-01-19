package com.shootergame.game.entity;

/**
 * Represents the mutable state of a player in the game.
 * Holds position, movement flags, and firing intent.
 */
public class PlayerState {
    public final int id;
    public String color = "green"; // Player color: green, red, blue, or yellow
    // Bounds derive from the collision map at runtime; defaults are overwritten by WorldState
    private double mapWidth = 1120.0;
    private double mapHeight = 960.0;
    private double margin = 30.0;
    private com.shootergame.game.map.CollisionMap collisionMap;

    public double x = mapWidth / 2.0;
    public double y = mapHeight / 2.0;

    public void setBounds(double width, double height, double margin) {
        this.mapWidth = width;
        this.mapHeight = height;
        double maxMargin = Math.max(1.0, Math.min(width, height) / 4.0);
        this.margin = Math.min(margin, maxMargin);
    }

    public void setCollisionMap(com.shootergame.game.map.CollisionMap collisionMap) {
        this.collisionMap = collisionMap;
    }
    public int lives = 3;
    public double invulnerableTime = 0.0; // Start of game

    private boolean up = false;
    private boolean down = false;
    private boolean left = false;
    private boolean right = false;

    public long lastTs = 0L;
    public boolean fireRequested = false;
    public String fireFacing = "";
    
    // Shooting cooldown
    public double shootCooldown = 0.0;
    private static final double SHOOT_COOLDOWN_DURATION = 0.5; // 1 seconds between shots
    
    // Powerup state
    public boolean hasSpeedBoost = false;
    public double speedBoostTimer = 0.0;
    private static final double SPEED_BOOST_DURATION = 15.0; // 15 seconds
    
    public boolean hasNoCooldown = false;
    public double noCooldownTimer = 0.0;
    private static final double NO_COOLDOWN_DURATION = 10.0; // 10 seconds
    
    public boolean hasSpreadShot = false;
    public double spreadShotTimer = 0.0;
    private static final double SPREAD_SHOT_DURATION = 12.0; // 12 seconds

    public PlayerState(int id) {
        this.id = id;
    }
    
    public void applySpeedBoost() {
        hasSpeedBoost = true;
        speedBoostTimer = SPEED_BOOST_DURATION;
    }
    
    public void applyNoCooldownBoost() {
        hasNoCooldown = true;
        noCooldownTimer = NO_COOLDOWN_DURATION;
    }
    
    public void applySpreadShotBoost() {
        hasSpreadShot = true;
        spreadShotTimer = SPREAD_SHOT_DURATION;
    }
    
    public boolean canShoot() {
        return shootCooldown <= 0;
    }
    
    public void applyShooting() {
        shootCooldown = hasNoCooldown ? 0.1 : SHOOT_COOLDOWN_DURATION; // 0.1s if no cooldown
    }

    public void applyInput(String action) {
        switch (action) {
            case "UP":
                up = true;
                break;
            case "DOWN":
                down = true;
                break;
            case "LEFT":
                left = true;
                break;
            case "RIGHT":
                right = true;
                break;
            case "STOP_UP":
                up = false;
                break;
            case "STOP_DOWN":
                down = false;
                break;
            case "STOP_LEFT":
                left = false;
                break;
            case "STOP_RIGHT":
                right = false;
                break;
            default:
                break;
        }
    }

    public void update(double dt) {
        // Update shoot cooldown
        if (shootCooldown > 0) {
            shootCooldown -= dt;
        }
        
        // Update powerup timers
        if (hasSpeedBoost) {
            speedBoostTimer -= dt;
            if (speedBoostTimer <= 0) {
                hasSpeedBoost = false;
                speedBoostTimer = 0.0;
            }
        }
        
        if (hasNoCooldown) {
            noCooldownTimer -= dt;
            if (noCooldownTimer <= 0) {
                hasNoCooldown = false;
                noCooldownTimer = 0.0;
            }
        }
        
        if (hasSpreadShot) {
            spreadShotTimer -= dt;
            if (spreadShotTimer <= 0) {
                hasSpreadShot = false;
                spreadShotTimer = 0.0;
            }
        }
        
        double speed = 200.0;
        
        // Apply speed boost if active
        if (hasSpeedBoost) {
            speed *= 1.5; // 50% faster movement
        }
        
        int dx = 0, dy = 0;

        if (up)
            dy -= 1;
        if (down)
            dy += 1;
        if (left)
            dx -= 1;
        if (right)
            dx += 1;

        double nx = x + dx * speed * dt;
        double ny = y + dy * speed * dt;

        // Clamp to world bounds using map dimensions
        nx = Math.max(margin, Math.min(mapWidth - margin, nx));
        ny = Math.max(margin, Math.min(mapHeight - margin, ny));

        // Apply collision grid if provided
        if (collisionMap != null) {
            if (collisionMap.isBlocked(nx, y)) {
                nx = x; // block X movement
            }
            if (collisionMap.isBlocked(x, ny)) {
                ny = y; // block Y movement
            }
        }

        x = nx;
        y = ny;

        // Decrease invulnerability time
        if (invulnerableTime > 0) {
            invulnerableTime -= dt;
        }
    }

    public void hit() {
        if (invulnerableTime <= 0 && lives > 0) {
            lives--;
            invulnerableTime = 0.5; // 0.5 seconds of invulnerability after being hit
        }
    }

    public boolean isInvulnerable() {
        return invulnerableTime > 0;
    }

    public boolean isAlive() {
        return lives > 0;
    }

    public boolean isUp() {
        return up;
    }

    public boolean isDown() {
        return down;
    }

    public boolean isLeft() {
        return left;
    }

    public boolean isRight() {
        return right;
    }
}
