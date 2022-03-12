interface CursorStateChangeEvent {
    detail: {
        visibility: any;
    }
}

V.component('[data-keyboard-navigation]', {

    /**
     * Keys mapping
     * @var {Object}
     */
    keys: {
        STOP: 413,
        PAUSE: 19,
        PLAY: 415,
        OK: 13,
        FORWARD: 417,
        BACKWARD: 412,
        BACK: 461,
        RIGHT: 39,
        LEFT: 37,
        UP: 38,
        DOWN: 40,
        INFO: 457,
        TAB: 9,
        SPACE: 32,
        BACKSPACE: 8,
        DELETE: 46
    },

    /**
     * Find on parent elements the closest available navigable element
     * @param direction
     * @param element
     * @param parent
     * @returns
     */
    findClosestOnParents: function (direction: string, element: HTMLElement, parent: HTMLElement): any {

        var self = this;
        var items = [];
        var closest = null;

        while (parent && closest == null) {
            items = Array.from(V.$$('[tabindex]', parent));
            closest = self.findClosest(direction, element, items);
            parent = parent.parentElement;
        }

        return closest;
    },

    /**
     * Find next/closest available navigable element
     * @param direction
     * @param element
     * @param items
     * @returns
     */
    findClosest: function (direction: string, element: HTMLElement, items: Array<any>): any {

        var self = this;
        var matches = [];
        var current = self.getPosition(element);

        // Find matches
        items.forEach(function (itemElement) {

            if (itemElement === element) {
                return;
            }

            var item = self.getPosition(itemElement);

            // Item not visible in document
            if (item.width == 0 || item.height == 0) {
                return;
            }

            var diff: number;

            if (direction == 'up') {
                if (item.top < current.top) {
                    diff = current.top - item.top;
                }
            } else if (direction == 'down') {
                if (item.top > current.bottom) {
                    diff = item.top - current.bottom;
                }
            } else if (direction == 'left') {
                if (item.right < current.left) {
                    diff = current.left - item.right;
                }
            } else if (direction == 'right') {
                if (item.left > current.right) {
                    diff = item.left - current.right;
                }
            }

            if (diff !== undefined) {
                matches.push({
                    element: itemElement,
                    diff: diff,
                    xDiff: Math.abs(current.top - item.top),
                    yDiff: Math.abs(current.left - item.left)
                });
            }
        });

        // Sort elements
        matches = matches.sort(function (a, b) {
            return (a.diff + a.xDiff + a.yDiff) - (b.diff + b.xDiff + b.yDiff);
        });

        return (matches.length) ? matches[0].element : null;
    },

    /**
     * Find the next TAB stop element respecting only [tabindex]
     * @param direction
     * @param element
     * @returns
     */
    findTabStopElement: function (direction: string, element: HTMLElement): HTMLElement {

        var items = Array.from(V.$$('[tabindex]', undefined));
        var index: number;

        items = items.filter(function (item: HTMLElement) {
            return item.offsetWidth > 0
                || item.offsetHeight > 0
                || item === element;
        });

        index = items.indexOf(element);
        index = (direction == 'next') ? index + 1 : index - 1;

        return (items[index] || items[0]) as HTMLElement;
    },

    /**
     * Retrieve the position of an element
     * @param element
     * @returns
     */
    getPosition: function (element: HTMLElement): object {

        var rect = element.getBoundingClientRect();
        var style = window.getComputedStyle(element);
        var margin = {
            left: parseInt(style['margin-left']),
            right: parseInt(style['margin-right']),
            top: parseInt(style['margin-top']),
            bottom: parseInt(style['margin-bottom'])
        };
        var padding = {
            left: parseInt(style['padding-left']),
            right: parseInt(style['padding-right']),
            top: parseInt(style['padding-top']),
            bottom: parseInt(style['padding-bottom'])
        };
        var border = {
            left: parseInt(style['border-left']),
            right: parseInt(style['border-right']),
            top: parseInt(style['border-top']),
            bottom: parseInt(style['border-bottom'])
        };

        var left = rect.left - margin.left;
        var right = rect.right - margin.right - padding.left - padding.right;
        var top = rect.top - margin.top;
        var bottom = rect.bottom - margin.bottom - padding.top - padding.bottom - border.bottom;
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;

        return {
            left: left,
            right: right,
            top: top,
            bottom: bottom,
            width: width,
            height: height
        };
    },

    /**
     * On mount
     */
    onMount: function () {

        var self = this;
        self.lastKey = null;
        self.lastKeyTime = null;
        self.activeElement = null;
        self.usingMouse = false;

        // Mouse events
        var handleMouse = function () {

            if (self.usingMouse) {
                document.body.classList.add('mouse');
            } else {
                document.body.classList.remove('mouse');
            }

            if (!self.activeElement) {
                return;
            }

            if (self.usingMouse) {
                self.activeElement.classList.remove('hover');
            } else {
                self.activeElement.classList.add('hover');
            }

        }

        V.on(document, 'cursorStateChange', function (e: CursorStateChangeEvent) {
            self.usingMouse = e.detail.visibility;
            handleMouse();
        }, undefined);

        V.on(document, 'mouseenter mousemove', function () {
            self.usingMouse = true;
            handleMouse();
        }, undefined);

        V.on(document, 'mouseleave', function () {
            self.usingMouse = false;
            handleMouse();
        }, undefined);

        // Keyboard Events
        var keys = Object.keys(self.keys).map(function(i) {
            return self.keys[i];
        });

        V.on(window, 'keydown', function (e: KeyboardEvent) {
            if (keys.indexOf(e.key) !== -1
                && self.handleKeyPress(e)) {
                e.preventDefault();
            }
        }, undefined);

        // Public
        window.setActiveElement = function (element: any) {
            return self.setActiveElement(element);
        };

        window.getActiveElement = function () {
            return self.activeElement;
        };

    },

    /**
     * Set the current active element for navigation
     * @param element
     */
    setActiveElement: function (element: HTMLElement) {

        if (this.activeElement) {
            this.activeElement.classList.remove('hover');
            this.activeElement.blur();
        }

        if (!element) {
            element = V.$('#content .list-item', undefined);
        }
        if (!element) {
            element = V.$('#menu .links a', undefined);
        }

        if (element) {
            element.scrollIntoView();
            element.classList.add('hover');

            if (element.nodeName !== 'INPUT') {
                element.focus();
            }

            this.activeElement = element;
        }

    },

    /**
     * Handle key press
     * @param event
     * @returns
     */
    handleKeyPress: function (event: KeyboardEvent): boolean {

        var self = this;
        var body = document.body;
        var videoActive = body.classList.contains('page-video');
        var result: boolean;

        if (videoActive) {
            result = self.handleKeyOnVideo(event);
        } else {
            result = self.handleKeyNavigation(event);
        }

        self.lastKey = event.key;
        self.lastKeyTime = new Date();

        return result;
    },

    /**
     * Handle key press for navigation
     * @param event
     * @returns
     */
    handleKeyNavigation: function (event: KeyboardEvent): boolean {

        var self = this;
        var keys = self.keys;
        var current = self.activeElement;
        var key = event.key;

        if (!current) {
            return;
        }

        var directions = {};
        directions[keys.RIGHT] = 'right';
        directions[keys.LEFT] = 'left';
        directions[keys.UP] = 'up';
        directions[keys.DOWN] = 'down';

        // OK / INFO / SPACE
        if (key == keys.OK
            || key == keys.INFO
            || key == keys.SPACE) {

            if (current && current.classList.contains('dropdown')) {
                V.trigger(current, 'click', '.dropdown-value');
            } else if (current && current.nodeName == 'INPUT') {
                current.focus();
            } else if (current) {
                V.trigger(current, 'click', undefined);
            }

            return true;

        // TAB
        } else if (key == keys.TAB) {

            var next = self.findTabStopElement(
                (event.shiftKey) ? 'prev' : 'next',
                current
            );

            if (next != null) {
                self.setActiveElement(next);
            }

            return true;

        // RIGHT / LEFT / UP / DOWN
        } else if (directions[key]) {

            var closest = self.findClosestOnParents(
                directions[key],
                current,
                current.parentElement
            );

            if (closest != null) {
                self.setActiveElement(closest);
            }

            return true;
        }

        return false;
    },

    /**
     * Handle key press specific to video
     * @param event
     * @returns
     */
    handleKeyOnVideo: function (event: KeyboardEvent): boolean {

        var self = this;
        var keys = self.keys;
        var key = event.key;

        // STOP
        if (key == keys.STOP) {
            window.stopVideo();
            return true;

        // PAUSE
        } else if (key == keys.PAUSE) {
            window.pauseVideo();
            return true;

        // PLAY
        } else if (key == keys.PLAY) {
            window.playVideo();
            return true;

        // OK / SPACE
        } else if (key == keys.OK
            || key == keys.SPACE) {
            window.toggleVideo();
            return true;

        // FORWARD
        } else if (key == keys.FORWARD) {
            window.forwardVideo(1);
            return true;

        // BACKWARD
        } else if (key == keys.BACKWARD) {
            window.backwardVideo(1);
            return true;

        // RIGHT
        } else if (key == keys.RIGHT) {
            window.forwardVideo(10);
            return true;

        // LEFT
        } else if (key == keys.LEFT) {
            window.backwardVideo(10);
            return true;

        // BACK
        } else if (key == keys.BACK
            || key == keys.BACKSPACE
            || key == keys.DELETE) {
            window.pauseVideo();
            return true;

        // UP (behavior as left navigation)
        // DOWN (behavior as right navigation)
        } else if (key == keys.UP
            || key == keys.DOWN) {

            var current = self.activeElement;
            var parent = self.element;

            var closest = self.findClosestOnParents(
                (key == keys.UP) ? 'left' : 'right',
                current,
                parent
            );

            if (closest != null) {
                self.setActiveElement(closest);
            }

            return true;
        }

        return false;
    }

});