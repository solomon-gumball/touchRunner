/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *         
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Transitionable = require('./Transitionable');
var EntityRegistry = require('../core/EntityRegistry');
var Transform      = require('../core/Transform');

/**
 * Lift gives a way to move Entities from one parent to another
 *  while transitioning transforms between the two.
 *
 * @method Lift
 *
 * @param {Entity} entity Entity to move
 * @param {Entity} to Entity to attach the first Entity to
 * @param {Object} transition details for the transition
 * @param {Function} userCallback callback to be called after reattachment
 */
var Lift = function(entity, to, transition, userCallback) {
    entity._parent.detatchChild(entity);
    EntityRegistry.register(entity, 'Lift');

    entity.addComponent(LiftComponent, {
        to: to,
        transition: transition,
        cb: function() {
            entity._parent = to;
            to._children.push(entity);
            if (userCallback) userCallback();
        }
    });
};

/**
 * Lift is a component that weights a transform between where an
 *  Entity is currently located and where it is going to end up/
 *
 * @class LiftComponent
 * @component
 * @constructor
 * 
 * @param {Entity} entity Entity that the Surface is a component of
 * @param {Object} options instantiation options
 */
function LiftComponent(entity, options) {
    this.entity = entity;
    this.from = entity._parent;
    this.to = options.to;

    this.progress = new Transitionable(0);
    this.done = false;
    this.prior = 0;

    this.liftTransform = new Transform();

    this.progress.set(1, options.transition, function() {
        this.done = true;
        if (options.cb) options.cb()
    }.bind(this));
}

var LIFT_COMPONENT = 'LiftComponent';

LiftComponent.toString = function() {
    return LIFT_COMPONENT;
};

/**
 * Updates the weighted Transform.
 *
 * @method _update
 * @private
 *
 * @return {Array} transform invalidation scheme and weighted transform
 */
LiftComponent.prototype._update = function _update() {
    var weight = this.progress.get(),
        transformInvalidation = _setWeightedTransformMatrix.call(this, weight)

    return [
        transformInvalidation,
        this.liftTransform._matrix
    ];
};

// Given a weight calculate the weighted transform
var _setWeightedTransformMatrix = function(weight) {
    var fromVectors = _getGlobalVectors(this.from),
        toVectors   = _getGlobalVectors(this.to);

    this.liftTransform.setTranslation(
        fromVectors.translation[0] * (1 - weight) + toVectors.translation[0] * weight,
        fromVectors.translation[1] * (1 - weight) + toVectors.translation[1] * weight,
        fromVectors.translation[2] * (1 - weight) + toVectors.translation[2] * weight);

    this.liftTransform.setRotation(
        fromVectors.rotation[0] * (1 - weight) + toVectors.rotation[0] * weight,
        fromVectors.rotation[1] * (1 - weight) + toVectors.rotation[1] * weight,
        fromVectors.rotation[2] * (1 - weight) + toVectors.rotation[2] * weight);

    this.liftTransform.setScale(
        fromVectors.scale[0] * (1 - weight) + toVectors.scale[0] * weight,
        fromVectors.scale[1] * (1 - weight) + toVectors.scale[1] * weight,
        fromVectors.scale[2] * (1 - weight) + toVectors.scale[2] * weight);

    return this.liftTransform._update();
}

// Combine local transforms to get the global transform
// in a vectorized state.
function _getGlobalVectors(entity) {
    var node = entity, transform, vectors, i, key,

    globalVectors = {
        rotation    : [0, 0, 0],
        translation : [0, 0, 0],
        scale       : [1, 1, 1]
    };

    do {
        vectors = node.getComponent('transform').getLocalVectors();

        globalVectors.translation[0] += vectors.translation[0];
        globalVectors.translation[1] += vectors.translation[1];
        globalVectors.translation[2] += vectors.translation[2];
        globalVectors.rotation[0]    += vectors.rotation[0];
        globalVectors.rotation[1]    += vectors.rotation[1];
        globalVectors.rotation[2]    += vectors.rotation[2];
        globalVectors.scale[0]       *= vectors.scale[0];
        globalVectors.scale[1]       *= vectors.scale[1];
        globalVectors.scale[2]       *= vectors.scale[2];

        node = node._parent;

    } while (node);

    return globalVectors;
}

module.exports = Lift;
