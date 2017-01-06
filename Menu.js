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

module.exports = Menu;
