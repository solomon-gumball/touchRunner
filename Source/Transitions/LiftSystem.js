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

var EntityRegistry = require('../core/EntityRegistry');
var liftRoots      = EntityRegistry.addLayer('Lift');

/**
 * LiftSystem is responsible for traversing the scene graph and
 *   updating the Transforms, Sizes, and Opacities of the entities.
 *
 * @class  LiftSystem
 * @system
 * @singleton
 */
var LiftSystem = {};

/**
 * update iterates over each of the Contexts that were registered and
 *   kicks of the recursive updating of their entities.
 *
 * @method update
 */
var test = [];
LiftSystem.update = function update() {
    var rootParams;
    var cleanup = [];
    var lift;

    for (var i = 0; i < liftRoots.length; i++) {
        lift = liftRoots[i].getComponent('LiftComponent');
        rootParams = lift._update();
        rootParams.unshift(liftRoots[i]);
        coreUpdateAndFeed.apply(null, rootParams);

        if (lift.done) {
            liftRoots[i].removeComponent('LiftComponent');
            EntityRegistry.deregister(liftRoots[i], 'Lift');
        }
    }
}

/**
 * coreUpdateAndFeed feeds parent information to an entity and so that
 *   each entity can update their transform.  It 
 *   will then pass down invalidation states and values to any children.
 *
 * @method coreUpdateAndFeed
 * @private
 *   
 * @param  {Entity}  entity           Entity in the scene graph
 * @param  {Number}  transformReport  bitScheme report of transform invalidations
 * @param  {Array}   incomingMatrix   parent transform as a Float32 Array
 */
function coreUpdateAndFeed(entity, transformReport, incomingMatrix) {
    if (!entity) return;
    var transform = entity.getComponent('transform');
    var i         = entity._children.length;

    transformReport = transform._update(transformReport, incomingMatrix);

    while (i--) 
        coreUpdateAndFeed(
            entity._children[i],
            transformReport,
            transform._matrix);
}

module.exports = LiftSystem;
