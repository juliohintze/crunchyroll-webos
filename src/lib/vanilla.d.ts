declare module V {
    export var __esModule: boolean;
    export function $(selector: any, context: any): any;
    export function $$(selector: any, context: any): any;
    export function $$$(element: any, context: any): (Element | Document | Window)[];
    export const __version: "1.1.0";
    export function afterDestroy(callback: any): void;
    export function afterMount(callback: any): void;
    export function afterRender(callback: any): void;
    export function beforeDestroy(callback: any): void;
    export function beforeMount(callback: any): void;
    export function beforeRender(callback: any): void;
    export function component(selector: any, data: any): any;
    export function destroy(target: any): any;
    export function each(items: any, callback: any): void;
    export function eachComponent(target: any, callback: any): void;
    export function extendComponent(definition: any): void;
    export function fakePromise(): any;
    export function fire(theEvent: any, data: any): Promise<any[]>;
    export function helper(key: any, callback: any): void;
    export function hook(event: any, callback: any): any;
    export var http: Readonly<{
        __proto__: any;
        interceptBefore: (callback: any) => void;
        interceptAfter: (callback: any) => void;
        request: (method: any, url: any, data: any, headers: any) => any;
        options: (url: any, data: any, headers: any) => any;
        head: (url: any, data: any, headers: any) => any;
        get: (url: any, data: any, headers: any) => any;
        post: (url: any, data: any, headers: any) => any;
        put: (url: any, data: any, headers: any) => any;
        patch: (url: any, data: any, headers: any) => any;
        _delete: (url: any, data: any, headers: any) => any;
    }>;
    export function mount(target: any): any;
    export function namespaceEvent(theEvent: any, callback: any): {
        event: any;
        namespace: any;
        callback: any;
    };
    export function off(element: any, event: any, selector: any, callback: any): any;
    export function on(element: any, event: any, selector: any, callback: any): any;
    export function promises(scope: any, callbacks: any): any;
    export function promisify(scope: any, callback: any, data: any): any;
    export function removeComponent(selector: any): any;
    export var route: Readonly<{
        __proto__: any;
        options: {
            mode: string;
            base: string;
            prevent: boolean;
        };
        beforeChange: (callback: any) => void;
        afterChange: (callback: any) => void;
        add: (definition: any) => void;
        change: (location: any, replace: any) => any;
        match: (path: any) => any;
        active: () => {
            path: any;
            regex: any;
            _query: {};
            _params: {};
            param(name: any): any;
            query(name: any): any;
            location(): any;
        };
        redirect: (toLocation: any) => any;
        go: (delta: any) => void;
        forward: (delta: any) => void;
        back: (delta: any) => void;
        attachEvents: () => void;
    }>;
    export var store: Readonly<{
        __proto__: any;
        set: (name: any, value: any) => void;
        get: (name: any, _default: any) => any;
        remove: (name: any) => void;
        items: () => {};
        local: {
            set: (name: any, value: any) => void;
            get: (name: any, _default: any) => string;
            remove: (name: any) => void;
            items: () => Storage;
        };
        session: {
            set: (name: any, value: any) => void;
            get: (name: any, _default: any) => string;
            remove: (name: any) => void;
            items: () => Storage;
        };
    }>;
    export function template(template: any, data: any): any;
    export function trigger(element: any, event: any, selector: any): void;
    export function unwatch(theEvent: any, callback: any): void;
    export function watch(theEvent: any, callback: any): void;
}