(function () {
    function Mutation (callback) {
        this.isCalled = false;
        this.isUnbound = false;
        this.callback = callback;
        this.events = ['DOMAttrModified', 'DOMNodeInserted', 'DOMNodeRemoved', 'DOMCharacterDataModified', 'DOMSubtreeModified'];
        this.bind();
    }
    Mutation.prototype.bind = function () {
        this.events.forEach(function (name) {
            document.body.addEventListener(name, this, true);
        }.bind(this));
    };
    Mutation.prototype.handleEvent = function () {
        this.isCalled = true;
        this.unbind();
    };
    Mutation.prototype.unbind = function () {
        if (this.isUnbound) {
            return;
        }
        this.events.forEach(function (name) {
            document.body.removeEventListener(name, this, true);
        }.bind(this));
        this.isUnbound = true;
    };

    function Synchronizetion () {
        this._setTimeout = window.setTimeout;
        this._requestAnimationFrame = window.requestAnimationFrame;
        this._Promise = window.Promise;
        this.isRestoration = false;
        this.calledPromise = false;
        window.requestAnimationFrame = window.setTimeout = function (callback) {
            callback();
        };
        window.Promise = function () {
            this._Promise.apply(this, arguments);
            this.calledPromise = true;
            window.Promise = this._Promise;
        };
    }
    Synchronizetion.prototype.restore = function () {
        if (this.isRestoration) {
            return;
        }
        window.setTimeout = this._setTimeout;
        window.requestAnimationFrame = this._requestAnimationFrame;
        if (this.calledPromise) {
            window.Promise = this._Promise;
        }
        this.isRestoration = true;
    };

    function EventHandler (event) {
        this.event = event;
        this.event.stopPropagation();
        this.event.stopImmediatePropagation();
        this.createEvent();
        this.isCanceled = this.newEvent.defaultPrevented;
    }
    EventHandler.prototype.createEvent = function () {
        var target = this.event.target;
        this.newEvent = target.ownerDocument.createEvent('MouseEvents');
        this.newEvent.initMouseEvent(this.event.type, this.event.bubbles, this.event.cancelable,
            target.ownerDocument.defaultView, this.event.detail,
            this.event.screenX, this.event.screenY, this.event.clientX, this.event.clientY,
            this.event.ctrlKey, this.event.altKey, this.event.shiftKey, this.event.metaKey,
            this.event.button, this.event.relatedTarget
        );
    };
    EventHandler.prototype.fire = function () {
        var target = this.event.target;
        target.dispatchEvent(this.newEvent);
        this.isCanceled = this.newEvent.defaultPrevented;
    };

    window.addEventListener('contextmenu', handleEvent, true);
    function handleEvent (event) {
        var handler = new EventHandler(event);

        window.removeEventListener(event.type, handleEvent, true);
        var sync = new Synchronizetion();
        var mutation = new Mutation(function () {
            sync.restore();
        });

        handler.fire();

        sync.restore();
        mutation.unbind();
        window.addEventListener(event.type, handleEvent, true);

        if (handler.isCanceled && (mutation.isCalled || sync.calledPromise)) {
            event.preventDefault();
        }
    }
})();