// Online rock-paper-scissors game
// Source: https://github.com/Costava/rock-paper-scissors
// Start in a console with `node rock-paper-scissors.js`

////////////////////////////////////////////////////////////////////////////////

/**
 * Menu options are chosen by a 1-indexed number, but stored in 0-indexed array
 * @constructor
 * @param {object} config
 * @property {string} config.title
 * @property {function} config.other - what to do if no valid option selected
 * @property {object[]} config.options
 * @property {string} config.options[].name - name of option to display
 * @property {function} config.options[].work - what to do when selected
 */
function Menu(config) {
	this.title = config.title;
	this.other = config.other;

	this.options = config.options;
}

/**
 * Print the menu, showing its title and options
 */
Menu.prototype.print = function() {
	console.log(`--- ${this.title} ---`);

	for (var i = 0; i < this.options.length; i += 1) {
		console.log(`[${i + 1}] ${this.options[i].name}`)
	}

	console.log("");
};

/**
 * Do the option if text is a valid number (1-indexed) for an option,
 *  else call menu's other function
 * @param {string} text
 */
Menu.prototype.try = function(text) {
	var selection = Number(text);

	if (!isNaN(selection)) {
		if (selection >= 1 && selection <= this.options.length) {
			this.select(selection - 1);

			return;
		}
	}

	this.other();
};

/**
 * Do the work for the option number num
 * @param {number} num - 0-indexed
 */
Menu.prototype.select = function(num) {
	console.log(`Selected [${num + 1}] ${this.options[num].name}\n`);

	this.options[num].work();
};

////////////////////////////////////////////////////////////////////////////////

const net = require('net');

////////////////////////////////////////////////////////////////////////////////

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
