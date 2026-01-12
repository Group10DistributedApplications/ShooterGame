package com.shootergame.game.entity;

public class ProjectileState {
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
        return x < 30 || x > 610 || y < 76 || y > 450;
    }
}
