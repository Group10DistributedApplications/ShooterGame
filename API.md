# API Documentation

## WebSocket Connection

**Endpoint:** `ws://localhost:3000`

Connect using any WebSocket client. All messages are JSON formatted.

## Client → Server Messages

### Register Player
Registers a player in a game lobby. Must be sent before any input actions.

**Request:**
```json
{
  "type": "register",
  "playerId": 1,
  "gameId": "default"
}
```
- `playerId` (integer, required): Unique player identifier
- `gameId` (string, optional): Game lobby to join (defaults to "default")

**Response:**
```json
{"type": "registered", "playerId": 1}
```

**Errors:**
- `"Game is full"` - Game has reached MAX_PLAYERS limit (default: 6)
- `"playerId required for register"` - Missing playerId field

### Send Input
Sends player actions to control movement, shooting, or game control.

**Request:**
```json
{
  "type": "input",
  "playerId": 1,
  "action": "UP",
  "payload": ""
}
```
- `playerId` (integer, required): Your player ID
- `action` (string, required): One of:
  - Movement: `UP`, `DOWN`, `LEFT`, `RIGHT`
  - Stop movement: `STOP_UP`, `STOP_DOWN`, `STOP_LEFT`, `STOP_RIGHT`
  - Actions: `FIRE`, `START`
- `payload` (string, optional): Direction for FIRE action (UP/DOWN/LEFT/RIGHT)

**Notes:**
- Must register before sending input
- `START` resets the game for all players in the lobby
- Movement is continuous until stopped with STOP_* actions

**Errors:**
- `"playerId and action required for input"` - Missing required fields

### Ping
Health check to verify connection.

**Request:**
```json
{"type": "ping"}
```

**Response:**
```json
{"type": "pong", "ts": 1234567890}
```

## Server → Client Messages

### State Broadcast
Game state sent to all players in a game every 50ms (20 ticks/second).

**Message:**
```json
{
  "type": "state",
  "players": [
    {
      "id": 1,
      "x": 100.0,
      "y": 200.0,
      "lives": 3,
      "hasSpeedBoost": false,
      "hasNoCooldown": false,
      "hasSpreadShot": false
    }
  ],
  "projectiles": [
    {"id": 1, "x": 150.0, "y": 250.0, "vx": 400.0, "vy": 0.0, "owner": 1}
  ],
  "powerups": [
    {"id": 1, "x": 320.0, "y": 350.0, "type": "speed", "active": true}
  ]
}
```

### Game Start
Broadcast when a player sends START action.

**Message:**
```json
{"type": "game_start"}
```
Clients should reset UI and prepare for match.

### Game Over
Broadcast when only one player remains alive or all players die.

**Message:**
```json
{"type": "game_over", "winner": 1}
```
- `winner` (integer|null): Winning player ID, or null if all died

### Error
Sent when a request fails validation.

**Message:**
```json
{"type": "error", "message": "Game is full"}
```

## Tuple Space (jSpace)

Each game has its own isolated tuple space identified by `gameId`.

**Per-game tuple spaces:**
- `("player", playerId)` - Player registration in a specific game
- `("input", playerId, action, payload)` - Player input events in a specific game

The system uses `TupleSpaces.getOrCreateGameSpace(gameId)` to maintain separate spaces per game lobby.