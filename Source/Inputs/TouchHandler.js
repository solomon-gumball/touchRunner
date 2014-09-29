var Timer = require('../Utilities/Timer');

module.exports = {
	_position: [0, 0],
	_events: {
		"move": [],
		"rotate": []
	},
	_touchCount: 0,
	_twoTouch: false,
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

		this._scrollable.ontouchmove = this.handleTouchMove.bind(this);
		this._scrollable.onscroll = this.handleScroll.bind(this);
	},

	on: function on(eventName, callback) {
		if(!this._events[eventName]) throw "Invalid eventName: " + eventName;

		this._events[eventName].push(callback);
	},

	handleTouchMove: function handleTouchMove (e) {
		if(e.targetTouches.length === 2) {
			e.preventDefault();
			e.stopPropagation();
			if(this._twoTouch) {
				this.handleRotation(e.targetTouches);
			} else {
				this.initTwoTouch(e.targetTouches);
			}
		}
		else if(this._twoTouch) this._twoTouch = false;
	},

	initTwoTouch: function initTwoTouch (touches) {
		this._twoTouch = true;
		this.startPositions = [
			[touches[0].pageX, touches[0].pageY],
			[touches[1].pageX, touches[1].pageY]
		];
	},

	handleRotation: function handleRotation (touches) {
		var deltaX;
		var deltaY;

		deltaX = Math.abs(this.startPositions[0][0] - touches[0].pageX)
			   + Math.abs(this.startPositions[1][0] - touches[1].pageX);
		deltaY = Math.abs(this.startPositions[0][1] - touches[0].pageY)
			   + Math.abs(this.startPositions[1][1] - touches[1].pageY);

		var theta = (deltaY + deltaX) / 200;

		for (var i = 0; i < this._events["rotate"].length; i++) {
			this._events["rotate"][i](theta);
		}
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
	}
}