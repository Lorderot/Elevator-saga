/**
 *
 * @param elevatorsControlSystem - the injected object of outer system, which controls elevators
 * @param strategy - the injected strategy, which defines elevator behaviour
 * @param elevator - the elevator which is controlled by this module
 * @param maximumFloors - number of the floors in the elevator
 */
function ControlModule(elevatorsControlSystem, strategy, elevator, maximumFloors) {
    var LOGGER = new Logger();
    LOGGER.level = new DEBUG();
    /* Time to sleep, when elevator is waiting*/
    var idleTime = 100;
    /*Module initialization*/
    init();
    /**
     * Set another elevator to be controlled by this module
     * @param newElevator
     */
    this.changeElevator = function (newElevator) {
        elevator = newElevator;
    };
    /**
     * Set another controlSystem to interact with this module
     * @param controlSystem
     */
    this.changeControlSystem = function (controlSystem) {
        elevatorsControlSystem = controlSystem;
    };
    /**
     * Set periodic time to checkout any chanegs while elevator is in idle mode.
     * @param newIdleTime
     */
    this.changeIdleTime = function (newIdleTime) {
        idleTime = newIdleTime;
    };
    /**
     * Set new strategy, which defines the module behaviour.
     * @param newStrategy
     */
    this.changeStrategy = function (newStrategy) {
        strategy = newStrategy;
    };
    /**
     *  The mapping of the floor, where passenger should be delivered and (approximate) time,
     *  when the user started waiting for elevator
     */
    var passengerTimingsMap = {};
    /**
     * Elevator immediately starts moving to the floor {floorNum} and then continue with its schedule
     * @param floorNum - number of the floor
     */
    this.forcefullyGoAtTheFloor = function (floorNum) {
        forcefullyGoAtTheFloor(floorNum);
    };
    /**
     * Elevator immediately stops at the current floor
     */
    this.forcefullyStopAtTheFloor = function () {
        forcefullyStopAtTheFloor();
    };
    /**
     * Calling this method can reschedule elevator. If elevator has that floor in destination queue true will be returned.
     * If elevator does have this floor in destination, but control module decides that elevator will be able
     * to pick up some passenger, true value will be returned and floor will be added to schedule.
     * @param floorNum the number of the floor
     * @param direction is the direction, where passengers need to move
     * @returns {boolean} return true if elevator will pick up the passenger
     *          and false otherwise
     */
    this.pickUpThePassengersIfCan = function (floorNum, direction) {
        var goingDirection = elevator.destinationDirection();
        if (goingDirection != "stopped" && goingDirection != direction) {
            return false;
        }
        var pressedFloors = elevator.getPressedFloors();
        if (pressedFloors.length == 0 || (isTheFloorOnTheWay(floorNum)
            && strategy.stopAtTheFloorToPickPassengersUp(elevator, passengerTimingsMap))) {
            forcefullyGoAtTheFloor(floorNum);
            return true;
        }
        return false;
        function isTheFloorOnTheWay(floorNum) {
            pressedFloors.sort(function (floor1, floor2) {
                return floor1 > floor2;
            });
            var theHighestPressedFloor = pressedFloors[pressedFloors.length - 1];
            var theLowestPressedFloor = pressedFloors[0];
            var currentFloor = elevator.currentFloor();
            return (currentFloor <= floorNum && floorNum <= theHighestPressedFloor) ||
                (currentFloor >= floorNum && floorNum >= theLowestPressedFloor);
        }
    };
    /**
     * Elevator initialization. Event bindings.
     */
    function init() {
        elevator.on("idle", onIdleEvent);
        elevator.on("floor_button_pressed", onFloorButtonPressedEvent);
        elevator.on("passing_floor", onPassingFloorEvent);
        elevator.on("stopped_at_floor", onStoppedAtFloorEvent);
    }
    /**
     * The "floor button pressed" event handler.
     * @param floorNum is number of the floor
     */
    function onFloorButtonPressedEvent(floorNum) {
        var buttonPressureDate = elevatorsControlSystem.getDateOfTheButtonPressure(floorNum, getIndicatorDirection());
        if (passengerTimingsMap[floorNum] == null) {
            passengerTimingsMap[floorNum] = buttonPressureDate;
        }
        /* Fires idle event if elevator is waiting */
        if (elevator.destinationQueue.length == 0) {
            onIdleEvent();
        }
    }

    /**
     * The "passing floor" event handler.
     * @param floorNum is number of the floor
     * @param direction is the direction, in which elevator is moving
     */
    function onPassingFloorEvent(floorNum, direction) {
        if (decideWhetherToStopElevatorToLetPassengersToExitAtTheFloor(floorNum) ||
            decideWhetherToStopElevatorToPickSomePassengersUp(floorNum, direction)) {
            forcefullyGoAtTheFloor(floorNum);
            elevatorsControlSystem.passengersWillBePickedUp(floorNum, direction);
        }
    }
    /**
     * * The "stopped at the floor" event handler.
     * @param floorNum is number of the floor
     */
    function onStoppedAtFloorEvent(floorNum) {
        LOGGER.debug("Elevator #%s: stopped at floor %s. Up to now next floor is %s",
            elevator.elevator_id, floorNum, elevator.destinationQueue[0]);
        if (elevator.destinationQueue.length == 0) {
            var floorNumber = strategy.getTheFloorToMove(elevator, passengerTimingsMap);
            if (floorNumber != null) {
                goToFloor(floorNumber);
            } else {
                setGoingDirection();
            }
        }
    }
    /**
     * Wait for passengers
     */
    function onIdleEvent() {
        function waitForPassengers() {
            setTimeout(onIdleEvent, idleTime);
        }

        /* in idle mode, turns on all the indicator. The elevator can mode in all directions */
        setGoingDirection("both");
        /**
         * If any button is pressed (that means some passengers have already come into), elevator shouldn't wait anymore
         */
        if (elevator.loadFactor() != 0) {
            var floorNumber = strategy.getTheFloorToMoveFromIdle(elevator);
            if (floorNumber != null) {
                goToFloor(floorNumber);
                LOGGER.debug("Elevator #%s: passenger came in. Elevator is going to move to the %s floor",
                    elevator.elevator_id, floorNumber);
            }
            return;
        }
        /**
         * Asks control system for new destination - the floor with waiting passengers.
         * If there is no such floor, then continue waiting.
         */
        var numberOfFloorWithPassengers = elevatorsControlSystem.getTheFloorWithPassengers(elevator);
        if (numberOfFloorWithPassengers != null) {
            LOGGER.debug("Elevator #%s: control system has already give new destination. Floor #%s",
                elevator.elevator_id, numberOfFloorWithPassengers);
            goToFloor(numberOfFloorWithPassengers);
        } else {
            LOGGER.debug("Elevator #%s: is waiting", elevator.elevator_id);
            waitForPassengers();
        }
    }
    function forcefullyGoAtTheFloor(floorNum) {
        LOGGER.debug("Elevator #%s: is force to go to floor %s", elevator.elevator_id, floorNum);
        var currentQueue = elevator.destinationQueue;
        elevator.destinationQueue = [];
        goToFloor(floorNum);
        currentQueue.unshift(floorNum);
        elevator.destinationQueue = currentQueue;
        elevator.checkDestinationQueue();
    }
    function forcefullyStopAtTheFloor(floorNum) {
        elevator.destinationQueue = [];
        elevator.checkDestinationQueue();
    }
    /**
     * Move elevator to the floor with number {floorNum}. And notify ControlSystem, that elevator is going to this floor.
     * Maybe its better try to predict the direction after arriving.
     * @param floorNum - number of floor to go.
     */
    function goToFloor(floorNum) {
        elevator.goToFloor(floorNum);
        var movingDirection = getGoingDirection();
        LOGGER.debug("Elevator #%s: moves to floor %s. Direction: %s", elevator.elevator_id, floorNum, movingDirection);
        setGoingDirection(movingDirection);
        var nextGoingDirection = strategy.getNextGoingDirection(elevator, maximumFloors);
        elevatorsControlSystem.passengersWillBePickedUp(floorNum, nextGoingDirection);
    }
    /**
     * Handles elevator's arrows, which shows in which direction elevator is going to move.
     * Setting these arrows affect passenger behaviour when elevator is stopping at floors.
     * @param direction
     */
    function setGoingDirection(direction) {
        elevator.goingDownIndicator(true);
        elevator.goingUpIndicator(true);
        switch (direction) {
            case "up": {
                elevator.goingDownIndicator(false);
                return;
            }
            case "down": {
                elevator.goingUpIndicator(false);
                return;
            }
        }
    }
    /**
     * To receive indicator direction.
     * @returns {string} according to set indicators "up"  or "down"  or "both"
     */
    function getIndicatorDirection() {
        var isGoingUp = elevator.goingUpIndicator();
        var isGoingDown = elevator.goingDownIndicator();
        if (isGoingUp && isGoingDown) {
            return "both";
        }
        if (isGoingDown) {
            return "down";
        }
        if (isGoingDown) {
            return "up";
        }
        return "";
    }

    /**
     * To receive direction in which elevator is moving or is going to move.
     * (base on destinationQueue)
     *
     * @returns {string} "up" if destination floor is above current
     *                   "down" if destination floor is under current
     */
    function getGoingDirection() {
        var currentFloor = elevator.currentFloor();
        var destination = elevator.destinationQueue[0];
        if (destination == null) {
            return "";
        }
        return (destination > currentFloor) ? "up" : "down";
    }
    /**
     * @param floorNum is number of the floor
     * @returns {boolean} if the button which indicates floor {floorNum} is pressed in the elevator
     */
    function isTheFloorButtonPressed(floorNum) {
        return elevator.getPressedFloors().indexOf(floorNum) != -1;
    }

    /**
     * Making decision where to stop elevator for letting passengers go out.
     * @param floorNum - number of the floor.
     * @returns true, if elevator should be stopped
     *          false, otherwise
     */
    function decideWhetherToStopElevatorToLetPassengersToExitAtTheFloor(floorNum) {
        var isButtonPressed = isTheFloorButtonPressed(floorNum);
        var decision = isButtonPressed
            && strategy.stopAtTheFloorToLetPassengerGoOut(elevator, passengerTimingsMap);
        if (isButtonPressed) {
            LOGGER.info("Elevator #%s: strategy decision to let passengers out: %s", elevator.elevator_id, decision);
        }
        return decision;
    }
    /**
     * Making decision where to stop elevator for picking some passenger up
     * @param floorNum - number of the floor
     * @param direction - the direction, in which elevator is moving to the floor
     * @returns true, if elevator should be stopped
     *          false, otherwise
     */
    function decideWhetherToStopElevatorToPickSomePassengersUp(floorNum, direction) {
        var isAnyPassengerToPickup = elevatorsControlSystem.isAnyPassengerToPickUp(floorNum, direction);
        LOGGER.debug("Elevator #%s: is any passenger to pick up? floor: %s, direction: %s. Answer: %s",
            elevator.elevator_id, floorNum, direction, isAnyPassengerToPickup);
        var decision = isAnyPassengerToPickup
            && strategy.stopAtTheFloorToPickPassengersUp(elevator, passengerTimingsMap);
        if (isAnyPassengerToPickup) {
            LOGGER.info("Elevator #%s: strategy decision to pick up passengers: %s", elevator.elevator_id, decision);
        }
        return decision;
    }
}