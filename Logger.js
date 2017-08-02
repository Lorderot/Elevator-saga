function LoggingLevel() {
    this.level = 0;
}

LoggingLevel.prototype.getValue = function () {
    return this.level;
};

function INFO() {
    this.level = 1;
}
INFO.prototype = Object.create(LoggingLevel.prototype);

function DEBUG() {
    this.level = 2;
}
DEBUG.prototype = Object.create(LoggingLevel.prototype);

function TRACE() {
    this.level = 3;
}
TRACE.prototype = Object.create(LoggingLevel.prototype);

function ALL() {
    this.level = 4;
}
ALL.prototype = Object.create(LoggingLevel.prototype);

function Logger() {
    this.level = INFO_LEVEL;
    var INFO_LEVEL = new INFO();
    var DEBUG_LEVEL = new DEBUG();
    var TRACE_LEVEL = new TRACE();
    var ALL_LEVEL = new ALL();
    this.trace = function () {
        if (this.level.getValue() >= TRACE_LEVEL.getValue()) {
            log(arguments);
        }
    };
    this.debug = function () {
        if (this.level.getValue() >= DEBUG_LEVEL.getValue()) {
            log(arguments);
        }
    };
    this.info = function () {
        if (this.level.getValue() >= INFO_LEVEL.getValue()) {
            log(arguments);
        }
    };
    this.ALL = function () {
        if (this.level.getValue() >= ALL_LEVEL.getValue()) {
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
            console.log(format(loggingArguments));
        } else {
            console.log(loggingArguments);
        }
    }
}