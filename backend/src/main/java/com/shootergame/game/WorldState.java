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
import com.shootergame.game.entity.PowerupState;
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
    private final Map<Integer, PowerupState> powerups = new ConcurrentHashMap<>();
    private volatile int nextProjectileId = 1;
    private volatile int nextPowerupId = 1;

    public WorldState(Space space, String gameId) {
        this.space = space;
        this.gameId = gameId != null ? gameId : "default";
        initializePowerups();
    }
    
    private void initializePowerups() {
        // Spawn powerups at strategic locations
        powerups.put(nextPowerupId++, new PowerupState(1, 150.0, 200.0, "speed"));
        powerups.put(nextPowerupId++, new PowerupState(2, 490.0, 200.0, "noCooldown"));
        powerups.put(nextPowerupId++, new PowerupState(3, 320.0, 350.0, "spreadShot"));
        logger.info("Initialized {} powerups", powerups.size());
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
    
    public Map<Integer, PowerupState> getPowerups() {
        return powerups;
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
    
    /**
     * Check for powerup collisions and apply effects.
     */
    public void checkPowerupCollisions() {
        for (PlayerState player : players.values()) {
            for (PowerupState powerup : powerups.values()) {
                if (powerup.checkCollision(player.x, player.y)) {
                    powerup.collect();
                    applyPowerupEffect(player, powerup);
                    logger.info("Player {} collected powerup {} (type={})", player.id, powerup.id, powerup.type);
                }
            }
        }
    }
    
    private void applyPowerupEffect(PlayerState player, PowerupState powerup) {
        if ("speed".equals(powerup.type)) {
            player.applySpeedBoost();
        } else if ("noCooldown".equals(powerup.type)) {
            player.applyNoCooldownBoost();
        } else if ("spreadShot".equals(powerup.type)) {
            player.applySpreadShotBoost();
        }
    }
    
    /**
     * Update all powerup timers.
     */
    public void updatePowerups(double dt) {
        for (PowerupState powerup : powerups.values()) {
            powerup.update(dt);
        }
    }
    
    /**
     * Check if a player can shoot (cooldown check).
     */
    public boolean canPlayerShoot(int playerId) {
        PlayerState ps = players.get(playerId);
        return ps != null && ps.canShoot();
    }
    
    /**
     * Apply shooting cooldown to a player after they fire.
     */
    public void applyShooting(int playerId) {
        PlayerState ps = players.get(playerId);
        if (ps != null) {
            ps.applyShooting();
        }
    }
}
