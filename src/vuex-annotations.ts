import Vue from 'vue';
import * as Vuex from 'vuex';

function debug(type: 'act' | 'mut' | 'get', moduleName: string, key: string, args: string | IArguments | Array<any> = '') {
    if ((Vue.config as any)['debugVuex']) {

        if (args instanceof Array) {
            args = args.join(', ');
        } else if (typeof args === 'object') {
            args = Array.prototype.slice.call(args).join(', ');
        }

        console.debug(type + ' - ' + moduleName + '.' + key + '(' + args + ')');
    }
}

export function Getter() {
    // target is the class constructor
    // key is the name of the property
    return (target: any, key: any, descriptor: TypedPropertyDescriptor<any>) => {
        const hasArguments = !descriptor.get;
        const originalFunction = descriptor.get || descriptor.value;

        // To call the raw getter with the store api
        const getterFunction = function invokeGetter(this: any) {
            const res = this.store.getters[this.moduleName + '/' + key];

            // If the getter has arguments, the return will be a function that needs to be executed with the current arguments
            return typeof res === 'function' ? res.apply(this, arguments) : res;
        };

        // This function gets called to compute the value of the getter
        const wrapperFunction = function wrapGetter(this: any, state: any/*, getters, rootState, rootGetters*/) {
            this.state = state;
            const _this = this;

            if (hasArguments) {
                // In case the getter has arguments, we need to wrap inside a function
                return function(this: any) {
                    debug('get', this.moduleName, key, arguments);
                    return originalFunction.apply(_this, arguments);
                };
            }

            debug('get', this.moduleName, key);
            return originalFunction.apply(this);
        };

        // Replace the function with the generated function
        hasArguments ? descriptor.value = getterFunction : descriptor.get = getterFunction;

        // Keep a copy of the wrapped function so that it can be registered
        if (!target['_getters']) {
            target['_getters'] = {};
        }
        target['_getters'][key] = wrapperFunction;
    };
}

export function Mutation(params?: { options: Vuex.CommitOptions }) {
    return (target: any, key: any, descriptor: TypedPropertyDescriptor<any>) => {

        const originalFunction = descriptor.value;

        const commitFunction = function commitMutation(this: any) {
            this.store.commit(this.moduleName + '/' + key, Array.prototype.slice.call(arguments), params ? params.options : undefined);
            return originalFunction._return;
        };

        const wrapperFunction = function wrapMutation(this: any, state: any, args: any) {
            debug('mut', this.moduleName, key, args);
            this.state = state;
            originalFunction._return = originalFunction.apply(this, args);
        };

        descriptor.value = commitFunction;

        if (!target['_mutations']) {
            target['_mutations'] = {};
        }
        target['_mutations'][key] = wrapperFunction;
    };
}

export function Action() {
    return (target: any, key: any, descriptor: TypedPropertyDescriptor<any>) => {

        const originalFunction = descriptor.value;

        const dispatchFunction = function dispatchAction(this: any) {
            this.store.dispatch(this.moduleName + '/' + key, Array.prototype.slice.call(arguments));
            return originalFunction._return;
        };

        const wrapperFunction = function wrapAction(this: any, { state }: { state: any }, args: any) {
            debug('act', this.moduleName, key, args);
            this.state = state;
            return originalFunction._return = originalFunction.apply(this, args);
        };

        descriptor.value = dispatchFunction;

        if (!target['_actions']) {
            target['_actions'] = {};
        }
        target['_actions'][key] = wrapperFunction;
    };
}

function bindThis(_this: any, object: any) {
    const binded: any = {};
    for (const key in object) {
        const fc = object[key];
        binded[key] = function bindThisWrapper() {
            return fc.apply(_this, arguments);
        };
    }

    return binded;
}

/**
 * This class is the required base class to be able to use the Getter, Mutation, and Action decorators.
 *
 * The constructor will register itself with the store as a named module.
 *
 * It sets a 'state' and 'store' properties that should be used by child classes.
 */
export abstract class ModuleBase<S> {

    constructor(protected moduleName: string, protected state: S, public store: Vuex.Store<any>) {
        const options = {
            namespaced: true,
            state,
            getters: bindThis(this, (this as any)['_getters']),
            actions: bindThis(this, (this as any)['_actions']),
            mutations: bindThis(this, (this as any)['_mutations'])
        };

        store.registerModule(this.moduleName, options);
    }
}
