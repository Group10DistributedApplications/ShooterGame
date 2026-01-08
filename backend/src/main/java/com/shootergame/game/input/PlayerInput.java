package com.shootergame.game.input;

/**
 * Tiny immutable value object representing a player's input action.
 */
public record PlayerInput(
    int playerId,
    String action,
    String payload
) {
}
