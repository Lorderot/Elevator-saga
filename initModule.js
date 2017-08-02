function Logger() {
    this.level = "trace";
    this.trace = function () {
        if (this.level == "trace") {
            log(arguments);
        }
    };
    this.debug = function () {
        if (this.level == "debug") {
            log(arguments);
        }
    };
    function format(loggingArguments) {
        var counter = 0;
        return loggingArguments[0].replace(/%s/g, function (match, number) {
            counter++;
            return typeof loggingArguments[counter] != 'undefined' ? loggingArguments[counter] : match;
        })
    }
    function log(loggingArguments) {
        if (loggingArguments != null && typeof loggingArguments[0] === 'string') {
            console.log(this.format(loggingArguments));
        } else {
            console.log(loggingArguments);
        }
    }
}
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