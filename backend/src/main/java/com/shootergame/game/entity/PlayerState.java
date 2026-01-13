package com.shootergame.game.entity;

/**
 * Represents the mutable state of a player in the game.
 * Holds position, movement flags, and firing intent.
 */
public class PlayerState {
    public final int id;
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
