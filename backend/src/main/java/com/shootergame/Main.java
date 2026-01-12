package com.shootergame;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;

import org.jspace.SequentialSpace;
import org.jspace.Space;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.shootergame.game.GameLoop;
import com.shootergame.game.input.InputConsumer;
import com.shootergame.network.NetworkServer;

/**
 * Application bootstrap.
 * Wires dependencies and manages lifecycle.
 */
public class Main {

    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) throws Exception {
        // Create tuple space for inter-component communication
        Space space = new SequentialSpace();

        // Start network server
        NetworkServer server = new NetworkServer(new InetSocketAddress("0.0.0.0", 3000), space);
        server.start();
        // Minimal, user-visible startup message
        System.out.println("Backend listening on :3000");

        // Start game loop and world state
        GameLoop gameLoop = new GameLoop(space, server);
        gameLoop.start();

        // Start input consumer (blocking operation in separate thread)
        InputConsumer inputConsumer = new InputConsumer(space, gameLoop.getWorldState());
        inputConsumer.start();

        // Start console input handler
        Thread consoleThread = new Thread(() -> {
            try (BufferedReader r = new BufferedReader(new InputStreamReader(System.in))) {
                String line;
                while ((line = r.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty())
                        continue;
                    switch (line) {
                        case "quit":
                        case "exit":
                            logger.info("Shutdown requested");
                            System.exit(0);
                            break;
                        default:
                            logger.info("Unknown command: {}", line);
                    }
                }
            } catch (Exception e) {
                logger.error("Console reader error", e);
            }
        }, "Console-Input-Thread");
        consoleThread.setDaemon(true);
        consoleThread.start();

        // Setup shutdown hooks
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("Shutting down server and game loop...");
            try {
                inputConsumer.stop();
            } catch (Exception e) {
                logger.error("Error stopping input consumer", e);
            }
            try {
                gameLoop.stop();
            } catch (Exception e) {
                logger.error("Error stopping game loop", e);
            }
            try {
                server.stop();
            } catch (Exception e) {
                logger.error("Error stopping server", e);
            }
        }));

        // Keep main thread alive
        Thread.currentThread().join();
    }
}
