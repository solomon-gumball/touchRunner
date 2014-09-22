var Timer = require('../Utilities/Timer');

module.exports = {
	_position: [0, 0],
	_events: {
		"move": []
	},

	init: function init () {
		this._scrollable = document.createElement('div');
		this._scrollable.style.position = 'absolute';
		this._scrollable.style.top = '0px';
		this._scrollable.style.left = '0px';
		this._scrollable.style.width = innerWidth + 'px';
		this._scrollable.style.height = innerHeight + 'px';
		this._scrollable.style.overflowY = 'scroll';
    	this._scrollable.style.webkitOverflowScrolling = 'touch';

		this._insert = document.createElement('div');
		this._insert.style.width = (innerWidth * 2) + 'px';
		this._insert.style.height = (innerHeight * 2) + 'px';

		this._scrollable.appendChild(this._insert);

		document.body.appendChild(this._scrollable);

		this._scrollable.onscroll = this.handleScroll.bind(this);
		this._scrollable.ontouchend = this.handleTouchEnd.bind(this);
	},

	on: function on(eventName, callback) {
		if(!this._events[eventName]) throw "Invalid eventName: " + eventName;

		this._events[eventName].push(callback);
	},

	handleScroll: function handleScroll(e) {
		var offset = [
			this._position[0] - this._scrollable.scrollLeft,
			this._position[1] - this._scrollable.scrollTop
		];
		var touchMoveEvents = this._events["move"];
		for (var i = 0; i < touchMoveEvents.length; i++) {
			touchMoveEvents[i](offset);
		}

		this._position = [this._scrollable.scrollLeft, this._scrollable.scrollTop];
	},

	handleTouchEnd: function handleTouchEnd(e) {

	},
}