package com.shootergame.util;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.jspace.SequentialSpace;
import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.Space;

/**
 * Central place for tuple space constants and helpers.
 */
public class TupleSpaces {

    /**
     * Player registration tuples.
     * Format: ("player", playerId)
     */
    public static final String PLAYER = "player";

    /**
     * Input event tuples.
     * Format: ("input", playerId, action, payload)
     */
    public static final String INPUT = "input";

    private TupleSpaces() {
        // Utility class
    }

    // Registry of per-game spaces. Using separate SequentialSpace per game id
    private static final Map<String, Space> gameSpaces = new ConcurrentHashMap<>();

    private static Space getOrCreateGameSpace(String gameId) {
        return gameSpaces.computeIfAbsent(gameId, id -> new SequentialSpace());
    }

    // Helper APIs (game-scoped)
    public static void putPlayer(Space rootSpace, String gameId, int playerId) throws InterruptedException {
        Space s = getOrCreateGameSpace(gameId);
        s.put(PLAYER, playerId);
    }

    public static void putInput(Space rootSpace, String gameId, int playerId, String action, String payload) throws InterruptedException {
        Space s = getOrCreateGameSpace(gameId);
        s.put(INPUT, playerId, action, payload);
    }

    public static List<Object[]> queryAllPlayers(Space rootSpace, String gameId) throws InterruptedException {
        Space s = getOrCreateGameSpace(gameId);
        return s.queryAll(new ActualField(PLAYER), new FormalField(Integer.class));
    }

    /**
     * Remove a player tuple for a game if present.
     */
    public static boolean removePlayer(Space rootSpace, String gameId, int playerId) throws InterruptedException {
        Space s = getOrCreateGameSpace(gameId);
        boolean removed = false;
        try {
            // check if present
            List<Object[]> found = s.queryAll(new ActualField(PLAYER), new FormalField(Integer.class));
            if (found != null) {
                for (Object[] r : found) {
                    if (r.length >= 2 && r[1] instanceof Number) {
                        int pid = ((Number) r[1]).intValue();
                        if (pid == playerId) {
                            // remove the matching tuple (use ActualField to match exact value)
                            try {
                                s.get(new ActualField(PLAYER), new ActualField(playerId));
                                removed = true;
                            } catch (Exception e) {
                                // if another thread consumed it, ignore and continue
                            }
                        }
                    }
                }
            }
        } catch (InterruptedException ie) {
            throw ie;
        } catch (Exception ex) {
            // ignore if not present or other non-fatal errors
        }
        return removed;
    }

    /**
     * Attempt to remove a player tuple from any game space where it exists.
     */
    public static boolean removePlayerFromAny(Space rootSpace, int playerId) throws InterruptedException {
        boolean removedAny = false;
        try {
            for (Map.Entry<String, Space> e : gameSpaces.entrySet()) {
                String gid = e.getKey();
                Space s = e.getValue();
                try {
                    List<Object[]> found = s.queryAll(new ActualField(PLAYER), new FormalField(Integer.class));
                    if (found != null) {
                        for (Object[] r : found) {
                            if (r.length >= 2 && r[1] instanceof Number) {
                                int pid = ((Number) r[1]).intValue();
                                if (pid == playerId) {
                                    try {
                                        s.get(new ActualField(PLAYER), new ActualField(playerId));
                                        removedAny = true;
                                    } catch (Exception ex) {
                                        // ignore race where tuple already removed
                                    }
                                }
                            }
                        }
                    }
                } catch (InterruptedException ie) {
                    throw ie;
                } catch (Exception ex) {
                    // ignore and continue to next space
                }
            }
        } catch (InterruptedException ie) {
            throw ie;
        } catch (Exception ex) {
            // ignore overall
        }
        return removedAny;
    }

    public static Object[] getInputBlockingAny(Space rootSpace) throws InterruptedException {
        // Poll all game spaces using non-blocking queries. If none found, sleep briefly and retry.
        while (true) {
            for (Map.Entry<String, Space> e : gameSpaces.entrySet()) {
                String gid = e.getKey();
                Space s = e.getValue();
                try {
                    List<Object[]> found = s.queryAll(new ActualField(INPUT), new FormalField(Integer.class), new FormalField(String.class), new FormalField(String.class));
                    if (found != null && !found.isEmpty()) {
                        // consume one tuple (get) to remove it
                        Object[] r = s.get(new ActualField(INPUT), new FormalField(Integer.class), new FormalField(String.class), new FormalField(String.class));
                        if (r != null) {
                            // r is expected to be ["input", playerId, action, payload]
                            Object[] wrapped = new Object[r.length];
                            wrapped[0] = gid;
                            if (r.length > 1) {
                                System.arraycopy(r, 1, wrapped, 1, r.length - 1);
                            }
                            return wrapped;
                        }
                    }
                } catch (InterruptedException ie) {
                    throw ie;
                } catch (Exception ex) {
                    // ignore and try next
                }
            }

            // No input found in any space; sleep briefly and retry to avoid busy-waiting.
            try {
                Thread.sleep(25);
            } catch (InterruptedException ie) {
                throw ie;
            }
        }
    }

    // Backwards-compatible helpers for single-space callers (keeps previous API semantics)
    public static void putPlayer(Space space, int playerId) throws InterruptedException {
        putPlayer(space, "default", playerId);
    }

    public static void putInput(Space space, int playerId, String action, String payload) throws InterruptedException {
        putInput(space, "default", playerId, action, payload);
    }

    public static List<Object[]> queryAllPlayers(Space space) throws InterruptedException {
        return queryAllPlayers(space, "default");
    }

    public static Object[] getInputBlocking(Space space) throws InterruptedException {
        return getInputBlockingAny(space);
    }
}
