/**
 * ControlSystemStrategy interface description with default implementations.
 * @constructor
 */
function ControlSystemStrategy() {

}
/**
 * Sort floors in order they should be considered by ControlModule to be proposed as further destination for elevator.
 *
 * Default implementation (sorted by the distance to elevator. The nearest floor is first)
 *
 * @param floors
 * @param elevator
 * @param passengerTimingsMap
 */
ControlSystemStrategy.prototype.sortFloors = function(floors, elevator, passengerTimingsMap) {
    var currentFloor = elevator.currentFloor();
    floors.sort(function (floor1, floor2) {
        var distanceToFloor1 = Math.abs(currentFloor - floor1);
        var distanceToFloor2 = Math.abs(currentFloor - floor2);
        return distanceToFloor1 > distanceToFloor2;
    });
    return floors;
};

function MinimumMovesControlSystemStrategy() {

}
MinimumMovesControlSystemStrategy.prototype = Object.create(ControlSystemStrategy.prototype);

function MinimumWaitingTimeControlSystemStrategy() {

}
MinimumWaitingTimeControlSystemStrategy.prototype = Object.create(ControlSystemStrategy.prototype);
function MaximumPassengersPerTimeControlSystemStrategy() {

}
MaximumPassengersPerTimeControlSystemStrategy.prototype = Object.create(ControlSystemStrategy.prototype);
function BalancedControlSystemStrategy() {

}
BalancedControlSystemStrategy.prototype = Object.create(ControlSystemStrategy.prototype);