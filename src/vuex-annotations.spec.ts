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

describe('Given a vuex module class with vuex-annotations', () => {
    
    describe('When the annotations are compiled', () => {
        
        test('Then, getter methods has been wrapped into functions and has been set to the class prototype into the _getters object', () => {
            expect(Module.prototype['_getters']).toEqual({
                getToken: expect.any(Function),
                token: expect.any(Function)
            });
        });

        test('Then, mutation methods has been wrapped into functions and has been set to the class prototype into the _mutations object', () => {
            expect(Module.prototype['_mutations']).toEqual({
                setToken: expect.any(Function)
            });
        });

        test('Then, action methods has been wrapped into functions and has been set to the class prototype into the _actions object', () => {
            expect(Module.prototype['_actions']).toEqual({
                setSpecialToken: expect.any(Function)
            });
        });

    });

    describe('When the class is instancied', () => {

        let moduleState: ModuleState | undefined = undefined;
        let store: Store<any> | undefined = undefined;
        let module: Module | undefined = undefined;
        let getterSpy: jest.SpyInstance | undefined = undefined;
        
        beforeEach(() => {
            moduleState = new ModuleState();
            
            store = new Vuex.Store<any>({ strict: true });
            jest.spyOn(store, 'registerModule');
            jest.spyOn(store, 'commit');
            jest.spyOn(store, 'dispatch');
            
            module = new Module('moduleName', moduleState, store);
            jest.spyOn(module, 'getToken');
            getterSpy = jest.spyOn(module, 'token', 'get');
            jest.spyOn(module, 'setToken');
            jest.spyOn(module, 'setSpecialToken')
        });

        test('Then, the vuex module is registered in the store with the right options', () => {
            expect(store!.registerModule).toHaveBeenCalledWith('moduleName', {
                namespaced: true,
                state: moduleState,
                getters: { getToken: expect.any(Function), token: expect.any(Function) },
                actions: { setSpecialToken: expect.any(Function) },
                mutations: { setToken: expect.any(Function) }
            });
        });

        describe('When a getter method is called', () => {

            let token: string | undefined = undefined;
            
            beforeEach(() => {
                token = module!.getToken();
            });

            test('Then, the token has the initialToken value', () => {
                expect(token).toBe('initialToken');
            });

            test('Then, the getter has been called on the class instance', () => {
                expect(module!.getToken).toHaveBeenCalledWith();
            });

        });

        describe('When a getter getter is gotten', () => {

            let token: string | undefined = undefined;
            
            beforeEach(() => {
                token = module!.token
            });

            test('Then, the token has the initialToken value', () => {
                expect(token).toBe('initialToken');
            });

            test('Then, the getter has been called on the class instance', () => {
                expect(getterSpy).toHaveBeenCalledWith();
            });

        });

        describe('When a mutation is called with a payload', () => {
            
            const payload: string = 'newToken';
            
            beforeEach(() => {
                module!.setToken(payload);
            });

            test('Then, the state token has been commited to the store with the right parameters', () => {
                expect(store!.commit).toHaveBeenCalledWith('moduleName/setToken', [payload], undefined);
            });

            test('Then, the mutation has been called on the class instance with the payload', () => {
                expect(module!.setToken).toHaveBeenCalledWith(payload);
            });
            
            test('Then, the state token has been changed to the payload', () => {
                expect(module!.getToken()).toBe(payload);
            });
        })

        describe('When a action is called with a payload', () => {
            
            const payload: string = 'specialToken';
            
            beforeEach(() => {
                module!.setSpecialToken(payload);
            });
            
            test('Then, the store has dispatched the action with the right parameters', () => {
                expect(store!.dispatch).toHaveBeenCalledWith('moduleName/setSpecialToken', [payload]);
            });

            test('Then, the action has been called on the class instance with the payload', () => {
                expect(module!.setSpecialToken).toHaveBeenCalledWith(payload);
            });
            
            test('Then, the state token has been changed to the payload', () => {
                expect(module!.getToken()).toBe(payload);
            });

        })

    });
    
});