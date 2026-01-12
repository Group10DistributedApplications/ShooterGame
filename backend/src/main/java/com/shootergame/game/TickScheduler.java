package com.shootergame.game;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Manages scheduled ticking of the game loop.
 * Wraps ScheduledExecutorService and handles start/stop lifecycle.
 */
public class TickScheduler {

    private static final Logger logger = LoggerFactory.getLogger(TickScheduler.class);

    private final ScheduledExecutorService executor;
    private final Runnable tickTask;
    private final long tickIntervalMs;

    public TickScheduler(Runnable tickTask, long tickIntervalMs) {
        this.tickTask = tickTask;
        this.tickIntervalMs = tickIntervalMs;
        this.executor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "GameLoop-Tick");
            t.setDaemon(false);
            return t;
        });
    }

    /**
     * Start the fixed-rate tick scheduler.
     */
    public void start() {
        executor.scheduleAtFixedRate(tickTask, 0, tickIntervalMs, TimeUnit.MILLISECONDS);
    }

    public void stop() {
        logger.info("Stopping tick scheduler");
        executor.shutdownNow();
    }

    public boolean isRunning() {
        return !executor.isShutdown();
    }
}
