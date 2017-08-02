/**
 * ElevatorStrategy interface description with default implementations.
 * @constructor
 */
function ElevatorStrategy() {

}
/** Elevator's controlModule uses this service to decide where to move further (but not from being idle)
 * When the elevator is stopped at the floor and doesn't have any destination, its controlModule uses this service
 * to get the next floor to move. Take in mind few cases:
 * 1. Elevator has finished its work and there is no passenger in it. For example, service can move elevator
 * to the default floor (return the number of default floor).
 * 2. Elevator has stopped at the floor to let passengers go out. Decide where elevator should move further.
 *
 * This default implementation returns the nearest floor to move or null if there is no pressed floor.
 *
 * @param elevator - the object of elevator, which contains information about pressed floors,
 * current floor, loadFactor, capacity, etc.
 * @param passengerTimingsMap - the mapping object. Keys is number of floor, where certain passengers will go out.
 * Values are time, when those passengers pressed button to call the elevator. It can help to understand the total
 * waiting time and make appropriate decisions.
 * @returns {Number} number of the floor, where to move further.
 *          If null is returned, elevator will be waiting at current floor.
 */
ElevatorStrategy.prototype.getTheFloorToMove = function(elevator, passengerTimingsMap) {
    return ElevatorStrategy.prototype.getTheFloorToMoveFromIdle(elevator);
};
/** Elevator's controlModule uses this service to decide where to move further only from being in idle state.
 * When elevator is in idle state (waiting for passengers at current floor), any passenger can come into and
 * press any button. Maybe few passengers come in and press buttons in different directions. Service returns
 * the number of the floor, where elevator should move. Or maybe elevator should wait, until elevator is enough loaded.
 *
 * This default implementation returns the nearest floor to move or null if there is no pressed floor.
 *
 * @param elevator - the object of elevator, which contains information about pressed floors,
 * current floor, loadFactor, capacity, etc.
 * @returns {Number} number of the floor, where to move further.
 *          If null is returned, elevator will be waiting at current floor.
 */
ElevatorStrategy.prototype.getTheFloorToMoveFromIdle = function(elevator) {
    var pressedFloors = elevator.getPressedFloors();
    var theNearestFloor = null;
    var currentFloor = elevator.currentFloor();
    var theLeastDistance = Number.MAX_VALUE;
    for (var i = 0; i < pressedFloors.length; i++) {
        var distance = Math.abs(pressedFloors[i] - currentFloor);
        if (distance < theLeastDistance) {
            theLeastDistance = distance;
            theNearestFloor = pressedFloors[i];
        }
    }
    return theNearestFloor;
};
/**
 * ControlModule uses this service to define in what direction elevator will be moving after arrival.
 * Its need to notify ControlSystem in what direction elevator will be able to pick up passengers.
 *
 * @param elevator - the object of elevator, which contains information about pressed floors,
 * current floor, loadFactor, capacity, etc.
 * @param maximumFloors - number of the floors in the elevator
 * @returns {*}
 */
ElevatorStrategy.prototype.getNextGoingDirection = function(elevator, maximumFloors) {
    return elevator.destinationDirection();
};
/**
 * Elevator's controlModule calls this service to decide, whether to stop at the floor to let passengers go out.
 *
 * This default implementation returns true, so that elevator will always stop at the floor to let passengers go out.
 *
 * @param elevator - the object of elevator, which contains information about pressed floors,
 * current floor, loadFactor, capacity, etc.
 * @param passengerTimingsMap - the mapping object. Keys is number of floor, where certain passengers will go out.
 * Values are time, when those passengers pressed button to call the elevator. It can help to understand the total
 * waiting time and make appropriate decisions.
 * @returns {boolean} true if elevator should stop
 *                    false if elevator should pass the floor.
 */
ElevatorStrategy.prototype.stopAtTheFloorToLetPassengerGoOut = function(elevator, passengerTimingsMap) {
    return true;
};
/**
 * Elevator's controlModule calls this service to decide, whether to stop at the floor to pick up some passengers.
 * Service is called only if there is any passenger at the floor in the elevator's going direction.
 *
 *
 *
 * @param elevator - the object of elevator, which contains information about pressed floors,
 * current floor, loadFactor, capacity, etc.
 * @param passengerTimingsMap - the mapping object. Keys is number of floor, where certain passengers will go out.
 * Values are time, when those passengers pressed button to call the elevator. It can help to understand the total
 * waiting time and make appropriate decisions.
 * @returns {boolean} true if elevator should stop
 *                    false if elevator should pass the floor.
 */
ElevatorStrategy.prototype.stopAtTheFloorToPickPassengersUp = function(elevator, passengerTimingsMap) {
    var LOAD_THRESHOLD = 0.7;
    var SECOND = 1000;
    var TIME_THRESHOLD = 15 * SECOND;
    return ElevatorStrategy.prototype._stopAtTheFloor(elevator, passengerTimingsMap, LOAD_THRESHOLD, TIME_THRESHOLD);
};
/**
 *
 * In case loadThreshold equals 1 (elevator is full), the decision, whether to stop at the floor or not, depends only
 * on timeThreshold.
 * In case loadThreshold equals 0, false is returned. It means that elevator will never stop at the floor
 * if any floor button is pressed.
 * In case timeThreshold equals 0, false is returned. It means that elevator will never stop at the floor
 * if any floor button is pressed.
 *
 * @param elevator - the object of elevator, which contains information about pressed floors,
 * current floor, loadFactor, capacity, etc.
 * @param passengerTimingsMap - the mapping object. Keys is number of floor, where certain passengers will go out.
 * Values are time, when those passengers pressed button to call the elevator. It can help to understand the total
 * waiting time and make appropriate decisions.
 * @param loadThreshold - is upper bound of elevator's loading. If elevator is loaded more than {loadThreshold} it won't
 * stop at the floor to pick up some passengers.
 * @param timeThreshold - is upper bound of waiting time. If there is any passenger, which is waiting more than
 * {timeThreshold} (from the moment when the button on the floor was pressed to call elevator), elevator won't stop
 * at the floor. {timeThreshold} measures in milliseconds.
 * @returns {boolean} true if elevator should stop
 *                    false if elevator should pass the floor.
 */
ElevatorStrategy.prototype._stopAtTheFloor = function(elevator, passengerTimingsMap, loadThreshold, timeThreshold) {
    return (elevator.loadFactor() <= loadThreshold) && maxWaitingTime() <= timeThreshold;
    function maxWaitingTime() {
        var now = new Date();
        var maxWaitingTime = Number.MAX_VALUE;
        for (var key in passengerTimingsMap) {
            if (!passengerTimingsMap.hasOwnProperty(key)) {
                continue;
            }
            var waitingTime = passengerTimingsMap[key] - now;
            if (waitingTime > maxWaitingTime) {
                maxWaitingTime = waitingTime;
            }
        }
        return maxWaitingTime;
    }
};

function MinimumMovesStrategy() {

}
MinimumMovesStrategy.prototype = Object.create(ElevatorStrategy.prototype);

function MinimumWaitingTimeStrategy() {

}
MinimumWaitingTimeStrategy.prototype = Object.create(ElevatorStrategy.prototype);
function MaximumPassengersPerTimeStrategy() {

}
MaximumPassengersPerTimeStrategy.prototype = Object.create(ElevatorStrategy.prototype);
function BalancedStrategy() {

}
BalancedStrategy.prototype = Object.create(ElevatorStrategy.prototype);
/*
goToNextFloorInQueue: function () {
    var floorNum = extractNextFloor.bind(this)();
    if (floorNum == -1) {
        return false;
    }
    this.destinationFloor = floorNum;
    LOGGER.trace(this, "move to new passenger");
    this.goToDestinationFloor();
    return true;
}
,
//after destinationFloor
showFutureDirection: function () {
    var nextPressedFloors = getNextPressedFloors(this);
    //Якщо після DestinationFloor нема куди по плану рухатись, то можемо рухатись в будь-якому напрямку
    if (nextPressedFloors.length == 0) {
        log(this, "TwoDirections is set");
        this.setGoingInTwoDirections();
        return;
    }
    var nextPressedFloorToMove = figureFloorToMove(nextPressedFloors, this.destinationFloor);
    log(this, "nextFloors: " + nextPressedFloorToMove);
    var direction = figureDirection(this.destinationFloor, nextPressedFloorToMove);
    log(this, "direction " + direction + " is set");
    this.setGoingDirections(direction);
}
,
goToNextFloorInQueue: function () {
    var floorNum = extractNextFloor.bind(this)();
    if (floorNum == -1) {
        return false;
    }
    this.destinationFloor = floorNum;
    log(this, "move to new passanger");
    this.goToDestinationFloor();
    return true;
}
,
goToDestinationFloor: function () {
    if (this.destinationFloor != -1) {
        var index = floorsQueue.indexOf(this.destinationFloor);
        if (index != -1) {
            floorsQueue.splice(index, 1);
        }
        this.goToFloor(this.destinationFloor);
        log(this, "elevator is going to " + this.destinationFloor);
        this.showFutureDirection();
    }
}
,
moveToNextPressedFloor: function () {
    //якщо кнопки нажаті (хтось є в ліфті)
    log(this, "number of pressed floors: " + this.getPressedFloors().length);
    if (this.getPressedFloors().length != 0) {
        //Складаємо масив поверхів, куди дальше можна рухатись.
        var currentFloor = this.currentFloor();
        var floorsToMove = this.getPressedFloors().filter(function (floorNum) {
            return floorNum != currentFloor;
        });
        //Вичисляємо, куди дальше рухатись.
        this.destinationFloor = figureFloorToMove(floorsToMove, currentFloor);
        log(this, "move to next pressed button floor");
        this.goToDestinationFloor();
    }
}
,
getNextPressedFloors: function () {
    var pressedFloors = this.elevator.getPressedFloors();
    var nextPressedFloors = [];
    var upFloor;
    var downFloor;
    if (elevator.currentFloor() > this.elevator.destinationFloor) {
        upFloor = elevator.currentFloor();
        downFloor = this.elevator.destinationFloor;
    } else {
        upFloor = elevator.destinationFloor;
        downFloor = this.elevator.currentFloor();
    }
    for (var i = 0; i < pressedFloors.length; i++) {

        if (pressedFloors[i] < downFloor ||
            pressedFloors[i] > upFloor) {

            nextPressedFloors.push(pressedFloors[i]);
        }
    }
    return nextPressedFloors;
}
,
//Рахуємо, в яку сторону більше поверхів і повертаємо останній поверх у вигіднішу сторону
figureFloorToMove: function (floorsToMove, currentFloor) {
    var focusedFloor = floorsToMove[0];
    floorsToMove.sort(function (floor1, floor2) {
        return floor1 > floor2;
    });
    /!*
     for (var i = 0; i < floorsToMove.length; i++) {
     if (floorsToMove[i] > currentFloor) {
     break;
     }
     }
     var floorsToMoveUpFromCurrent = floorsToMove.length - i;
     var floorsToMoveDownFromCurrent = i;
     if (floorsToMoveUpFromCurrent > floorsToMoveDownFromCurrent) {
     return floorsToMove[floorsToMove.length - 1];
     } else {
     return floorsToMove[0];
     }*!/
    var minFloor = floorsToMove[0];
    var maxFloor = floorsToMove[floorsToMove.length - 1];
    if (focusedFloor < currentFloor) {
        return minFloor;
    } else {
        return maxFloor;
    }
}*/
