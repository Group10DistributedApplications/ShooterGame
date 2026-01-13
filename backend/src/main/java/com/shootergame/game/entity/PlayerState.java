package com.shootergame.game.entity;

/**
 * Represents the mutable state of a player in the game.
 * Holds position, movement flags, and firing intent.
 */
public class PlayerState {
    public final int id;
    public double x = 400.0;
    public double y = 300.0;
    public int lives = 3;
    public double invulnerableTime = 0.0; // seconds of invulnerability after being hit

    private boolean up = false;
    private boolean down = false;
    private boolean left = false;
    private boolean right = false;

    public long lastTs = 0L;
    public boolean fireRequested = false;
    public String fireFacing = "";

    public PlayerState(int id) {
        this.id = id;
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

        // Decrease invulnerability time
        if (invulnerableTime > 0) {
            invulnerableTime -= dt;
        }
    }

    public void hit() {
        if (invulnerableTime <= 0 && lives > 0) {
            lives--;
            invulnerableTime = 2.0; // 2 seconds of invulnerability after being hit
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
