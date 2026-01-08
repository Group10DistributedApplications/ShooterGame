package com.shootergame.game.input;

import java.util.List;

import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.Space;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.shootergame.game.WorldState;
import com.shootergame.util.TupleSpaces;

/**
 * Consumes input tuples from the tuple space and applies them to WorldState.
 * Isolates blocking tuple space operations from the game loop.
 */
public class InputConsumer {

    private static final Logger logger = LoggerFactory.getLogger(InputConsumer.class);

    private final Space space;
    private final WorldState worldState;
    private volatile boolean running = true;
    private Thread consumerThread;

    public InputConsumer(Space space, WorldState worldState) {
        this.space = space;
        this.worldState = worldState;
    }

    public void start() {
        if (consumerThread != null && consumerThread.isAlive()) {
            logger.warn("InputConsumer already running");
            return;
        }

        running = true;
        consumerThread = new Thread(() -> {
            while (running) {
                try {
                    // Consume input tuples from tuple space (blocks until available)
                    Object[] ev = TupleSpaces.getInputBlocking(space);

                    int playerId = ((Number) ev[1]).intValue();
                    String action = (String) ev[2];
                    String payload = (String) ev[3];

                    // Convert to PlayerInput and apply
                    PlayerInput input = new PlayerInput(playerId, action, payload);
                    worldState.applyInput(input);

                    logger.debug("Consumed input playerId={} action={} payload={}", playerId, action, payload);

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    logger.error("Error in input consumer", e);
                }
            }
        }, "InputConsumer-Thread");
        consumerThread.setDaemon(true);
        consumerThread.start();
        logger.info("InputConsumer started");
    }

    /**
     * Stop the input consumer.
     */
    public void stop() {
        running = false;
        if (consumerThread != null && consumerThread.isAlive()) {
            consumerThread.interrupt();
        }
    }
}
