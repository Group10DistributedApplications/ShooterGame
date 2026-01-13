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

    public WorldState(Space space, String gameId) {
        this.space = space;
        this.gameId = gameId != null ? gameId : "default";
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
                p.invulnerableTime = 2.0;
                p.x = 100.0 + (i % 4) * 120.0;
                p.y = 100.0 + (i / 4) * 80.0;
                p.fireRequested = false;
                p.fireFacing = "";
                p.lastTs = System.currentTimeMillis();
                i++;
            }
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

    public ProjectileState spawnProjectile(PlayerState owner, double vx, double vy) {
        int projId = nextProjectileId++;
        ProjectileState proj = new ProjectileState(projId, owner.x, owner.y, vx, vy, owner.id);
        projectiles.put(projId, proj);
        logger.debug("Spawned projectile id={} owner={} vx={} vy={}", projId, owner.id, vx, vy);
        return proj;
    }

    public void removeProjectile(int projId) {
        projectiles.remove(projId);
    }
}
