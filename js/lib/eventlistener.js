var EventListener = function() {
    this.events = []; // Empty list of events/actions
}

EventListener.prototype.on = function(event, fn) {
    this.events[event] = this.events[event] || [];
    this.events[event].push(fn);
}

EventListener.prototype.off = function(event, fn) {
    if (this.events[event] && this.events[event].indexOf(fn) > -1) {
        this.events[event].splice(this.events[event].indexOf(fn), 1);
    }
}

EventListener.prototype.trigger = function(event) {
    if (this.events[event]) {
    var args = Array.from(arguments);
    this.events[event].forEach(function(fn) {
        fn.apply(null, args);
    })
    }
}