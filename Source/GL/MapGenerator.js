
//////////////////
// 
//       A   B   C
//      __________
//     |
//  1  |
//     |
//  2  |
//     |
//  3  |

module.exports = {
	generateRandomMap: function (length) {
		var randomTileName;
		var randomIndex;
		var newTile;
		var length = 2;
		var i;
		var currentTranslation = [0, 0];

		starCoords = [];
		starCoords.push.apply(starCoords, TILES['B2-A2'].coords);
		var currentPos = TILES['B2-A2'].end;

		for (var i = 0; i < length; i++) {

			availableTiles = 
			randomIndex = Math.floor(Math.random() * availableTiles.length);
			newTile = availableTiles[randomIndex];
			translated = this.translateCoords(newTile.coords, currentTranslation);
			starCoords.push.apply(starCoords, translated);			
		}

		return starCoords;
	},

	translateCoords: function (coordinates, translation) {
		var newCoords = [];

		for (var i = 0; i < coordinates.length; i++) {
			newCoords[i][0] = coordinates[i][0] + translation[0];
			newCoords[i][1] = coordinates[i][1] + translation[1];
		}

		return newCoords;
	}
};

TILES = {
	'B2-A2': {
	start: [1, 1],
	end: [0, 1],
	coords: [
		[0.4, 0],
		[-0.4, 0],
		[0.4, 0.25],
		[-0.4, 0.25]
	]},
	'B2-A2': {
	start: [0, 1],
	end: [2, 1],
	coords: [
		[0.4, 0],
		[-0.4, 0],
		[0.35, 0.25],
		[-0.35, 0.25],
		[0.15, 0.25],
		[-0.05, 0.25]
	]},
}
