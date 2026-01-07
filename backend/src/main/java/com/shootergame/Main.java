package com.shootergame;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;

import org.jspace.SequentialSpace;
import org.jspace.Space;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Main {

    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) throws Exception {
        Space space = new SequentialSpace();

        NetworkServer server = new NetworkServer(new InetSocketAddress("0.0.0.0", 3000), space);
        server.start();
        logger.info("Server listening on :3000");

        GameLoop gameLoop = new GameLoop(space, server);
        gameLoop.start();
        
        Thread consoleThread = new Thread(() -> {
            try (BufferedReader r = new BufferedReader(new InputStreamReader(System.in))) {
                String line;
                while ((line = r.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty()) continue;
                    switch (line) {
                        case "quit":
                        case "exit":
                            logger.info("shutdown requested");
                            System.exit(0);
                            break;
                        default:
                            logger.info("unknown command: {}", line);
                    }
                }
            } catch (Exception e) {
                logger.error("Console reader error", e);
            }
        }, "Console-Input-Thread");
        consoleThread.setDaemon(true);
        consoleThread.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("Shutting down server and game loop...");
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
        
        Thread.currentThread().join();
    }

}
