package com.shootergame.game.input;

import java.util.List;

import org.jspace.Space;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.shootergame.game.WorldState;
import com.shootergame.game.GameLoop;
import com.shootergame.game.input.PlayerInput;
import com.shootergame.util.TupleSpaces;

/**
 * Consumes input tuples from the tuple space and applies them to WorldState.
 * Isolates blocking tuple space operations from the game loop.
 */
public class InputConsumer {

    private static final Logger logger = LoggerFactory.getLogger(InputConsumer.class);

    private final Space space;
    private final GameLoop gameLoop;
    private volatile boolean running = true;
    private Thread consumerThread;

    public InputConsumer(Space space, GameLoop gameLoop) {
        this.space = space;
        this.gameLoop = gameLoop;
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
                    // TupleSpaces.getInputBlocking now returns wrapped tuples with gameId as first element
                    Object[] ev = TupleSpaces.getInputBlocking(space);
                    if (ev == null || ev.length < 4) continue;
                    String gameId = (String) ev[0];
                    int playerId = ((Number) ev[1]).intValue();
                    String action = (String) ev[2];
                    String payload = (String) ev[3];

                    // Convert to PlayerInput and dispatch to correct game's WorldState
                    PlayerInput input = new PlayerInput(playerId, action, payload);
                    gameLoop.applyInput(gameId, input);

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
