# Project Shooter game - 10

# Abstract

For this project, we want to create a program that uses tuple spaces to handle communication between multiple users. Our idea is to build a top-down multiplayer shooter game with up to four players. The players are placed in a square game area where they can move left, right, up, and down (along the x and y axes). Players can shoot projectiles at each other, and the goal is to be the last player still alive. The tuple space will be used to store and share important game information, such as player actions, shots fired, health, scores and powerups. Each player’s game client will read from and write to the tuple space so that everyone sees the same game state at the same time. We plan to implement the project using TypeScript for the frontend and Java for the backend. All members of the group have experience working with TypeScript and Java, which will allow us to focus more on learning and applying tuple spaces rather than learning a new programming language. TypeScript is also well suited for interactive and real-time applications, such as multiplayer games.


# Contributors

Project contributors:
* Amalie (s235119@student.dtu.dk) - S235119
* Victor (s235077@student.dtu.dk) - AlmostMid
* Karl (s235066@student.dtu.dk) - karlpedro
* Balder (s235094@student.dtu.dk) - TheRealChair
* Viktor (s214707@student.dtu.dk) - ViktorKjer

Contributions:
* Design of main coordination aspects: Every member
* Coding of main coordination aspects: Karl
* Documentation (this README file): Amalie, Victor and Karl
* Videos: Balder, Viktor and Karl
* Other aspects (e.g. coding of UI, etc.): Every member

# Demo video

Running on multiple computers video: https://youtu.be/A3wOy1fM8dA 

# Main coordination challenge

The main coordination challenge we encountered was synchronizing player movement across clients in a way that was responsive and consistent. Our initial approach was to let each client compute its own movement locally and periodically send updated positions to the server. This approach caused noticeable lag and jitter, especially under network delay, because the server had to reconcile late or inconsistent position updates from different clients. As a result, the game state often diverged, making movement feel unreliable, and bullet spawning where the player wasn’t located.
To address this, we changed the coordination model so that clients no longer send positions, but instead send input actions (e.g. movement commands). At the center of this solution is the TupleSpaces utility class. Here we define the tuple formats ("player" and "input") and manage one SequentialSpace per game ID. Each game instance gets its own space, so inputs and player registrations from different games never interfere with each other. This follows the basic tuple space idea from Lecture 01, where a tuple space is used as a shared coordination medium that isolates interacting components.

Instead of clients writing directly to shared game state, the NetworkServer only translates incoming network messages into tuples. When a client sends an action, the server inserts an "input" tuple into the correct game’s space using putInput(). The network layer does not wait for the input to be processed; it simply publishes the tuple and continues. This decoupling ensures that slow or laggy clients do not block the simulation, and that all movement decisions are made centrally by the server.
On the simulation side, the InputConsumer runs in its own thread and continuously retrieves input tuples using getInputBlockingAny(). This directly follows the producer–consumer pattern with blocking operations, as presented in Lecture 02 – Concurrent Programming (slides 6–7). The consumer blocks until input is available and then forwards it to the GameLoop, which applies the input to the authoritative world state. By consuming inputs instead of synchronizing positions, the server remains fully in control of movement, physics, and collision handling.
Player lifecycle is also coordinated through the tuple space. When a player joins, a "player" tuple is inserted; when the player disconnects, the tuple is removed. A sweeper thread periodically removes stale player tuples caused by silent disconnects, allowing the game world to cleanly drop disconnected players without special-case logic.
We chose a SequentialSpace because it guarantees that the oldest matching tuple is returned first. This FIFO-style behavior ensures that player inputs are processed in arrival order, which is essential for fair and consistent movement updates. We did not choose a queue because our coordination needs were not limited to ordered input events. We also needed to manage player presence and cleanup declaratively within the same coordination mechanism.

# Programming language and coordination mechanism
This project is based on the tuple space library JSpace.
We used Java for the backend with tuples and typescript for the frontend.

# Installation

- Java 21
- Maven
- Node.js (npm)
- Git

from root
Setup:
npm run setup   (runs scripts/setup.js script)

How to run:
npm start       (starts backend and frontend)

In order to run the multiplayer version one person has to setup the backend as shown above, and distribute the link to the other players who can then copy and paste in a web browser to connect to the game.

# References 
Lecture 01
Lecture 02 – Concurrent Programming (slides 6–7)
