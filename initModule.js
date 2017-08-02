var a = {
    init: function (elevators, floors) {
        var controlSystem = new ElevatorsControlSystem(elevators, floors,
            new ControlSystemStrategy(), new ElevatorStrategy());
    },
    update: function (dt, elevators, floors) {
        // We normally don't need to do anything here
    }
};
a