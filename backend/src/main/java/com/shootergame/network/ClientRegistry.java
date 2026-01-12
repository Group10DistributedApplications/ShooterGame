package com.shootergame.network;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.java_websocket.WebSocket;
import com.shootergame.config.SharedConfig;

/**
 * Manages the registry of connected clients.
 * Tracks the mapping between WebSocket connections and (gameId, playerId).
 */
public class ClientRegistry {

    private static class ClientInfo {
        final String gameId;
        final int playerId;

        ClientInfo(String gameId, int playerId) {
            this.gameId = gameId;
            this.playerId = playerId;
        }
    }

    private final Map<WebSocket, ClientInfo> clients = new ConcurrentHashMap<>();
    private static final ClientInfo UNREGISTERED = new ClientInfo("", -1);

    /**
     * Register a client connection with a player ID and gameId.
     */
    public void register(WebSocket socket, String gameId, int playerId) {
        int max = SharedConfig.getInt("MAX_PLAYERS", 6);
        int current = getSocketsForGame(gameId).size();
        if (current >= max) {
            throw new IllegalStateException("Game full");
        }
        clients.put(socket, new ClientInfo(gameId, playerId));
    }

    /**
     * Register a connection without assigning a player id yet.
     */
    public void registerConnection(WebSocket socket) {
        clients.put(socket, UNREGISTERED);
    }

    /**
     * Unregister a client connection.
     */
    public void unregister(WebSocket socket) {
        clients.remove(socket);
    }

    /**
     * Get player ID for a socket connection.
     */
    public Integer getPlayerId(WebSocket socket) {
        ClientInfo v = clients.get(socket);
        if (v == null || v == UNREGISTERED || v.playerId == -1) return null;
        return v.playerId;
    }

    /**
     * Get gameId for a socket connection.
     */
    public String getGameId(WebSocket socket) {
        ClientInfo v = clients.get(socket);
        if (v == null || v == UNREGISTERED) return null;
        return v.gameId;
    }

    /**
     * Check if a socket is registered.
     */
    public boolean isRegistered(WebSocket socket) {
        ClientInfo v = clients.get(socket);
        return v != null && v != UNREGISTERED && v.playerId != -1;
    }

    /**
     * Get all registered sockets.
     */
    public Iterable<WebSocket> getAllSockets() {
        return clients.keySet();
    }

    /**
     * Get sockets for a specific gameId.
     */
    public Set<WebSocket> getSocketsForGame(String gameId) {
        return clients.entrySet().stream()
            .filter(e -> e.getValue() != null && e.getValue() != UNREGISTERED && gameId.equals(e.getValue().gameId))
            .map(Map.Entry::getKey)
            .collect(Collectors.toSet());
    }

    /**
     * Get number of connected clients.
     */
    public int getClientCount() {
        return clients.size();
    }
}
