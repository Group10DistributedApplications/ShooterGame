package com.shootergame.network;

import java.net.InetSocketAddress;
import java.util.Map;

import org.jspace.Space;
import org.java_websocket.WebSocket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.shootergame.util.JsonSerializer;
import com.shootergame.util.TupleSpaces;

/**
 * WebSocket server that manages client connections and lifecycle.
 * Delegates message interpretation to MessageHandler.
 */
public class NetworkServer extends WebSocketServer {

    private static final Logger logger = LoggerFactory.getLogger(NetworkServer.class);

    private final Space space;
    private final ClientRegistry clientRegistry;
    private final MessageHandler messageHandler;
    private final JsonSerializer serializer;
    private final ExecutorService broadcaster;

    public NetworkServer(InetSocketAddress address, Space space) {
        super(address);
        this.space = space;
        this.serializer = new JsonSerializer();
        this.clientRegistry = new ClientRegistry();
        this.messageHandler = new MessageHandler(space, clientRegistry, serializer);
        // Use a small thread pool to perform socket sends asynchronously so
        // a slow client cannot block the game tick thread.
        this.broadcaster = Executors.newCachedThreadPool();
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        logger.info("Client connected: {}", conn.getRemoteSocketAddress());
        clientRegistry.registerConnection(conn);
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        logger.info("Client disconnected: {} (code={}, reason={})", 
            conn.getRemoteSocketAddress(), code, reason);
        // Attempt to remove player tuple for this connection so worlds will drop the player
        try {
            Integer pid = clientRegistry.getPlayerId(conn);
            String gid = clientRegistry.getGameId(conn);
            if (pid != null) {
                TupleSpaces.removePlayer(space, gid != null ? gid : "default", pid);
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        } catch (Exception ex) {
            logger.debug("Failed to remove player tuple on disconnect", ex);
        }

        clientRegistry.unregister(conn);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        messageHandler.handle(conn, message);
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        logger.error("WebSocket error ({}): {}", 
            (conn != null ? conn.getRemoteSocketAddress() : "server"), 
            ex.getMessage(), ex);
    }

    @Override
    public void onStart() {
        logger.info("WebSocket server started on {}", getAddress());
    }

    public void broadcast(String message) {
        for (WebSocket socket : clientRegistry.getAllSockets()) {
            broadcaster.submit(() -> {
                try {
                    socket.send(message);
                } catch (Exception e) {
                    logger.error("Error broadcasting to {}: {}", 
                        socket.getRemoteSocketAddress(), e.getMessage());
                }
            });
        }
    }

    public void broadcastToGame(String gameId, String message) {
        for (WebSocket socket : clientRegistry.getSocketsForGame(gameId)) {
            broadcaster.submit(() -> {
                try {
                    socket.send(message);
                } catch (Exception e) {
                    logger.error("Error broadcasting to {}: {}", 
                        socket.getRemoteSocketAddress(), e.getMessage());
                }
            });
        }
    }

    @Override
    public void stop() throws InterruptedException {
        try {
            super.stop();
        } finally {
            try {
                broadcaster.shutdownNow();
            } catch (Exception e) {
                logger.debug("Error shutting down broadcaster", e);
            }
        }
    }

    public ClientRegistry getClientRegistry() {
        return clientRegistry;
    }
}
