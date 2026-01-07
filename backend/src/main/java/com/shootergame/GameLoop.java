package com.shootergame;

import java.util.Map;
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
        // Event consumer thread (blocks on incoming event tuples)
        Thread consumer = new Thread(() -> {
            while (running) {
                try {
                    Object[] ev = space.get(
                        new ActualField("event"),
                        new FormalField(Integer.class),
                        new FormalField(String.class),
                        new FormalField(Long.class)
                    );

                    int pid = (int) ev[1];
                    String action = (String) ev[2];
                    long ts = (long) ev[3];

                    PlayerState ps = players.computeIfAbsent(pid, PlayerState::new);
                    ps.lastAction = action;
                    ps.lastTs = ts;
                    ps.applyAction(action);
                    logger.info("player move: id={} action={} pos=({}, {}) ts={}", pid, action, ps.x, ps.y, ts);

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }, "GameLoop-Consumer");
        consumer.setDaemon(true);
        consumer.start();

        // Tick broadcaster (authoritative state)
        tickExecutor.scheduleAtFixedRate(this::broadcastState, 0, 50, TimeUnit.MILLISECONDS);
    }

    public void stop() {
        running = false;
        tickExecutor.shutdownNow();
    }

    private void broadcastState() {
        try {
            String out = gson.toJson(Map.of("type", "state", "players", players.values()));
            logger.debug("broadcasting state: {}", out);
            server.broadcast(out);
        } catch (Exception e) {
            logger.error("error broadcasting state", e);
        }
    }

    public static class PlayerState {
        public final int id;
        public double x = 0.0;
        public double y = 0.0;
        public String lastAction = "";
        public long lastTs = 0L;

        public PlayerState(int id) {
            this.id = id;
        }

        public void applyAction(String action) {
            double speed = 1.0;
            switch (action) {
                case "UP":    y -= speed; break;
                case "DOWN":  y += speed; break;
                case "LEFT":  x -= speed; break;
                case "RIGHT": x += speed; break;
                case "FIRE":  /* handle shooting */ break;
                default: break;
            }
        }
    }

}
