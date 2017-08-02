function ElevatorsControlSystem(elevators, floors, controlSystemStrategy, typeOfElevatorStrategy) {
    var LOGGER = new Logger();
    LOGGER.level = "debug";
    /* default strategy resolver */
    var strategyResolver = {
        resolveStrategy: function (strategyType) {
            return resolveStrategy(strategyType);
        }
    };
    var elevatorsControlSystem = this;
    var floorsQueueUp = [];
    var floorsQueueDown = [];
    var elevatorsControlModules = [];
    var floorUpButtonsTimeMapping = {};
    var floorDownButtonsTimeMapping = {};

    initElevatorsSystem(elevators);

    /** Elevator's controlModule uses this service, when there is no passengers and it's idle.
     * Receive number of the floor, where the passenger is waiting for elevator. By calling this method,
     * elevator obligates himself to go to the returned number of floor. (This floor will be deleted from common queue).
     * @param elevator - object of elevator. It maybe useful to know the number of current floor
     *        to decide which floor to return
     * @returns {Number} of the floor (where to pick up the passenger).
     *          If there is no floor with passenger, returns {null}.
     */
    this.getTheFloorWithPassengers = function (elevator) {
        var floors = uniqueArray(floorsQueueUp.concat(floorsQueueDown));
        if (floors.length == 0) {
            return null;
        }
        var orderedFloors = controlSystemStrategy.sortFloors(floors, elevator, leastFloorButtonsTimeMapping());
        for (var i = 0; i < orderedFloors.length; i++) {
            var floorNum = orderedFloors[i];
            var direction = getFloorDirection(floorNum);
            if (!willAnyElevatorBeAtTheFloorSoon(floorNum, direction)) {
                deleteFloorFromQueue(floorNum, floorsQueueUp);
                deleteFloorFromQueue(floorNum, floorsQueueDown);
                return floorNum;
            }
        }
        return null;
        function willAnyElevatorBeAtTheFloorSoon(floorNum, direction) {
            for (var i = 0; i < elevatorsControlModules.length; i++) {
                if (elevatorsControlModules[i].pickUpThePassengersIfCan(floorNum, direction)) {
                    return true;
                }
            }
            return false;
        }
        function getFloorDirection(floorNum) {
            var up = floorsQueueUp.indexOf(floorNum) != -1;
            var down = floorsQueueDown.indexOf(floorNum) != -1;
            if (up && down) {
                return "both";
            }
            if (up) {
                return "up";
            }
            if (down) {
                return "down";
            }
        }
        function uniqueArray(floors) {
            var newArray = [];
            var map = {};
            floors.forEach(function (item) {
                if (map[item] == null) {
                    newArray.push(item);
                }
            });
            return newArray;
        }
    };
    /** Elevator use this service to decide, whether to stiop at the floor.
     * Get if any passenger waiting at the floor
     * @param floorNum - is number of the floor.
     * @param direction - is the direction, in which elevator is going
     * @returns {boolean} true, if there is any passenger which waits for elevator in appropriate direction
     *                    false in other cases.
     */
    this.isAnyPassengerToPickUp = function (floorNum, direction) {
        return (direction == "up" && floorsQueueUp.indexOf(floorNum) != -1)
            || (direction == "down" && floorsQueueDown.indexOf(floorNum) != -1);
    };
    /**
     * Elevator use this service to notify that it will stop at the floor {floorNum} and pick up passengers in
     * certain direction.
     *
     * @param floorNum - is number of the floor.
     * @param direction - is the direction, in which elevator is going
     * @returns {boolean} true, if there is any passenger which waits for elevator in appropriate direction
     *                    false in other cases.
     */
    this.passengersWillBePickedUp = function (floorNum, direction) {
        switch (direction) {
            case "up" : {
                var index = floorsQueueUp.indexOf(floorNum);
                deleteFloorFromQueue(floorNum, floorsQueueUp);
                return index != -1;
            }
            case "down" : {
                index = floorsQueueDown.indexOf(floorNum);
                deleteFloorFromQueue(floorNum, floorsQueueDown);
                return index != -1;
            }
            default : {
                var indexUp = floorsQueueUp.indexOf(floorNum);
                var indexDown = floorsQueueDown.indexOf(floorNum);
                deleteFloorFromQueue(floorNum, floorsQueueUp);
                deleteFloorFromQueue(floorNum, floorsQueueDown);
                return indexUp != -1 || indexDown != -1;
            }
        }
    };
    /**
     * To receive the time, when the button was pressed. It helps to understand approximately how long passenger waits.
     * @param floorNum - number of the floor, where button was pressed
     * @param direction - identifies the button (up or down).
     *        by default, the latest time is returned.
     * @returns {Date} when the button was pressed.
     */
    this.getDateOfTheButtonPressure = function (floorNum, direction) {
        switch (direction) {
            case "up" : return floorUpButtonsTimeMapping[floorNum];
            case "down" : return floorDownButtonsTimeMapping[floorNum];
            default : {
                var lastTimeDownButtonWasPressed = floorDownButtonsTimeMapping[floorNum];
                var lastTimeUpButtonWasPressed = floorUpButtonsTimeMapping[floorNum];
                return (lastTimeDownButtonWasPressed > lastTimeUpButtonWasPressed) ? lastTimeUpButtonWasPressed : lastTimeDownButtonWasPressed;
            }
        }
    };

    function deleteFloorFromQueue(floor, floorsQueue) {
        var index = floorsQueue.indexOf(floor);
        while (index >= 0) {
            floorsQueue.splice(index, 1);
            index = floorsQueue.indexOf(floor);
        }
    }

    /**
     * Changes the strategy of all elevators at runtime if strategyResolver can resolve type of strategy.
     * @param newTypeOfStrategy
     */
    this.changeTypeOfStrategy = function (newTypeOfStrategy) {
        typeOfElevatorStrategy = newTypeOfStrategy;
        var elevatorStrategy = strategyResolver.resolveStrategy(typeOfElevatorStrategy);
        if (elevatorStrategy == null) {
            return;
        }
        for (var i = 0; i < elevatorsControlModules.length; i++) {
            var controlModule = elevatorsControlModules[i];
            controlModule.changeStrategy(elevatorStrategy);
        }
    };
    /**
     * Set new strategy resolver. This method changes strategy resolving at runtime.
     * It may be useful when new type of strategies have appeared.
     * @param newStrategyResolver
     */
    this.changeStrategyResolver = function (newStrategyResolver) {
        strategyResolver = newStrategyResolver;
    };
    /**
     * initialization of system. Creating controlModules to interact with central system, defining their behaviour.
     * Binding floors event.
     */
    function initElevatorsSystem() {
        var elevatorStrategy = strategyResolver.resolveStrategy(typeOfElevatorStrategy);
        if (elevatorStrategy == null) {
            elevatorStrategy = new ElevatorStrategy();
        }
        for (var i = 0; i < elevators.length; i++) {
            var elevator = elevators[i];
            elevator.elevator_id = i + 1;

            elevatorsControlModules.push(
                new ControlModule(elevatorsControlSystem, elevatorStrategy, elevator, floors.length));
        }
        for (i = 0; i < floors.length; i++) {
            bindFloorEvents(floors[i]);
        }
    }

    /**
     * Binds handlers to events.
     * @param floor - is object of floor, to which event handlers are bound.
     */
    function bindFloorEvents(floor) {
        floor.on("up_button_pressed", function() {
            floorsQueueUp.push(floor.floorNum());
            floorUpButtonsTimeMapping[floor.floorNum()] = new Date();
        });
        floor.on("down_button_pressed", function() {
            floorsQueueDown.push(floor.floorNum());
            floorDownButtonsTimeMapping[floor.floorNum()] = new Date();
        });
    }
    /**
     * Get strategy by type.
     *
     * default implementation of strategy resolving
     *
     * @param typeOfStrategy
     * @returns {ElevatorStrategy}
     */
    function resolveStrategy(typeOfStrategy) {
        var strategy = null;
        switch (typeOfStrategy) {
            case "":
        }
        return strategy;
    }

    /**
     * Merges two floor button time maps (the oldest date remains).
     */
    function leastFloorButtonsTimeMapping() {
        var mergedTimeMap = {};
        for (var key in floorDownButtonsTimeMapping) {
            if (!floorDownButtonsTimeMapping.hasOwnProperty(key)) {
                continue;
            }
            mergedTimeMap[key] = floorDownButtonsTimeMapping[key];
        }
        for (key in floorUpButtonsTimeMapping) {
            if (!floorUpButtonsTimeMapping.hasOwnProperty(key)) {
                continue;
            }
            if (mergedTimeMap[key] == null || floorUpButtonsTimeMapping[key] < mergedTimeMap[key]) {
                mergedTimeMap[key] = floorUpButtonsTimeMapping[key];
            }
        }
    }
}