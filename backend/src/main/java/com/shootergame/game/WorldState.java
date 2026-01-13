package com.shootergame.game;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.Space;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.shootergame.game.entity.PlayerState;
import com.shootergame.game.entity.ProjectileState;
import com.shootergame.game.input.PlayerInput;
import com.shootergame.game.map.CollisionMap;
import com.shootergame.util.TupleSpaces;

/**
 * Holds the mutable state of the game world.
 * Manages players and projectiles.
 */
public class WorldState {

    private static final Logger logger = LoggerFactory.getLogger(WorldState.class);

    private final Space space;
    private final String gameId;
    private final Map<Integer, PlayerState> players = new ConcurrentHashMap<>();
    private final Map<Integer, ProjectileState> projectiles = new ConcurrentHashMap<>();
    private volatile int nextProjectileId = 1;
    private final CollisionMap collisionMap;
    // whether a match is currently running for this world
    private volatile boolean matchRunning = false;

    public WorldState(Space space, String gameId) {
        this.space = space;
        this.gameId = gameId != null ? gameId : "default";
        this.collisionMap = loadCollisionMap();
    }

    private CollisionMap loadCollisionMap() {
        try {
            // Resolve repo root (backend runs with cwd=.../backend); climb one level if needed
            java.nio.file.Path cwd = java.nio.file.Paths.get("").toAbsolutePath();
            java.nio.file.Path repoRoot = cwd.getFileName().toString().equalsIgnoreCase("backend") ? cwd.getParent() : cwd;
            // Uses the Map2 Tiled JSON from the frontend assets
            java.nio.file.Path mapPath = repoRoot
                .resolve("frontend").resolve("public").resolve("assets").resolve("maps").resolve("Map2.tmj");
            return CollisionMap.fromTiled(mapPath, java.util.List.of("Walls", "Walls2", "Objects"));
        } catch (Exception e) {
            logger.warn("Failed to load collision map, defaulting to empty: {}", e.getMessage());
            // Fallback: empty, default map size (70x60 @16px) so movement is not stuck
            int w = 70, h = 60, t = 16;
            boolean[][] empty = new boolean[h][w];
            return new CollisionMap(w, h, t, t, empty);
        }
    }

    /**
     * Apply a player input action to the world state.
     */
    public void applyInput(PlayerInput input) {
        int playerId = input.playerId();
        String action = input.action();
        String payload = input.payload();

        // Support a global START action to (re)start the match for this world.
        if ("START".equals(action)) {
            // Ensure registered players are present
            syncRegisteredPlayers();
            // clear projectiles
            projectiles.clear();
            // reset players: lives, invulnerability and spawn positions
            int i = 0;
            for (PlayerState p : players.values()) {
                p.lives = 3;
                p.fireRequested = false;
                p.fireFacing = "";
                p.lastTs = System.currentTimeMillis();

                // Spawn order: 0 -> top-left, 1 -> bottom-right, 2 -> top-right, 3 -> bottom-left
                switch (i % 4) {
                    case 0: // top-left
                        p.x = 60.0;
                        p.y = 90.0;
                        break;
                    case 1: // bottom-right
                        p.x = 580.0;
                        p.y = 430.0;
                        break;
                    case 2: // top-right
                        p.x = 580.0;
                        p.y = 90.0;
                        break;
                    case 3: // bottom-left
                        p.x = 60.0;
                        p.y = 430.0;
                        break;
                    default:
                        p.x = 400.0;
                        p.y = 300.0;
                }

                i++;
            }
            // mark match as running so GameLoop can apply win conditions
            this.matchRunning = true;
            return;
        }

        PlayerState ps = players.computeIfAbsent(playerId, PlayerState::new);

        // Ignore inputs from dead players (except START which is handled above)
        if (!ps.isAlive()) {
            return;
        }

        if ("FIRE".equals(action)) {
            ps.fireRequested = true;
            ps.fireFacing = payload != null ? payload : "";
        } else {
            ps.applyInput(action);
        }

        ps.lastTs = System.currentTimeMillis();
    }

    public boolean isMatchRunning() {
        return matchRunning;
    }

    public void setMatchRunning(boolean running) {
        this.matchRunning = running;
    }

    /**
     * Ensure all registered players are in the world state.
     */
    public void syncRegisteredPlayers() {
        try {
            List<Object[]> regs = TupleSpaces.queryAllPlayers(space, gameId);
            java.util.Set<Integer> registered = new java.util.HashSet<>();
            if (regs != null) {
                for (Object[] r : regs) {
                    if (r.length >= 2 && r[1] instanceof Number) {
                        int pid = ((Number) r[1]).intValue();
                        registered.add(pid);
                        players.computeIfAbsent(pid, PlayerState::new);
                    }
                }
            }

            // Remove players that are no longer registered
            players.keySet().removeIf(id -> !registered.contains(id));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            logger.debug("Failed to query registered players", e);
        }
    }

    public Map<Integer, PlayerState> getPlayers() {
        return players;
    }

    public Map<Integer, ProjectileState> getProjectiles() {
        return projectiles;
    }

    public CollisionMap getCollisionMap() {
        return collisionMap;
    }

    public ProjectileState spawnProjectile(PlayerState owner, double vx, double vy) {
        int projId = nextProjectileId++;
        ProjectileState proj = new ProjectileState(projId, owner.x, owner.y, vx, vy, owner.id);
        proj.setBounds(collisionMap.getPixelWidth(), collisionMap.getPixelHeight(), 10.0);
        proj.setCollisionMap(collisionMap);
        projectiles.put(projId, proj);
        logger.debug("Spawned projectile id={} owner={} vx={} vy={}", projId, owner.id, vx, vy);
        return proj;
    }

    public void removeProjectile(int projId) {
        projectiles.remove(projId);
    }
}

