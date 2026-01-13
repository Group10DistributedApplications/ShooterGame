package com.shootergame.game;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
    private final Map<String, WorldState> worlds;
    private final TickScheduler tickScheduler;
    private final JsonSerializer serializer;
    private volatile boolean running = true;
    private volatile long lastTick = 0L;

    public GameLoop(Space space, NetworkServer server) {
        this.space = space;
        this.server = server;
        this.worlds = new ConcurrentHashMap<>();
        // create default world
        this.worlds.put("default", new WorldState(space, "default"));
        this.serializer = new JsonSerializer();
        this.tickScheduler = new TickScheduler(this::tick, 50);
    }

    public void start() {
        tickScheduler.start();
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

            // Run simulation for each world (game)
            for (Map.Entry<String, WorldState> entry : worlds.entrySet()) {
                String gid = entry.getKey();
                WorldState world = entry.getValue();

                // Sync registered players for this world
                world.syncRegisteredPlayers();
                // Ensure player bounds reflect map size
                double mapW = world.getCollisionMap().getPixelWidth();
                double mapH = world.getCollisionMap().getPixelHeight();
                for (PlayerState ps : world.getPlayers().values()) {
                    ps.setBounds(mapW, mapH, 30.0);
                    ps.setCollisionMap(world.getCollisionMap());
                }

            // Update all alive players
            for (PlayerState ps : world.getPlayers().values()) {
                if (ps.isAlive()) {
                    ps.update(dt);
                }
            }

                // Handle firing requests (only for alive players)
                for (PlayerState ps : world.getPlayers().values()) {
                    if (ps.isAlive() && ps.fireRequested) {
                        handleFireForWorld(world, ps);
                        ps.fireRequested = false;
                    }
                }

                // Update projectiles
                for (ProjectileState p : world.getProjectiles().values()) {
                    p.update(dt);
                }

            // Check collisions between projectiles and players
            checkCollisions(world);

                // Remove dead/out-of-bounds projectiles
                world.getProjectiles().keySet()
                    .removeIf(id -> {
                        ProjectileState p = world.getProjectiles().get(id);
                        return p != null && (!p.isAlive() || p.isOutOfBounds());
                    });

                // Check win condition: last player alive wins
                try {
                    int aliveCount = (int) world.getPlayers().values().stream().filter(PlayerState::isAlive).count();
                    if (world.isMatchRunning() && aliveCount <= 1) {
                        Integer winner = null;
                        if (aliveCount == 1) {
                            for (PlayerState p : world.getPlayers().values()) {
                                if (p.isAlive()) { winner = p.id; break; }
                            }
                        }
                        Map<String, Object> over = Map.of("type", "game_over", "winner", winner);
                        String overJson = serializer.toJson(over);
                        server.broadcastToGame(gid, overJson);
                        world.setMatchRunning(false);
                    }
                } catch (Exception e) {
                    logger.error("Error while evaluating win condition for game=" + gid, e);
                }

                // Broadcast state to clients in this game only
                broadcastStateForGame(gid, world);
            }

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

        // This method is no longer used; kept for compatibility.
        // Find the world that contains this player and spawn projectile there (best-effort)
        for (WorldState ws : worlds.values()) {
            if (ws.getPlayers().containsKey(ps.id)) {
                ProjectileState proj = ws.spawnProjectile(ps, vx, vy);
                proj.setBounds(ws.getCollisionMap().getPixelWidth(), ws.getCollisionMap().getPixelHeight(), 10.0);
                return;
            }
        }
    }
    private void handleFireForWorld(WorldState world, PlayerState ps) {
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

        world.spawnProjectile(ps, vx, vy);
    }

    private void broadcastStateForGame(String gameId, WorldState world) {
        try {
            // Only send alive players to clients
            var alivePlayers = world.getPlayers().values().stream()
                .filter(PlayerState::isAlive)
                .toList();
            
            Map<String, Object> state = Map.of(
                "type", "state",
                "players", alivePlayers,
                "projectiles", world.getProjectiles().values()
            );
            String json = serializer.toJson(state);
            logger.debug("Broadcasting state for game={}", gameId);
            server.broadcastToGame(gameId, json);
        } catch (Exception e) {
            logger.error("Error broadcasting state for game=" + gameId, e);
        }
    }


    /**
     * Check collisions between projectiles and players.
     * If a projectile hits a player (not the owner), the player loses a life.
     */
    private void checkCollisions(WorldState world) {
        for (ProjectileState proj : world.getProjectiles().values()) {
            if (!proj.isAlive()) {
                continue; // already expired (e.g., hit a wall)
            }
            for (PlayerState player : world.getPlayers().values()) {
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
        return worlds.get("default");
    }

    public void applyInput(String gameId, com.shootergame.game.input.PlayerInput input) {
        WorldState ws = worlds.computeIfAbsent(gameId, gid -> new WorldState(space, gid));
        // If this is a START input, broadcast a game_start message so clients can reset UI
        try {
            if ("START".equals(input.action())) {
                Map<String, Object> startMsg = Map.of("type", "game_start");
                String startJson = serializer.toJson(startMsg);
                server.broadcastToGame(gameId, startJson);
            }
        } catch (Exception ex) {
            logger.debug("Failed to broadcast game_start", ex);
        }

        ws.applyInput(input);
    }
}
