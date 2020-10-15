import Vue from 'vue';
import * as Vuex from 'vuex';

function debug(type: 'act' | 'mut' | 'get', moduleName: string, key: string, args: string | IArguments | Array<any> = ''): void {
    if ((Vue.config as any)['debugVuex']) {

        if (args instanceof Array) {
            args = args.join(', ');
        } else if (typeof args === 'object') {
            args = Array.prototype.slice.call(args).join(', ');
        }

        console.debug(type + ' - ' + moduleName + '.' + key + '(' + args + ')');
    }
}

type GetterFunc = (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) => void;

export function Getter(): GetterFunc {
    // target is the class constructor
    // key is the name of the property
    return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) => {
        const hasArguments = !descriptor.get;
        const originalFunction = descriptor.get || descriptor.value;

        // To call the raw getter with the store api
        const getterFunction = function invokeGetter(this: any): any {
            const res = this.store.getters[this.moduleName + '/' + key];

            // If the getter has arguments, the return will be a function that needs to be executed with the current arguments
            return typeof res === 'function' ? res.apply(this, arguments) : res;
        };

        // This function gets called to compute the value of the getter
        const wrapperFunction = function wrapGetter(this: any, state: any/*, getters, rootState, rootGetters*/): any {
            this.state = state;
            const _this = this;

            if (hasArguments) {
                // In case the getter has arguments, we need to wrap inside a function
                return function(this: any): any {
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
        if (!Object.getOwnPropertyDescriptor(target, '_getters')) {
            target['_getters'] = {};
        }

        if(target['_getters'][key]) {
            throw new Error('Duplicate getter key ' + key + ' of target ' + target.constructor.name + ' has already been set');
        }

        target['_getters'][key] = wrapperFunction;
    };
}

type MutationFunc = (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) => void;

export function Mutation(params?: { options: Vuex.CommitOptions }): MutationFunc {
    return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) => {

        const originalFunction = descriptor.value;

        const commitFunction = function commitMutation(this: any): any {
            this.store.commit(this.moduleName + '/' + key, Array.prototype.slice.call(arguments), params ? params.options : undefined);
            return originalFunction._return;
        };

        const wrapperFunction = function wrapMutation(this: any, state: any, args: any): any {
            debug('mut', this.moduleName, key, args);
            this.state = state;
            originalFunction._return = originalFunction.apply(this, args);
        };

        descriptor.value = commitFunction;

        if (!Object.getOwnPropertyDescriptor(target, '_mutations')) {
            target['_mutations'] = {};
        }

        if(target['_mutations'][key]) {
            throw new Error('Duplicate mutation key ' + key + ' of target ' + target.constructor.name + ' has already been set');
        }

        target['_mutations'][key] = wrapperFunction;
    };
}

type ActionFunc = (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) => void;

export function Action(): ActionFunc {
    return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) => {

        const originalFunction = descriptor.value;

        const dispatchFunction = function dispatchAction(this: any): any {
            this.store.dispatch(this.moduleName + '/' + key, Array.prototype.slice.call(arguments));
            return originalFunction._return;
        };

        const wrapperFunction = function wrapAction(this: any, { state }: { state: any }, args: any): any {
            debug('act', this.moduleName, key, args);
            this.state = state;
            return originalFunction._return = originalFunction.apply(this, args);
        };

        descriptor.value = dispatchFunction;

        if (!Object.getOwnPropertyDescriptor(target, '_actions')) {
            target['_actions'] = {};
        }

        if(target['_actions'][key]) {
            throw new Error('Duplicate action key ' + key + ' of target ' + target.constructor.name + ' has already been set');
        }

        target['_actions'][key] = wrapperFunction;
    };
}

function bindThis(_this: any, object: any): any {
    const binded: any = {};
    for (const key in object) {
        const fc = object[key];
        binded[key] = function bindThisWrapper(): any {
            return fc.apply(_this, arguments);
        };
    }

    return binded;
}

function getRecursiveAnnotations(object: any, keyAnnotations: string): any {
    const recursiveAnnotations: any = {};
    
    let parentObject: any = Object.getPrototypeOf(object);
    
    while(parentObject) {
        for(var key in parentObject[keyAnnotations]) {
            if(!recursiveAnnotations[key]) {
                recursiveAnnotations[key] = parentObject[keyAnnotations][key];
            }
        }

        parentObject = Object.getPrototypeOf(parentObject);
    }

    return recursiveAnnotations;
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
        const options: Vuex.Module<S, {}> = {
            namespaced: true,
            state,
            getters: bindThis(this, getRecursiveAnnotations(this, '_getters')),
            actions: bindThis(this, getRecursiveAnnotations(this, '_actions')),
            mutations: bindThis(this, getRecursiveAnnotations(this, '_mutations'))
        };

        store.registerModule(this.moduleName, options);
    }
}
