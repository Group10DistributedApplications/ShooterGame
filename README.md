# Project Shooter game - 10

# Abstract

> For this project, we want to create a program that uses tuple spaces to handle communication between multiple users.
Our idea is to build a top-down multiplayer shooter game with up to four players. The players are placed in a square game area where they can move left, right, up, and down (along the x and y axes). Players can shoot projectiles at each other, and the goal is to be the last player still alive.
The tuple space will be used to store and share important game information, such as player positions, shots fired, health, and scores. Each player’s game client will read from and write to the tuple space so that everyone sees the same game state at the same time.
We plan to implement the project using JavaScript. All members of the group have experience working with JavaScript, which will allow us to focus more on learning and applying tuple spaces rather than learning a new programming language. JavaScript is also well suited for interactive and real-time applications, such as multiplayer games.


# Contributors

Project contributors:
* Amalie (s235119@student.dtu.dk) - S235119
* Victor (s235077@student.dtu.dk) - AlmostMid
* Karl (s235066@student.dtu.dk) - karlpedro
* Balder (s235094@student.dtu.dk) - TheRealChair
* Viktor (s214707@student.dtu.dk) - ViktorKjer

> Indicate the name of main people contributing to each part of the project below (keep the bullet points!). Note that the report as a whole is under the joint responsibility of the entire
group. 

Contributions:
* Design of main coordination aspects: Alice, Bob.
* Coding of main coordination aspects: Bob, Charlie.
* Documentation (this README file): Charlie, Dave.
* Videos: Dave, Alice.
* Other aspects (e.g. coding of UI, etc.): Alice, Dave.

> IMPORTANT: The history of the repository must show that *all* members have been active contributors.

# Demo video

> Add here a link to a video showing how your project runs. The video does not need to explain anything about how you designed or coded your project. Just show how it runs. There is no time limit or specific format. You can put it on YouTube or similar.

Demo video: https://youtu.be/paWE-GvDO1c?si=SR6srFgJOtMZ1ECE

> If your demo video uses one single computer (as it would be easier to screencast), please add a link to an additional video showing that it can also run on multiple computers.

Running on multiple computers video: https://www.youtube.com/shorts/76W1ZtZfgFk

> As a back-up, please upload the videos as part of your submission.

# Main coordination challenge

> Most likely you have been addressing and sovling many coordination challenges. Which one was the most challenging? Which solution are you most proud?. Choose just one. Use a few diagrams to illustrate the challenge and the solution. Use a few paragraphs to explain it. Refer to the materials from the mandatory materials (modules 1-3) and recommended materials (modules 4-6, Klempmann's course, etc.). That is, use the precise terminology and add references. This part shold not be longer than 2 screens (approx.).

# Programming language and coordination mechanism

> If you use a tuple space library from [pSpaces](https://github.com/pSpaces) just write something like "This project is based on the tuple space library X" where X is jSpace, dotSpace, etc.
> If you use something else implement coordination, you will have to describe here how the coordination concepts and mechanisms in the frameworks you use relate to the ones we use in the course. For example, if you decide to use Erlang you will have to explain inboxes and all that in terms of tuple spaces. The goal should be that anyone that has followed the couse materials, should be able to understand what you did, even if you decided not to use pSpaces libraries.

# Installation

> Provide here installation requirements and instructions. Your goal here is that anyone else following the course should be able to follow the steps and run your project.

## Backend setup

Requirements:
- Java 21
- Maven
- Node.js (npm)

Setup:
```bash
git clone <repo-url>
cd ShooterGame
./setup.ps1   # Windows
./setup.sh    # macOS/Linux
```

# References 
> List here the main references that you have been using in your text above (course materials, articles, webtsites, etc.)

# IMPORTANT!

> Feel free to remove all comments of the template, but please **keep the section structure** (Project, Abstract, ...)
