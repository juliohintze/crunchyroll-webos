var V = (function (exports) {
    'use strict';

    const _hooks = [];
    function hook(event, callback) {
        if (callback === undefined) {
            return (_hooks[event]) ? _hooks[event] : [];
        }
        _hooks[event] = _hooks[event] || [];
        _hooks[event].push(callback);
    }
    function each(items, callback) {
        if (Array.isArray(items)) {
            return items.forEach(callback);
        }
        const keys = Object.keys(items);
        for (const key of keys) {
            callback(items[key], key, items);
        }
    }
    function namespaceEvent(theEvent, callback) {
        const split = theEvent.split('.');
        const event = split.shift();
        const namespace = split.join('.');
        return {
            event: event,
            namespace: namespace,
            callback: callback
        };
    }

    function getContext(context) {
        context = (typeof context === 'string') ? $(context) : context;
        context = (context instanceof Node) ? context : document;
        return context;
    }
    function $(selector, context) {
        return getContext(context).querySelector(selector);
    }
    function $$(selector, context) {
        return getContext(context).querySelectorAll(selector);
    }
    function $$$(element, context) {
        const items = [];
        if (typeof element === 'string') {
            element = $$(element, context);
        }
        if (element instanceof Window) {
            items.push(element);
        }
        if (element instanceof Document) {
            items.push(element);
        }
        if (element instanceof Element) {
            items.push(element);
        }
        if (element instanceof NodeList) {
            Array.prototype.forEach.call(element, function (item) {
                items.push(item);
            });
        }
        return items;
    }

    let _events = [];
    function _event(action, element, event, selector, callback) {
        const events = event.split(' ');
        if (events.length > 1) {
            for (let i = 0; i < events.length; i++) {
                _event(action, element, events[i], selector, callback);
            }
            return;
        }
        const items = $$$(element);
        let handler;
        if (callback === undefined) {
            handler = selector;
            selector = null;
        }
        else {
            handler = function (_event) {
                const target = _event.target.closest(selector);
                if (target) {
                    callback.apply(target, [_event]);
                }
            };
        }
        const theEvent = namespaceEvent(event, handler);
        if (action === 'add') {
            _events.push(theEvent);
            items.forEach(function (item) {
                item.addEventListener(theEvent.event, theEvent.callback.bind(item), false);
            });
        }
        else {
            _events = _events.filter(function (watcher) {
                const pass = Boolean((theEvent.event ? theEvent.event !== watcher.event : true)
                    && (theEvent.namespace ? theEvent.namespace !== watcher.namespace : true)
                    && (typeof handler === 'function' ? handler !== watcher.callback : true));
                if (!pass) {
                    items.forEach(function (item) {
                        item.removeEventListener(watcher.event, watcher.callback.bind(item), false);
                    });
                }
                return pass;
            });
        }
        return handler;
    }
    function on(element, event, selector, callback) {
        return _event('add', element, event, selector, callback);
    }
    function off(element, event, selector, callback) {
        return _event('remove', element, event, selector, callback);
    }
    function trigger(element, event, selector) {
        const items = (selector) ? $$$(selector, element) : $$$(element);
        const theEvent = new Event(event, {
            'bubbles': true,
            'cancelable': true
        });
        items.forEach(function (item) {
            item.dispatchEvent(theEvent);
        });
    }

    var __awaiter$8 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    function fakePromise() {
        return __awaiter$8(this, void 0, void 0, function* () { });
    }
    function promisify(scope, callback, data) {
        return __awaiter$8(this, void 0, void 0, function* () {
            try {
                return yield callback.apply(scope, data);
            }
            catch (error) {
                return Promise.reject(error);
            }
        });
    }
    function promises(scope, callbacks) {
        return __awaiter$8(this, void 0, void 0, function* () {
            const promises = [];
            for (let index = 0; index < callbacks.length; index++) {
                if (typeof callbacks[index] === 'function') {
                    promises.push(promisify(scope, callbacks[index]));
                }
            }
            yield Promise.all(promises);
            return scope;
        });
    }

    let _watches = [];
    function watch(theEvent, callback) {
        _watches.push(namespaceEvent(theEvent, callback));
    }
    function unwatch(theEvent, callback) {
        const event = namespaceEvent(theEvent, callback);
        _watches = _watches.filter(function (watcher) {
            return Boolean((event.event ? event.event !== watcher.event : true)
                && (event.namespace ? event.namespace !== watcher.namespace : true)
                && (event.callback !== undefined ? event.callback !== watcher.callback : true));
        });
    }
    function fire(theEvent, data) {
        const event = namespaceEvent(theEvent);
        const promises = [];
        _watches.forEach(function (watcher) {
            if ((event.event ? event.event === watcher.event : true)
                && (event.namespace ? event.namespace === watcher.namespace : true)) {
                promises.push(promisify({}, watcher.callback, [data]));
            }
        });
        return Promise.all(promises);
    }

    const _helpers = {};
    function helper(key, callback) {
        _helpers[key] = callback;
    }
    function clean(line) {
        return line
            .replace(/\s+/g, ' ')
            .replace(/^{{\s?/, '')
            .replace(/\s?}}$/, '');
    }
    function conditions(line) {
        return line
            .replace(/^if\s?(.*)$/, 'if( $1 ){')
            .replace(/^elseif\s?(.*)$/, '}else if( $1 ){')
            .replace(/^else$/, '}else{')
            .replace(/^end$/, '}');
    }
    function loops(line) {
        return line
            .replace(/^for\s?(.*)\sin\s(.*)$/, 'for( var $1 in $2 ){')
            .replace(/^each\s?(.*)\s?=>\s?(.*)\sin\s(.*)$/, 'for( var $1 in $3 ){ var $2 = $3[$1];')
            .replace(/^each\s?(.*)\sin\s(.*)$/, 'for( var _$1 in $2 ){ var $1 = $2[_$1];');
    }
    function variables(line) {
        const vars = [];
        const add = function (regex) {
            const match = line.match(regex);
            if (match) {
                vars.push(match[1]);
            }
        };
        if (line.match(/^(}|for\(|if\()/) === null) {
            add(/^([A-Za-z0-9_]+)/);
        }
        add(/^if\(\s?!?([A-Za-z0-9_]+)/);
        add(/^}else\sif\(\s?!?([A-Za-z0-9_]+)/);
        add(/&&\s?!?([A-Za-z0-9_]+)/);
        add(/\|\|\s?!?([A-Za-z0-9_]+)/);
        add(/in\s([A-Za-z0-9_]+)\s\)/);
        return vars;
    }
    function template(template, data) {
        let tagRegex = /{{([^}}]+)?}}/g;
        let parser = [];
        let cursor = 0;
        let line = '';
        let before = '';
        let after = '';
        let match;
        data = Object.assign({}, _helpers, data || {});
        each(data, function (_value, index) {
            parser.push('var ' + index + ' = this["' + index + '"];');
        });
        parser.push('var r = [];');
        while ((match = tagRegex.exec(template))) {
            line = clean(match[0]);
            line = conditions(line);
            line = loops(line);
            before = template.slice(cursor, match.index);
            cursor = match.index + match[0].length;
            parser.push('r.push(`' + before.replace(/"/g, '\\"') + '`);');
            variables(line).filter(function (value) {
                if (data[value] === undefined) {
                    parser.push('var ' + value + ';');
                }
            });
            parser.push(line.match(/^(}|{|for\(|if\()/) ? line : 'r.push(' + line + ');');
        }
        after = template.substring(cursor, cursor + (template.length - cursor));
        parser.push('r.push(`' + after.replace(/"/g, '\\"') + '`);');
        parser.push('return r.join("");');
        const code = parser.join("\n");
        try {
            const result = new Function(code.replace(/[\r\t\n]/g, '')).apply(data || {});
            return result;
        }
        catch (error) {
            console.warn('[V] template parser error:', template, error);
        }
        return null;
    }

    var __awaiter$7 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const _components = [];
    const _abstractComponent = {
        element: null,
        selector: null,
        namespace: null,
        constructor: fakePromise,
        destructor: fakePromise,
    };
    function extendComponent(definition) {
        Object.assign(_abstractComponent, definition);
    }
    function eachComponent(target, callback) {
        _components.forEach(function (declaration) {
            const items = $$$(declaration.selector, target);
            items.forEach(function (element) {
                if (element._components === undefined) {
                    element._components = {};
                }
                if (element._state === undefined) {
                    element._state = {};
                }
                callback.apply(element, [element, declaration]);
            });
        });
    }
    function component(selector, data) {
        return __awaiter$7(this, void 0, void 0, function* () {
            const component = Object.assign({}, _abstractComponent, data);
            component.selector = selector;
            if (!component.namespace) {
                component.namespace = selector.replace(/[\W_]+/g, '_');
            }
            try {
                const callbacks = [].concat([component.constructor]);
                yield promises(component, callbacks);
                _components.push(component);
            }
            catch (error) {
                console.warn('[V] Component construct error:', error);
            }
            return component;
        });
    }
    function removeComponent(selector) {
        return __awaiter$7(this, void 0, void 0, function* () {
            let component = null;
            let index = null;
            _components.forEach(function (theComponent, theIndex) {
                if (theComponent.selector === selector) {
                    component = theComponent;
                    index = theIndex;
                }
            });
            if (!component) {
                return;
            }
            try {
                const callbacks = [].concat([component.destructor]);
                yield promises(component, callbacks);
                delete _components[index];
            }
            catch (error) {
                console.warn('[V] Component destruct error:', error);
            }
        });
    }

    var __awaiter$6 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    extendComponent({
        beforeDestroy: fakePromise,
        onDestroy: fakePromise,
        afterDestroy: fakePromise,
    });
    function beforeDestroy(callback) {
        hook('componentBeforeDestroy', callback);
    }
    function afterDestroy(callback) {
        hook('componentAfterDestroy', callback);
    }
    function destroy(target) {
        return __awaiter$6(this, void 0, void 0, function* () {
            const callbacks = [];
            eachComponent(target, function (element, declaration) {
                const key = declaration.namespace;
                if (element._components[key] === undefined) {
                    return;
                }
                const component = element._components[key];
                delete element._components[key];
                const componentCallbacks = [].concat(hook('componentBeforeDestroy'), [component.beforeDestroy], [component.onDestroy], [component.afterDestroy], hook('componentAfterDestroy'));
                callbacks.push(promises(component, componentCallbacks));
            });
            yield Promise.all(callbacks);
            return target;
        });
    }

    var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    extendComponent({
        on: function (event, selector, callback) {
            if (callback === undefined) {
                callback = selector;
                selector = '';
            }
            const element = this.element;
            const eventID = [event, this.namespace, element.dataset.vid].join('.');
            return on(element, eventID, selector, callback);
        },
        off: function (event, selector) {
            const element = this.element;
            const eventID = [event, this.namespace, element.dataset.vid].join('.');
            return off(element, eventID, selector);
        },
        trigger: function (event, selector) {
            const element = this.element;
            const eventID = [event, this.namespace, element.dataset.vid].join('.');
            return trigger(element, eventID, selector);
        }
    });
    beforeDestroy(function () {
        return __awaiter$5(this, void 0, void 0, function* () {
            return this.off();
        });
    });

    var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    extendComponent({
        watch: function (event, callback) {
            const eventID = [event, this.namespace, this.element.dataset.vid].join('.');
            return watch(eventID, callback);
        },
        unwatch: function (event, callback) {
            const eventID = [event, this.namespace, this.element.dataset.vid].join('.');
            return unwatch(eventID, callback);
        },
        fire: function (event, data) {
            const eventID = [event, this.namespace, this.element.dataset.vid].join('.');
            return fire(eventID, data);
        }
    });
    beforeDestroy(function () {
        return __awaiter$4(this, void 0, void 0, function* () {
            return this.unwatch();
        });
    });

    var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    extendComponent({
        beforeMount: fakePromise,
        onMount: fakePromise,
        afterMount: fakePromise,
    });
    function beforeMount(callback) {
        hook('componentBeforeMount', callback);
    }
    function afterMount(callback) {
        hook('componentAfterMount', callback);
    }
    function mount(target) {
        return __awaiter$3(this, void 0, void 0, function* () {
            const callbacks = [];
            eachComponent(target, function (element, declaration) {
                const key = declaration.namespace;
                if (element._components[key] !== undefined) {
                    return;
                }
                if (!element.dataset.vid) {
                    element.dataset.vid = Math.random().toString(16).substring(2, 10);
                }
                const component = Object.assign({}, declaration);
                component.element = element;
                element._components[key] = component;
                const componentCallbacks = [].concat(hook('componentBeforeMount'), [component.beforeMount], [component.onMount], [component.afterMount], hook('componentAfterMount'));
                callbacks.push(promises(component, componentCallbacks));
            });
            yield Promise.all(callbacks);
            return target;
        });
    }

    var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    extendComponent({
        template: fakePromise,
        renderTemplate: function () {
            return __awaiter$2(this, void 0, void 0, function* () {
                const current = this.element.innerHTML;
                const theTemplate = yield this.template();
                if (theTemplate === undefined || theTemplate === null || theTemplate === false) {
                    return;
                }
                const variables = this.get();
                const result = template(String(theTemplate), variables);
                if (result != current) {
                    yield destroy(this.element);
                    this.element.innerHTML = result;
                }
            });
        },
        shouldRender: function () {
            return __awaiter$2(this, void 0, void 0, function* () {
                return true;
            });
        },
        beforeRender: fakePromise,
        onRender: fakePromise,
        afterRender: fakePromise,
        render: function (state) {
            return __awaiter$2(this, void 0, void 0, function* () {
                if (state !== undefined) {
                    this.set(state);
                }
                const component = this;
                const pass = yield component.shouldRender();
                if (!pass) {
                    return;
                }
                try {
                    const callbacks = [].concat(hook('componentBeforeRender'), [component.beforeRender], [component.renderTemplate], [component.onRender], [component.afterRender], hook('componentAfterRender'));
                    yield promises(component, callbacks);
                    yield mount(component.element);
                }
                catch (error) {
                    console.warn('[V] Component render error:', error);
                }
            });
        }
    });
    function beforeRender(callback) {
        hook('componentBeforeRender', callback);
    }
    function afterRender(callback) {
        hook('componentAfterRender', callback);
    }
    afterMount(function () {
        return __awaiter$2(this, void 0, void 0, function* () {
            return this.render();
        });
    });

    extendComponent({
        set: function (key, value) {
            const element = this.element;
            if (typeof key === 'string') {
                element._state[key] = value;
            }
            else {
                element._state = Object.assign(element._state, key);
            }
        },
        get: function (key, _default) {
            const element = this.element;
            if (key === undefined) {
                return element._state;
            }
            let value = element._state[key];
            value = (value === undefined) ? _default : value;
            return value;
        },
        clone: function (key, _default) {
            const result = this.get(key, _default);
            if (result instanceof Object) {
                return Object.assign({}, result);
            }
            return result;
        }
    });

    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    function interceptBefore(callback) {
        hook('httpInterceptBefore', callback);
    }
    function interceptAfter(callback) {
        hook('httpInterceptAfter', callback);
    }
    function request(method, url, data, headers) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const request = {
                method: method,
                url: url,
                data: data,
                headers: headers
            };
            yield promises(request, hook('httpInterceptBefore'));
            const options = Object.assign({}, request);
            delete options.url;
            delete options.data;
            if (options.method != 'GET') {
                if (options.body === undefined || options.body === null) {
                    options.body = request.data;
                    if (options.body instanceof FormData === false) {
                        options.body = JSON.stringify(options.body);
                        options.headers['Content-Type'] = 'application/json; charset=utf8';
                    }
                }
            }
            else {
                let query = '';
                if (typeof request.data === 'string') {
                    query = request.data;
                }
                else if (request.data) {
                    query = Object.keys(request.data).map(function (k) {
                        const _k = encodeURIComponent(k);
                        const _v = encodeURIComponent(request.data[k]);
                        return _k + "=" + _v;
                    }).join('&');
                }
                if (query) {
                    request.url += '?' + query;
                }
            }
            const response = yield fetch(request.url, options);
            let body = yield response.text();
            try {
                const json = JSON.parse(body);
                body = json;
            }
            catch (error) {
            }
            const details = {
                request: request,
                response: response,
                body: body
            };
            yield promises(details, hook('httpInterceptAfter'));
            if (!response.ok) {
                throw details;
            }
            return body;
        });
    }
    function options$1(url, data, headers) {
        return request('OPTIONS', url, data, headers);
    }
    function head(url, data, headers) {
        return request('HEAD', url, data, headers);
    }
    function get$1(url, data, headers) {
        return request('GET', url, data, headers);
    }
    function post(url, data, headers) {
        return request('POST', url, data, headers);
    }
    function put(url, data, headers) {
        return request('PUT', url, data, headers);
    }
    function patch(url, data, headers) {
        return request('PATCH', url, data, headers);
    }
    function _delete(url, data, headers) {
        return request('DELETE', url, data, headers);
    }

    var http = /*#__PURE__*/Object.freeze({
        __proto__: null,
        interceptBefore: interceptBefore,
        interceptAfter: interceptAfter,
        request: request,
        options: options$1,
        head: head,
        get: get$1,
        post: post,
        put: put,
        patch: patch,
        _delete: _delete
    });

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const _abstractRoute = {
        path: null,
        regex: null,
        _query: {},
        _params: {},
        param(name) {
            if (name === undefined) {
                return this._params;
            }
            if (this._params[name] !== undefined) {
                return this._params[name];
            }
            return undefined;
        },
        query(name) {
            if (name === undefined) {
                return this._query;
            }
            if (this._query[name] !== undefined) {
                return this._query[name];
            }
            return undefined;
        },
        location() {
            const params = this._params;
            let location = this.path;
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    location = location.replace(':' + key, params[key]);
                }
            }
            return location;
        }
    };
    const _routes = [];
    let _active = _abstractRoute;
    const options = {
        mode: window.history.pushState ? 'history' : 'hash',
        base: '',
        prevent: false
    };
    function normalizePath(path, removeQuery) {
        path = path.replace(window.location.origin, '');
        path = path.replace(options.base, '');
        path = path.replace('/?', '?');
        path = path.replace(new RegExp('[/]*$'), '');
        path = path.replace(new RegExp('^[/]*'), '');
        path = ('/' + path).replace('//', '/');
        if (removeQuery) {
            path = path.split('?')[0];
        }
        return path;
    }
    function paramsFor(path, match) {
        const params = {};
        const parts = normalizePath(match.path, true)
            .split('/')
            .filter(Boolean);
        const url = normalizePath(path, true)
            .split('/')
            .filter(Boolean);
        url.forEach(function (value, index) {
            if (parts[index] !== undefined && ':'.charCodeAt(0) === parts[index].charCodeAt(0)) {
                const key = parts[index].substring(1);
                params[key] = decodeURIComponent(value);
            }
        });
        return params;
    }
    function queryFor(location) {
        const query = {};
        let search = (location.indexOf('?') !== -1) ? location.split('?')[1] : '';
        search = String(search).trim().replace(/^(\?|#|&)/, '');
        if (search === '') {
            return query;
        }
        search.split('&').forEach(function (param) {
            const parts = param.replace(/\+/g, ' ').split('=');
            const key = decodeURIComponent(parts.shift());
            const value = parts.length > 0 ? decodeURIComponent(parts.join('=')) : null;
            if (query[key] === undefined) {
                query[key] = value;
            }
        });
        return query;
    }
    function beforeChange(callback) {
        hook('routeBeforeChange', callback);
    }
    function afterChange(callback) {
        hook('routeAfterChange', callback);
    }
    function add(definition) {
        if (Array.isArray(definition)) {
            return definition.forEach(function (item) {
                add(item);
            });
        }
        const route = Object.assign({}, _abstractRoute, definition);
        route.path = normalizePath(route.path, true);
        let regex = route.path;
        const pattern = ['(:[a-zA-Z]+)'];
        const replace = ['([^\/]+)'];
        pattern.forEach(function (value, index) {
            regex = regex.replace(new RegExp(value, 'g'), replace[index]);
        });
        route.regex = new RegExp('^' + regex + '$', 'i');
        _routes.push(route);
    }
    function change(location, replace) {
        return __awaiter(this, void 0, void 0, function* () {
            const routeChange = function () {
                if (this.replace) {
                    options.prevent = true;
                    if (options.mode === 'history') {
                        history.pushState({}, null, this.location);
                    }
                    else {
                        window.location.hash = this.location;
                    }
                    options.prevent = false;
                }
                const next = this.next;
                if (!next) {
                    return _active = null;
                }
                const query = queryFor(this.location);
                const params = paramsFor(this.location, next);
                next._query = query;
                next._params = params;
                _active = next;
            };
            try {
                location = normalizePath(location);
                const change = {
                    previous: _active,
                    next: match(location),
                    location: location,
                    replace: replace
                };
                yield promises(change, [].concat(hook('routeBeforeChange'), [routeChange], hook('routeAfterChange')));
            }
            catch (error) {
                console.warn('[V] Route error:', error);
            }
        });
    }
    function match(path) {
        const url = normalizePath(path, true);
        let match = null;
        for (let index = 0; index < _routes.length; index++) {
            const item = _routes[index];
            if (url.match(item.regex)) {
                match = item;
                break;
            }
        }
        return match;
    }
    function active() {
        return _active;
    }
    function redirect(toLocation) {
        return change(toLocation, true);
    }
    function go(delta) {
        window.history.go(delta);
    }
    function forward(delta) {
        go(delta === undefined ? 1 : delta);
    }
    function back(delta) {
        go(delta === undefined ? -1 : delta);
    }
    function popstate() {
        if (options.prevent) {
            return;
        }
        const path = (options.mode === 'hash')
            ? window.location.hash.replace('#', '')
            : window.location.href;
        change(path);
    }
    function linkClick(event) {
        const link = event.target.closest('a');
        const location = window.location;
        const stripHash = function (location) {
            return location.href.replace(/#.*/, '');
        };
        if (event.metaKey
            || event.ctrlKey
            || event.shiftKey
            || event.altKey) {
            return;
        }
        if (link.protocol && location.protocol !== link.protocol
            || link.hostname && location.hostname !== link.hostname) {
            return;
        }
        if (options.mode !== 'hash'
            && link.href
            && link.href.indexOf('#') > -1
            && stripHash(link) === stripHash(location)) {
            return;
        }
        if (link.target
            && link.target !== '') {
            return;
        }
        if (event.defaultPrevented) {
            return;
        }
        redirect(link.href);
        event.preventDefault();
    }
    function attachEvents() {
        on(window, 'popstate', popstate);
        on(document, 'click', 'a', linkClick);
    }

    var route = /*#__PURE__*/Object.freeze({
        __proto__: null,
        options: options,
        beforeChange: beforeChange,
        afterChange: afterChange,
        add: add,
        change: change,
        match: match,
        active: active,
        redirect: redirect,
        go: go,
        forward: forward,
        back: back,
        attachEvents: attachEvents
    });

    const _store = {};
    function _compress(value) {
        if (value instanceof Object) {
            value = JSON.stringify(value);
        }
        return value;
    }
    function _decompress(value) {
        try {
            const json = JSON.parse(value);
            value = json;
        }
        catch (error) {
        }
        return value;
    }
    function set(name, value) {
        _store[name] = value;
    }
    function get(name, _default) {
        let value = _store[name];
        value = (value === undefined || value === null) ? local.get(name) : value;
        value = (value === undefined || value === null) ? _default : value;
        return value;
    }
    function remove(name) {
        delete _store[name];
    }
    function items() {
        return _store;
    }
    const local = {
        set: function (name, value) {
            localStorage.setItem(name, _compress(value));
        },
        get: function (name, _default) {
            let value = localStorage.getItem(name);
            value = _decompress(value);
            value = (value === undefined || value === null) ? _default : value;
            return value;
        },
        remove: function (name) {
            localStorage.removeItem(name);
        },
        items: function () {
            return localStorage;
        }
    };
    const session = {
        set: function (name, value) {
            sessionStorage.setItem(name, _compress(value));
        },
        get: function (name, _default) {
            let value = sessionStorage.getItem(name);
            value = _decompress(value);
            value = (value === undefined || value === null) ? _default : value;
            return value;
        },
        remove: function (name) {
            sessionStorage.removeItem(name);
        },
        items: function () {
            return sessionStorage;
        }
    };

    var store = /*#__PURE__*/Object.freeze({
        __proto__: null,
        set: set,
        get: get,
        remove: remove,
        items: items,
        local: local,
        session: session
    });

    /*! Vanilla UI - https://github.com/mateussouzaweb/vanilla-ui */
    const __version = "1.1.0";

    exports.$ = $;
    exports.$$ = $$;
    exports.$$$ = $$$;
    exports.__version = __version;
    exports.afterDestroy = afterDestroy;
    exports.afterMount = afterMount;
    exports.afterRender = afterRender;
    exports.beforeDestroy = beforeDestroy;
    exports.beforeMount = beforeMount;
    exports.beforeRender = beforeRender;
    exports.component = component;
    exports.destroy = destroy;
    exports.each = each;
    exports.eachComponent = eachComponent;
    exports.extendComponent = extendComponent;
    exports.fakePromise = fakePromise;
    exports.fire = fire;
    exports.helper = helper;
    exports.hook = hook;
    exports.http = http;
    exports.mount = mount;
    exports.namespaceEvent = namespaceEvent;
    exports.off = off;
    exports.on = on;
    exports.promises = promises;
    exports.promisify = promisify;
    exports.removeComponent = removeComponent;
    exports.route = route;
    exports.store = store;
    exports.template = template;
    exports.trigger = trigger;
    exports.unwatch = unwatch;
    exports.watch = watch;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vanilla.js.map
