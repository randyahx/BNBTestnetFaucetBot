// cooldowns.js
const { cooldown } = require('../config.json');

class Cooldowns {
	constructor() {
		this.map = new Map();
	}

	getLastTx(userId) {
		return this.map.get(userId);
	}

	setLastTx(userId, time) {
		this.map.set(userId, time);
	}
}

module.exports = new Cooldowns();
