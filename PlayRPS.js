// Online rock-paper-scissors game
// Source: https://github.com/Costava/rock-paper-scissors
// Launch game from a console: `node PlayRPS.js`

const net = require('net');

const Menu = require('./Menu');

//////////

// Functions that are called when appropriate if not null at that time
var handleInput = null;
var handleData = null;

var server = null;
var client = null;

var port = null;// number
var host = null;// string

var choice = null;// string of length 1
var opponentChoice = null;// string of length 1

// Are reset to zero when player first connects to host
var score = 0;
var opponentScore = 0;

//////////

/**
 * @param {Menu} menu
 */
function openMenu(menu) {
	handleInput = menu.try.bind(menu);

	menu.print();
}

/**
 * choice is trusted but opponentChoice is checked for validity
 * @param {string} choice
 * @param {string} opponentChoice
 * @returns {number|null} - null if opponentChoice not valid
 */
function result(choice, opponentChoice) {
	var options = ['r', 'p', 's'];

	if (options.indexOf(opponentChoice) === -1) {
		return null;
	}

	var decision = {
		r: {
			r: 0,
			p: 0,
			s: 1
		},
		p: {
			r: 1,
			p: 0,
			s: 0
		},
		s: {
			r: 0,
			p: 1,
			s: 0
		}
	};

	return decision[choice][opponentChoice];
}

function handleMadeChoice() {
	handleInput = null;

	console.log("Waiting for opponent...\n");

	client.write(choice);

	if (typeof opponentChoice === 'string') {
		handleEndMatch();
	}
	else {
		handleData = function(data) {
			handleData = null;

			opponentChoice = data.toString();

			handleEndMatch();
		};
	}
}

function handleEndMatch() {
	var res = result(choice, opponentChoice);
	var resForOpponent = result(opponentChoice, choice);

	var choiceNames = {
		r: 'rock',
		p: 'paper',
		s: 'scissors'
	};

	var choiceName = choiceNames[choice];
	var opponentChoiceName = choiceNames[opponentChoice];

	// Reset variables
	choice = null;
	opponentChoice = null;

	if (res === null) {
		console.log("Invalid choice from opponent. Returning to main menu.\n");

		openMenu(mainMenu);
	}
	else {
		score += res;
		opponentScore += resForOpponent;

		console.log(`You chose ${choiceName}. Opponent chose ${opponentChoiceName}.`);

		if (res === 1) {
			console.log("You win!");
		}
		else if (resForOpponent === 1) {
			console.log("You lose.");
		}
		else {
			console.log("Tie!");
		}

		console.log(`You: ${score} Opponent: ${opponentScore}\n`);

		handleData = function(data) {
			handleData = null;

			opponentChoice = data.toString();

			if (typeof choice === 'string') {
				handleEndMatch();
			}
		};

		openMenu(playMenu);
	}
}

//////////

var mainMenu = new Menu({
	title: "Rock Paper Scissors",
	other: function() {
		console.log("Invalid selection\n");

		mainMenu.print();
	},
	options: [
		{
			name: "Join game",
			work: function() {
				console.log("Enter host (IP):");

				handleInput = function(text) {
					host = text.trim();

					console.log("Enter port number:");

					handleInput = function(text) {
						port = Number(text);

						if (isNaN(port) || port <= 0) {
							console.log("Invalid port number");
							console.log("Enter port number:");
						}
						else {
							handleInput = null;

							console.log("\nConnecting...")

							client = net.connect({host: host, port: port}, function() {
								// 'connect' listener

								console.log("Connected to host\n");

								// Reset scores
								score = 0;
								opponentScore = 0;

								openMenu(playMenu);
							});

							handleData = function(data) {
								handleData = null;

								opponentChoice = data.toString();

								if (typeof choice === 'string') {
									handleEndMatch();
								}
							};

							client.on('data', (data) => {
								if (typeof handleData === 'function') {
									handleData(data);
								}
							});

							client.on('end', () => {
								console.log('Disconnected from host\n');

								client.destroy();
								client = null;

								openMenu(mainMenu);
							});

							client.on('error', function(e) {
								console.log(e);
								console.log('Error with connection. Returning to main menu.\n');

								openMenu(mainMenu);
							});
						}
					};
				};
			}
		},
		{
			name: "Host game",
			work: function() {
				console.log("Enter port number:");

				handleInput = function(text) {
					port = Number(text);

					if (isNaN(port) || port <= 0) {
						console.log("Invalid port number");
						console.log("Enter port number:");
					}
					else {
						handleInput = null;

						server = net.createServer((c) => {
							// 'connection' listener

							console.log('Player connected\n');

							// Reset scores
							score = 0;
							opponentScore = 0;

							client = c;

							handleData = function(data) {
								handleData = null;

								opponentChoice = data.toString();

								if (typeof choice === 'string') {
									handleEndMatch();
								}
							};

							client.on('data', (data) => {
								if (typeof handleData === 'function') {
									handleData(data);
								}
							});

							client.on('end', () => {
								console.log('Connection ended\n');

								client.destroy();
								client = null;

								openMenu(mainMenu);
							});

							client.on('error', function(e) {
								console.log(e);
								console.log('Error with connection. Returning to main menu.\n');

								client.destroy();
								client = null;

								openMenu(mainMenu);
							});

							openMenu(playMenu);

							server.close();
							server = null;
						});

						server.listen(port, () => {
							console.log("\nWaiting for player...");
						});
					}
				};
			}
		},
		{
			name: "Quit",
			work: function() {
				console.log("Goodbye!");

				process.exit();
			}
		}
	]
});

var playMenu = new Menu({
	title: "Choose wisely",
	other: function() {
		console.log("Invalid selection\n");

		playMenu.print();
	},
	options: [
		{
			name: "Rock",
			work: function() {
				choice = 'r';

				handleMadeChoice();
			}
		},
		{
			name: "Paper",
			work: function() {
				choice = 'p';

				handleMadeChoice();
			}
		},
		{
			name: "Scissors",
			work: function() {
				choice = 's';

				handleMadeChoice();
			}
		},
		{
			name: "Leave",
			work: function() {
				client.end();
				client.destroy();
				client = null;

				console.log("Returning to main menu.\n");

				openMenu(mainMenu);
			}
		}
	]
});

//////////

console.log("");

openMenu(mainMenu);

//////////

process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
	if (typeof handleInput === "function") {
		handleInput(text);
	}
});

process.stdin.resume();
