import { Action, Getter, ModuleBase, Mutation } from "./vuex-annotations";
import Vuex, { Store } from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

class ModuleState {
    state = 'test';
}

class Module extends ModuleBase<ModuleState> {
    @Getter()
    get() {
        return this.state.state;
    }

    @Mutation()
    set(state: string) {
        return this.state.state = state;
    }

    @Action()
    action() {
        this.set('set by action');
    }
}

describe('Given the Module class with vuex-annotations', () => {
    
    describe('When the annotations are compiled', () => {
        
        test('Then, the get method has been wrapped into a function and has been set to the Module prototype into the getters list', () => {
            expect(Module.prototype['_getters']['get']).toEqual(expect.any(Function));
            expect((Module.prototype['_getters']['get'] as Function).name).toBe('wrapGetter');
        });

        test('Then, the set method has been wrapped into a function and has been set to the Module prototype into the mutations list', () => {
            expect(Module.prototype['_mutations']['set']).toEqual(expect.any(Function));
            expect((Module.prototype['_mutations']['set'] as Function).name).toBe('wrapMutation');
        });

        test('Then, the action method has been wrapped into a function and has been set to the Module prototype into the actions list', () => {
            expect(Module.prototype['_actions']['action']).toEqual(expect.any(Function));
            expect((Module.prototype['_actions']['action'] as Function).name).toBe('wrapAction');
        });

    });

    describe('When the module Module is instancied', () => {

        let moduleState: ModuleState | undefined = undefined;
        let store: Store<any> | undefined = undefined;
        let module: Module | undefined = undefined;
        // let state: string | undefined = undefined;
        
        beforeEach(() => {
            moduleState = new ModuleState();
            store = new Vuex.Store<any>({ strict: true });
            jest.spyOn(store, 'registerModule');
            module = new Module('moduleName', moduleState, store);
        });

        test('Then, the store is registered with the right options', () => {
            expect(store!.registerModule).toHaveBeenCalledWith('moduleName', {
                namespaced: true,
                state: moduleState,
                getters: {get: expect.any(Function)},
                actions: {action: expect.any(Function)},
                mutations: {set: expect.any(Function)}
            });
        });

        describe('When the getter is called', () => {
            
            // beforeEach(() => {
            //     state = 
            // });

            test('Then, the right value is returned', () => {
                expect(module!.get()).toBe('test');
            });

        });

    });
    
});