package com.shootergame.game.entity;

/**
 * Represents a powerup in the game world.
 * Provides speed boost for projectiles when collected.
 */
public class PowerupState {
    public final int id;
    public double x;
    public double y;
    public final String type;
    public final String icon; // Path or identifier for the powerup icon/visual
    public boolean active = true;
    public double respawnTimer = 0.0; // Time until respawn after collection
    public double repositionTimer = 0.0; // Time until position change
    
    private static final double RESPAWN_TIME = 10.0; // 10 seconds
    private static final double REPOSITION_TIME = 15.0; // 15 seconds

    public PowerupState(int id, double x, double y, String type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type; // "speed" or "noCooldown"
        this.icon = getDefaultIcon(type);
    }

    public PowerupState(int id, double x, double y, String type, String icon) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type; // "speed" or "noCooldown"
        this.icon = icon;
    }

    private static String getDefaultIcon(String type) {
        return switch (type) {
            case "speed" -> "assets/powerups/speed.png";
            case "noCooldown" -> "assets/powerups/nocooldown.png";
            case "spreadShot" -> "assets/powerups/spreadshot.png";
            default -> "assets/powerups/powerup.png";
        };
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
        
        // Track repositioning timer
        repositionTimer -= dt;
    }
    
    public boolean isReadyToReposition() {
        return repositionTimer <= 0 && active;
    }
    
    public void repositionTo(double newX, double newY) {
        this.x = newX;
        this.y = newY;
        this.repositionTimer = REPOSITION_TIME;
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
