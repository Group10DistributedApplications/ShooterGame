package com.shootergame;

import java.util.Map;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.Space;

import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GameLoop {

    private static final Logger logger = LoggerFactory.getLogger(GameLoop.class);

    private final Space space;
    private final NetworkServer server;
    private final Gson gson = new Gson();
    private final Map<Integer, PlayerState> players = new ConcurrentHashMap<>();
    private final ScheduledExecutorService tickExecutor = Executors.newSingleThreadScheduledExecutor();
    private volatile boolean running = true;

    public GameLoop(Space space, NetworkServer server) {
        this.space = space;
        this.server = server;
    }

    public void start() {
        Thread consumer = new Thread(() -> {
            while (running) {
                try {
                    // consume input tuples and apply intent (no immediate position changes)
                    Object[] ev = space.get(
                        new ActualField("input"),
                        new FormalField(Integer.class),
                        new FormalField(String.class)
                    );

                    int pid = ((Number) ev[1]).intValue();
                    String action = (String) ev[2];

                    PlayerState ps = players.computeIfAbsent(pid, PlayerState::new);
                    ps.applyInput(action);
                    ps.lastTs = System.currentTimeMillis();
                    logger.debug("Consumed input id={} action={}", pid, action);

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    logger.error("Error in input consumer", e);
                }
            }
        }, "GameLoop-Consumer");
        consumer.setDaemon(true);
        consumer.start();

        // schedule a fixed-rate simulation tick (50ms)
        lastTick = System.nanoTime();
        tickExecutor.scheduleAtFixedRate(this::tick, 0, 50, TimeUnit.MILLISECONDS);
    }

    public void stop() {
        running = false;
        tickExecutor.shutdownNow();
    }

    private void broadcastState() {
        try {
            // ensure registered players (from tuple space) are present in players map
            try {
                List<Object[]> regs = space.queryAll(new ActualField("player"), new FormalField(Integer.class));
                if (regs != null) {
                    for (Object[] r : regs) {
                        if (r.length >= 2 && r[1] instanceof Number) {
                            int pid = ((Number) r[1]).intValue();
                            players.computeIfAbsent(pid, PlayerState::new);
                        } else {
                            logger.debug("Unexpected player tuple format: {}", (Object) r);
                        }
                    }
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                logger.debug("Failed to query registered players", e);
            }

            String out = gson.toJson(Map.of("type", "state", "players", players.values()));
            logger.debug("Broadcasting state");
            server.broadcast(out);
        } catch (Exception e) {
            logger.error("Error broadcasting state", e);
        }
    }

    private volatile long lastTick = 0L;

    private void tick() {
        try {
            long now = System.nanoTime();
            double dt = (lastTick == 0L) ? 0.05 : (now - lastTick) / 1_000_000_000.0;
            lastTick = now;

            for (PlayerState ps : players.values()) {
                ps.update(dt);
            }

            broadcastState();
        } catch (Exception e) {
            logger.error("Error in tick", e);
        }
    }

    public static class PlayerState {
        public final int id;
        public double x = 400.0, y = 300.0;

        private boolean up = false, down = false, left = false, right = false;
        public long lastTs = 0L;

        public PlayerState(int id) {
            this.id = id;
        }

        public void applyInput(String action) {
            switch (action) {
                case "UP": up = true; break;
                case "DOWN": down = true; break;
                case "LEFT": left = true; break;
                case "RIGHT": right = true; break;

                case "STOP_UP": up = false; break;
                case "STOP_DOWN": down = false; break;
                case "STOP_LEFT": left = false; break;
                case "STOP_RIGHT": right = false; break;

                default: break;
            }
        }

        public void update(double dt) {
            double speed = 200.0;
            int dx = 0, dy = 0;

            if (up) dy -= 1;
            if (down) dy += 1;
            if (left) dx -= 1;
            if (right) dx += 1;

            x += dx * speed * dt;
            y += dy * speed * dt;
        }
    }

}
