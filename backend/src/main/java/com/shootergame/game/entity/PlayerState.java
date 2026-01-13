package com.shootergame.game.entity;

/**
 * Represents the mutable state of a player in the game.
 * Holds position, movement flags, and firing intent.
 */
public class PlayerState {
    public final int id;
    public double x = 400.0;
    public double y = 300.0;

    private boolean up = false;
    private boolean down = false;
    private boolean left = false;
    private boolean right = false;

    public long lastTs = 0L;
    public boolean fireRequested = false;
    public String fireFacing = "";
    
    // Shooting cooldown
    public double shootCooldown = 0.0;
    private static final double SHOOT_COOLDOWN_DURATION = 1; // 1 seconds between shots
    
    // Powerup state
    public boolean hasSpeedBoost = false;
    public double speedBoostTimer = 0.0;
    private static final double SPEED_BOOST_DURATION = 15.0; // 15 seconds
    
    public boolean hasNoCooldown = false;
    public double noCooldownTimer = 0.0;
    private static final double NO_COOLDOWN_DURATION = 10.0; // 10 seconds

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
        
        double speed = 200.0;
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

        // Clamp to world bounds (keep margin inside walls, avoid table area at top)
        nx = Math.max(30.0, Math.min(610.0, nx));
        ny = Math.max(76.0, Math.min(450.0, ny));

        x = nx;
        y = ny;
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
