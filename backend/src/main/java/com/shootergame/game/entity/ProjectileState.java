package com.shootergame.game.entity;

import com.shootergame.game.map.CollisionMap;

public class ProjectileState {
    // Map bounds are provided by the collision map
    private double mapWidth = 1120.0;
    private double mapHeight = 960.0;
    private double margin = 10.0; // allow projectiles a small grace beyond walls
    private CollisionMap collisionMap;

    public void setBounds(double width, double height, double margin) {
        this.mapWidth = width;
        this.mapHeight = height;
        this.margin = margin;
    }

    public void setCollisionMap(CollisionMap collisionMap) {
        this.collisionMap = collisionMap;
    }
    public final int id;
    public final int owner;
    public double x;
    public double y;
    public double vx;
    public double vy;
    public double life = 5.0; // seconds

    public ProjectileState(int id, double x, double y, double vx, double vy, int owner) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
    }

    public void update(double dt) {
        double nx = x + vx * dt;
        double ny = y + vy * dt;

        // Stop the projectile the moment it touches a blocked tile
        if (collisionMap != null && hitsBlockedTile(x, y, nx, ny)) {
            life = 0;
            return;
        }

        x = nx;
        y = ny;
        life -= dt;
    }

    public boolean isAlive() {
        return life > 0;
    }

    public boolean isOutOfBounds() {
        return x < margin || x > mapWidth - margin || y < margin || y > mapHeight - margin;
    }

    private boolean hitsBlockedTile(double sx, double sy, double ex, double ey) {
        // Sample along the segment to avoid tunneling through thin walls
        double dx = ex - sx;
        double dy = ey - sy;
        double dist = Math.hypot(dx, dy);
        int steps = Math.max(1, (int)Math.ceil(dist / 4.0)); // sample roughly every 4px
        for (int i = 1; i <= steps; i++) {
            double t = (double) i / steps;
            double cx = sx + dx * t;
            double cy = sy + dy * t;
            if (collisionMap.isBlocked(cx, cy)) {
                return true;
            }
        }
        return false;
    }
}
