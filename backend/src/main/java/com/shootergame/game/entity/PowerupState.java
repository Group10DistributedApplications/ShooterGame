package com.shootergame.game.entity;

/**
 * Represents a powerup in the game world.
 * Provides speed boost for projectiles when collected.
 */
public class PowerupState {
    public final int id;
    public final double x;
    public final double y;
    public final String type;
    public boolean active = true;
    public double respawnTimer = 0.0; // Time until respawn after collection
    
    private static final double RESPAWN_TIME = 10.0; // 10 seconds

    public PowerupState(int id, double x, double y, String type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type; // "speed" or "noCooldown"
    }

    public void collect() {
        active = false;
        respawnTimer = RESPAWN_TIME;
    }

    public void update(double dt) {
        if (!active) {
            respawnTimer -= dt;
            if (respawnTimer <= 0) {
                active = true;
                respawnTimer = 0.0;
            }
        }
    }

    public boolean isActive() {
        return active;
    }

    public boolean checkCollision(double px, double py) {
        if (!active) return false;
        double dx = x - px;
        double dy = y - py;
        double distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 20.0; // Collision radius
    }
}
