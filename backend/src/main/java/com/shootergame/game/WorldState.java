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
    private final Map<Integer, PlayerState> players = new ConcurrentHashMap<>();
    private final Map<Integer, ProjectileState> projectiles = new ConcurrentHashMap<>();
    private volatile int nextProjectileId = 1;

    public WorldState(Space space) {
        this.space = space;
    }

    /**
     * Apply a player input action to the world state.
     */
    public void applyInput(PlayerInput input) {
        int playerId = input.playerId();
        String action = input.action();
        String payload = input.payload();

        PlayerState ps = players.computeIfAbsent(playerId, PlayerState::new);

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
            List<Object[]> regs = space.queryAll(
                new ActualField(TupleSpaces.PLAYER),
                new FormalField(Integer.class)
            );
            if (regs != null) {
                for (Object[] r : regs) {
                    if (r.length >= 2 && r[1] instanceof Number) {
                        int pid = ((Number) r[1]).intValue();
                        players.computeIfAbsent(pid, PlayerState::new);
                    }
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            logger.debug("Failed to query registered players", e);
        }
    }

    /**
     * Get all players.
     */
    public Map<Integer, PlayerState> getPlayers() {
        return players;
    }

    /**
     * Get all projectiles.
     */
    public Map<Integer, ProjectileState> getProjectiles() {
        return projectiles;
    }

    /**
     * Spawn a projectile from a player.
     */
    public ProjectileState spawnProjectile(PlayerState owner, double vx, double vy) {
        int projId = nextProjectileId++;
        ProjectileState proj = new ProjectileState(projId, owner.x, owner.y, vx, vy, owner.id);
        projectiles.put(projId, proj);
        logger.debug("Spawned projectile id={} owner={} vx={} vy={}", projId, owner.id, vx, vy);
        return proj;
    }

    /**
     * Remove a projectile by ID.
     */
    public void removeProjectile(int projId) {
        projectiles.remove(projId);
    }
}
