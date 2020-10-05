import { Action, Getter, ModuleBase, Mutation } from "./vuex-annotations";
import Vuex, { Store } from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

class ModuleState {
    public token = 'initialToken';
}

class Module extends ModuleBase<ModuleState> {
    @Getter()
    getToken() {
        return this.state.token;
    }

    @Getter()
    get token() {
        return this.state.token;
    }

    @Mutation()
    setToken(token: string) {
        return this.state.token = token;
    }

    @Action()
    setSpecialToken(token: string) {
        this.setToken(token);
    }
}

describe('Given the Module class with vuex-annotations', () => {
    
    describe('When the annotations are compiled', () => {
        
        test('Then, getter methods has been wrapped into functions and has been set to the Module prototype into the _getters object', () => {
            expect(Module.prototype['_getters']).toEqual({
                getToken: expect.any(Function),
                token: expect.any(Function)
            });
        });

        test('Then, mutation methods has been wrapped into functions and has been set to the Module prototype into the _mutations object', () => {
            expect(Module.prototype['_mutations']).toEqual({
                setToken: expect.any(Function)
            });
        });

        test('Then, action methods has been wrapped into functions and has been set to the Module prototype into the _actions object', () => {
            expect(Module.prototype['_actions']).toEqual({
                setSpecialToken: expect.any(Function)
            });
        });

    });

    describe('When the module Module is instancied', () => {

        let moduleState: ModuleState | undefined = undefined;
        let store: Store<any> | undefined = undefined;
        let module: Module | undefined = undefined;
        
        beforeEach(() => {
            moduleState = new ModuleState();
            store = new Vuex.Store<any>({ strict: true });
            jest.spyOn(store, 'registerModule');
            jest.spyOn(store, 'commit');
            jest.spyOn(store, 'dispatch');
            module = new Module('moduleName', moduleState, store);
        });

        test('Then, the module is registered in the store with the right options', () => {
            expect(store!.registerModule).toHaveBeenCalledWith('moduleName', {
                namespaced: true,
                state: moduleState,
                getters: { getToken: expect.any(Function), token: expect.any(Function) },
                actions: { setSpecialToken: expect.any(Function) },
                mutations: { setToken: expect.any(Function) }
            });
        });

        test('Then, the initialToken value is returned with a getter method', () => {
            expect(module!.getToken()).toBe('initialToken');
        });

        test('Then, the initialToken value is returned with a getter getter', () => {
            expect(module!.token).toBe('initialToken');
        });

        describe('When setToken mutation is called with a payload', () => {
            
            const payload: string = 'newToken';
            
            beforeEach(() => {
                module!.setToken(payload);
            });

            test('Then, the state token has been commited to the store with the right parameters', () => {
                expect(store!.commit).toHaveBeenLastCalledWith('moduleName/setToken', [payload], undefined);
            });
            
            test('Then, the state token has been changed to the payload', () => {
                expect(module!.getToken()).toBe(payload);
            });
        })

        describe('When setSpecialToken action is called with a payload', () => {
            
            const payload: string = 'specialToken';
            
            beforeEach(() => {
                module!.setSpecialToken(payload);
            });
            
            test('Then, the store has dispatched the action with the right parameters', () => {
                expect(store!.dispatch).toHaveBeenLastCalledWith('moduleName/setSpecialToken', [payload]);
            });
            
            test('Then, the state token has been changed to the payload', () => {
                expect(module!.getToken()).toBe(payload);
            });

        })

    });
    
});