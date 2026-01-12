package com.shootergame.game;

import java.util.Map;

import org.jspace.Space;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.shootergame.game.entity.PlayerState;
import com.shootergame.game.entity.ProjectileState;
import com.shootergame.network.NetworkServer;
import com.shootergame.util.JsonSerializer;

/**
 * Coordinates the game simulation.
 * Drives game updates and broadcasts state.
 */
public class GameLoop {

    private static final Logger logger = LoggerFactory.getLogger(GameLoop.class);

    private final Space space;
    private final NetworkServer server;
    private final WorldState worldState;
    private final TickScheduler tickScheduler;
    private final JsonSerializer serializer;
    private volatile boolean running = true;
    private volatile long lastTick = 0L;

    public GameLoop(Space space, NetworkServer server) {
        this.space = space;
        this.server = server;
        this.worldState = new WorldState(space);
        this.serializer = new JsonSerializer();
        this.tickScheduler = new TickScheduler(this::tick, 50);
    }

    public void start() {
        tickScheduler.start();
        logger.info("GameLoop started");
    }

    public void stop() {
        running = false;
        tickScheduler.stop();
        logger.info("GameLoop stopped");
    }

    /**
     * Main tick function called at fixed intervals.
     */
    private void tick() {
        try {
            long now = System.nanoTime();
            double dt = (lastTick == 0L) ? 0.05 : (now - lastTick) / 1_000_000_000.0;
            lastTick = now;

            // Sync registered players
            worldState.syncRegisteredPlayers();

            // Update all alive players
            for (PlayerState ps : worldState.getPlayers().values()) {
                if (ps.isAlive()) {
                    ps.update(dt);
                }
            }

            // Handle firing requests (only for alive players)
            for (PlayerState ps : worldState.getPlayers().values()) {
                if (ps.isAlive() && ps.fireRequested) {
                    handleFire(ps);
                    ps.fireRequested = false;
                }
            }

            // Update all projectiles
            for (ProjectileState p : worldState.getProjectiles().values()) {
                p.update(dt);
            }

            // Check collisions between projectiles and players
            checkCollisions();

            // Remove dead/out-of-bounds projectiles
            worldState.getProjectiles().keySet()
                .removeIf(id -> {
                    ProjectileState p = worldState.getProjectiles().get(id);
                    return p != null && (!p.isAlive() || p.isOutOfBounds());
                });

            // Broadcast state to all clients
            broadcastState();

        } catch (Exception e) {
            logger.error("Error in tick", e);
        }
    }

    private void handleFire(PlayerState ps) {
        String facing = ps.fireFacing != null ? ps.fireFacing : "";
        double vx = 0.0, vy = 0.0;
        double speed = 400.0; // projectile speed

        switch (facing.toUpperCase()) {
            case "UP":
                vy = -speed;
                break;
            case "DOWN":
                vy = speed;
                break;
            case "LEFT":
                vx = -speed;
                break;
            case "RIGHT":
                vx = speed;
                break;
            default:
                // Derive from player movement direction
                if (ps.isUp())
                    vy = -speed;
                else if (ps.isDown())
                    vy = speed;
                else if (ps.isLeft())
                    vx = -speed;
                else if (ps.isRight())
                    vx = speed;
                break;
        }

        worldState.spawnProjectile(ps, vx, vy);
    }

    private void broadcastState() {
        try {
            // Only send alive players to clients
            var alivePlayers = worldState.getPlayers().values().stream()
                .filter(PlayerState::isAlive)
                .toList();
            
            Map<String, Object> state = Map.of(
                "type", "state",
                "players", alivePlayers,
                "projectiles", worldState.getProjectiles().values()
            );
            String json = serializer.toJson(state);
            logger.debug("Broadcasting state");
            server.broadcast(json);
        } catch (Exception e) {
            logger.error("Error broadcasting state", e);
        }
    }

    /**
     * Check collisions between projectiles and players.
     * If a projectile hits a player (not the owner), the player loses a life.
     */
    private void checkCollisions() {
        for (ProjectileState proj : worldState.getProjectiles().values()) {
            for (PlayerState player : worldState.getPlayers().values()) {
                // Don't collide with owner or if player is invulnerable
                if (proj.owner == player.id || player.isInvulnerable()) {
                    continue;
                }

                // Simple circle-based collision detection (30 is player size, ~8 is projectile size)
                double dx = proj.x - player.x;
                double dy = proj.y - player.y;
                double distance = Math.sqrt(dx * dx + dy * dy);
                double collisionDistance = 15 + 8; // player radius + projectile radius

                if (distance < collisionDistance) {
                    player.hit();
                    // Mark projectile as dead
                    proj.life = 0;
                    logger.info("Player {} hit by projectile {}! Lives remaining: {}", 
                        player.id, proj.id, player.lives);
                    break; // projectile can only hit one player
                }
            }
        }
    }

    public WorldState getWorldState() {
        return worldState;
    }
}
