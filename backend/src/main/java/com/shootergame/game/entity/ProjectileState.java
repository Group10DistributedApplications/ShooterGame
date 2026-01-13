package com.shootergame.game.entity;

public class ProjectileState {
    // Map bounds are provided by the collision map
    private double mapWidth = 1120.0;
    private double mapHeight = 960.0;
    private double margin = 10.0; // allow projectiles a small grace beyond walls

    public void setBounds(double width, double height, double margin) {
        this.mapWidth = width;
        this.mapHeight = height;
        this.margin = margin;
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
        x += vx * dt;
        y += vy * dt;
        life -= dt;
    }

    public boolean isAlive() {
        return life > 0;
    }

    public boolean isOutOfBounds() {
        return x < margin || x > mapWidth - margin || y < margin || y > mapHeight - margin;
    }
}
