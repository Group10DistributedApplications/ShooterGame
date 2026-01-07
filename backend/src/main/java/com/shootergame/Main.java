package com.shootergame;

import java.net.InetSocketAddress;

import org.jspace.SequentialSpace;
import org.jspace.Space;

public class Main {

    public static void main(String[] args) throws Exception {
        Space space = new SequentialSpace();

        // Start websocket server bound to port 3000
        NetworkServer server = new NetworkServer(new InetSocketAddress("0.0.0.0", 3000), space);
        server.start();

        System.out.println("Backend started. WebSocket listening on ws://localhost:3000");

        // Start authoritative game loop which consumes 'event' tuples and broadcasts state
        GameLoop gameLoop = new GameLoop(space, server);
        gameLoop.start();

        // Graceful shutdown
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Shutting down server and game loop...");
            try {
                gameLoop.stop();
            } catch (Exception e) {
                e.printStackTrace();
            }
            try {
                server.stop();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }));

        // Keep main thread alive
        Thread.currentThread().join();
    }

}
