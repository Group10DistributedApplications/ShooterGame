package com.shootergame.network;

import java.net.InetSocketAddress;
import java.util.Map;

import org.jspace.Space;
import org.java_websocket.WebSocket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
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
    private final ScheduledExecutorService sweeper;

    public NetworkServer(InetSocketAddress address, Space space) {
        super(address);
        this.space = space;
        this.serializer = new JsonSerializer();
        this.clientRegistry = new ClientRegistry();
        this.messageHandler = new MessageHandler(space, clientRegistry, serializer);
        // Use a small thread pool to perform socket sends asynchronously so
        // a slow client cannot block the game tick thread.
        this.broadcaster = Executors.newCachedThreadPool();
        // Scheduled sweeper to detect closed sockets and clean up tuples
        this.sweeper = Executors.newSingleThreadScheduledExecutor();
        // Configure connection lost timeout so the underlying library detects
        // dropped clients sooner than TCP timeouts. Value in seconds.
        this.setConnectionLostTimeout(10);
        this.sweeper.scheduleAtFixedRate(this::cleanupClosedSockets, 3, 3, TimeUnit.SECONDS);
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
                boolean removed = false;
                if (gid != null) {
                    removed = TupleSpaces.removePlayer(space, gid, pid);
                } else {
                    // try to remove from any game space if we don't know the game id
                    removed = TupleSpaces.removePlayerFromAny(space, pid);
                }
                if (removed) {
                    logger.info("Removed player {} tuple for game={} on disconnect", pid, gid);
                } else {
                    logger.info("No player tuple found for player {} on disconnect (game={})", pid, gid);
                }
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
        // Attempt to clean up player tuples on socket error as well
        if (conn != null) {
            try {
                Integer pid = clientRegistry.getPlayerId(conn);
                String gid = clientRegistry.getGameId(conn);
                if (pid != null) {
                    boolean removed = false;
                    if (gid != null) {
                        removed = TupleSpaces.removePlayer(space, gid, pid);
                    } else {
                        removed = TupleSpaces.removePlayerFromAny(space, pid);
                    }
                    if (removed) {
                        logger.info("Removed player {} tuple for game={} on error", pid, gid);
                    } else {
                        logger.info("No player tuple found for player {} on error (game={})", pid, gid);
                    }
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                logger.debug("Failed to remove player tuple on error", e);
            }

            clientRegistry.unregister(conn);
        }
    }

    /**
     * Periodically invoked to clean up any sockets that appear closed but
     * haven't been unregistered (e.g. abrupt browser reload).
     */
    private void cleanupClosedSockets() {
        try {
            for (WebSocket socket : clientRegistry.getAllSockets()) {
                try {
                    if (!socket.isOpen()) {
                        Integer pid = clientRegistry.getPlayerId(socket);
                        String gid = clientRegistry.getGameId(socket);
                        if (pid != null) {
                            logger.info("Sweeper removing player {} for closed socket (game={})", pid, gid);
                            try {
                                boolean removed = false;
                                if (gid != null) {
                                    removed = TupleSpaces.removePlayer(space, gid, pid);
                                } else {
                                    removed = TupleSpaces.removePlayerFromAny(space, pid);
                                }
                                if (removed) {
                                    logger.info("Sweeper removed player {} tuple (game={})", pid, gid);
                                } else {
                                    logger.info("Sweeper found no tuple for player {} (game={})", pid, gid);
                                }
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            } catch (Exception e) {
                                logger.debug("Sweeper failed to remove player tuple", e);
                            }
                        }
                        clientRegistry.unregister(socket);
                    }
                } catch (Exception e) {
                    logger.debug("Error while sweeping socket cleanup", e);
                }
            }
        } catch (Exception e) {
            logger.debug("Sweeper failed", e);
        }
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
            try {
                sweeper.shutdownNow();
            } catch (Exception e) {
                logger.debug("Error shutting down sweeper", e);
            }
        }
    }

    public ClientRegistry getClientRegistry() {
        return clientRegistry;
    }
}
