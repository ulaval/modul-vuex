import { Action, Getter, ModuleBase, Mutation } from './vuex-annotations';
import Vuex, { Store } from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

const INITIAL_TOKEN_IN_PARENT: string = 'initialTokenInParent';
const INITIAL_PARENT_TOKEN_IN_PARENT: string = 'initialParentTokenInParent';
const INITIAL_TOKEN_IN_CHILD: string = 'initialTokenInChild';

const PARENT_PREFIX: string = 'parent';
const CHILD_PREFIX: string = 'child';
const SPECIAL_PREFIX: string = 'special';

class ParentModuleState {
    public token = INITIAL_TOKEN_IN_PARENT;
    public parentToken = INITIAL_PARENT_TOKEN_IN_PARENT;
}

class ChildModuleState extends ParentModuleState {
    public token = INITIAL_TOKEN_IN_CHILD;
}

class ParentModule<S extends ParentModuleState> extends ModuleBase<S> {
    @Getter()
    getToken(): string {
        return PARENT_PREFIX + this.state.token;
    }

    @Getter()
    get token(): string {
        return PARENT_PREFIX + this.state.token;
    }

    @Mutation()
    setToken(token: string): void {
        this.state.token = PARENT_PREFIX + token;
    }

    @Action()
    setSpecialToken(token: string): void {
        this.setToken(SPECIAL_PREFIX + token);
    }

    @Getter()
    getParentToken(): string {
        return PARENT_PREFIX + this.state.parentToken;
    }

    @Getter()
    get parentToken(): string {
        return PARENT_PREFIX + this.state.parentToken;
    }

    @Mutation()
    setParentToken(parentToken: string): void {
        this.state.parentToken = PARENT_PREFIX + parentToken;
    }

    @Action()
    setSpecialParentToken(parentToken: string): void {
        this.setParentToken(SPECIAL_PREFIX + parentToken);
    }
}

class ChildModule extends ParentModule<ChildModuleState> {
    @Getter()
    getToken(): string {
        return CHILD_PREFIX + this.state.token;
    }

    @Getter()
    get token(): string {
        return CHILD_PREFIX + this.state.token;
    }

    @Mutation()
    setToken(token: string): void {
        this.state.token = CHILD_PREFIX + token;
    }

    @Action()
    setSpecialToken(token: string): void {
        this.setToken(SPECIAL_PREFIX + token);
    }
}

describe('Given a vuex module class with vuex-annotations', () => {

    describe('When the annotations are compiled', () => {

        test('Then, getter methods has been wrapped into functions and has been set to the ParentModule prototype into the _getters object', () => {
            expect(ParentModule.prototype['_getters']).toEqual({
                getToken: expect.any(Function),
                token: expect.any(Function),
                getParentToken: expect.any(Function),
                parentToken: expect.any(Function)
            });
        });

        test('Then, mutation methods has been wrapped into functions and has been set to the ParentModule prototype into the _mutations object', () => {
            expect(ParentModule.prototype['_mutations']).toEqual({
                setToken: expect.any(Function),
                setParentToken: expect.any(Function)
            });
        });

        test('Then, action methods has been wrapped into functions and has been set to the ParentModule prototype into the _actions object', () => {
            expect(ParentModule.prototype['_actions']).toEqual({
                setSpecialToken: expect.any(Function),
                setSpecialParentToken: expect.any(Function)
            });
        });

        test('Then, getter methods has been wrapped into functions and has been set to the ChildModule prototype into the _getters object', () => {
            expect(ChildModule.prototype['_getters']).toEqual({
                getToken: expect.any(Function),
                token: expect.any(Function)
            });
        });

        test('Then, mutation methods has been wrapped into functions and has been set to the ChildModule prototype into the _mutations object', () => {
            expect(ChildModule.prototype['_mutations']).toEqual({
                setToken: expect.any(Function)
            });
        });

        test('Then, action methods has been wrapped into functions and has been set to the ChildModule prototype into the _actions object', () => {
            expect(ChildModule.prototype['_actions']).toEqual({
                setSpecialToken: expect.any(Function)
            });
        });

    });

    describe('When the Module is instancied', () => {

        let parentModuleState: ParentModuleState | undefined = undefined;
        let store: Store<any> | undefined = undefined;
        let module: ParentModule<ParentModuleState> | undefined = undefined;

        beforeEach(() => {
            parentModuleState = new ParentModuleState();

            store = new Vuex.Store<any>({ strict: true });
            jest.spyOn(store, 'registerModule');
            jest.spyOn(store, 'commit');
            jest.spyOn(store, 'dispatch');

            module = new ParentModule('parentModuleName', parentModuleState, store);
        });

        test('Then, the vuex module is registered in the store with the right options', () => {
            expect(store!.registerModule).toHaveBeenCalledWith('parentModuleName', {
                namespaced: true,
                state: parentModuleState,
                getters: { getToken: expect.any(Function), token: expect.any(Function), getParentToken: expect.any(Function), parentToken: expect.any(Function) },
                actions: { setSpecialToken: expect.any(Function), setSpecialParentToken: expect.any(Function) },
                mutations: { setToken: expect.any(Function), setParentToken: expect.any(Function) }
            });
        });

        describe('When a getter method is called', () => {

            let token: string | undefined = undefined;

            beforeEach(() => {
                token = module!.getToken();
            });

            test('Then, the token has the right value', () => {
                expect(token).toBe(PARENT_PREFIX + INITIAL_TOKEN_IN_PARENT);
            });

        });

        describe('When a getter getter is gotten', () => {

            let token: string | undefined = undefined;

            beforeEach(() => {
                token = module!.token;
            });

            test('Then, the token has the right value', () => {
                expect(token).toBe(PARENT_PREFIX + INITIAL_TOKEN_IN_PARENT);
            });

        });

        describe('When a mutation is called with a payload', () => {

            const payload: string = 'newToken';

            beforeEach(() => {
                module!.setToken(payload);
            });

            test('Then, the state token has been commited to the store with the right parameters', () => {
                expect(store!.commit).toHaveBeenCalledWith('parentModuleName/setToken', [payload], undefined);
            });

            test('Then, the state token has been changed correctly', () => {
                expect(module!.getToken()).toBe(PARENT_PREFIX + PARENT_PREFIX + payload);
            });
        });

        describe('When an action is called with a payload', () => {

            const payload: string = 'token';

            beforeEach(() => {
                module!.setSpecialToken(payload);
            });

            test('Then, the store has dispatched the action with the right parameters', () => {
                expect(store!.dispatch).toHaveBeenCalledWith('parentModuleName/setSpecialToken', [payload]);
            });

            test('Then, the state token has been changed correctly', () => {
                expect(module!.getToken()).toBe(PARENT_PREFIX + PARENT_PREFIX + SPECIAL_PREFIX + payload);
            });

        });

    });

    describe('When the ChildModule is instancied', () => {

        let childModuleState: ChildModuleState | undefined = undefined;
        let store: Store<any> | undefined = undefined;
        let childModule: ChildModule | undefined = undefined;

        beforeEach(() => {
            childModuleState = new ChildModuleState();

            store = new Vuex.Store<any>({ strict: true });
            jest.spyOn(store, 'registerModule');
            jest.spyOn(store, 'commit');
            jest.spyOn(store, 'dispatch');

            childModule = new ChildModule('childModuleName', childModuleState, store);
        });

        test('Then, the vuex module is registered in the store with the right options', () => {
            expect(store!.registerModule).toHaveBeenCalledWith('childModuleName', {
                namespaced: true,
                state: childModuleState,
                getters: { getToken: expect.any(Function), token: expect.any(Function), getParentToken: expect.any(Function), parentToken: expect.any(Function) },
                actions: { setSpecialToken: expect.any(Function), setSpecialParentToken: expect.any(Function) },
                mutations: { setToken: expect.any(Function), setParentToken: expect.any(Function) }
            });
        });

        describe('When a getter method is called', () => {

            let token: string | undefined = undefined;

            beforeEach(() => {
                token = childModule!.getToken();
            });

            test('Then, the token has the right value', () => {
                expect(token).toBe(CHILD_PREFIX + INITIAL_TOKEN_IN_CHILD);
            });

        });

        describe('When a parent\'s getter method is called', () => {

            let token: string | undefined = undefined;

            beforeEach(() => {
                token = childModule!.getParentToken();
            });

            test('Then, the token has the right value', () => {
                expect(token).toBe(PARENT_PREFIX + INITIAL_PARENT_TOKEN_IN_PARENT);
            });

        });

        describe('When a getter getter is gotten', () => {

            let token: string | undefined = undefined;

            beforeEach(() => {
                token = childModule!.token;
            });

            test('Then, the token has the right value', () => {
                expect(token).toBe(CHILD_PREFIX + INITIAL_TOKEN_IN_CHILD);
            });

        });

        describe('When a parent\'s getter getter is gotten', () => {

            let token: string | undefined = undefined;

            beforeEach(() => {
                token = childModule!.parentToken;
            });

            test('Then, the token has the right value', () => {
                expect(token).toBe(PARENT_PREFIX + INITIAL_PARENT_TOKEN_IN_PARENT);
            });

        });

        describe('When a mutation is called with a payload', () => {

            const payload: string = 'newToken';

            beforeEach(() => {
                childModule!.setToken(payload);
            });

            test('Then, the state token has been commited to the store with the right parameters', () => {
                expect(store!.commit).toHaveBeenCalledWith('childModuleName/setToken', [payload], undefined);
            });

            test('Then, the state token has been changed correctly', () => {
                expect(childModule!.getToken()).toBe('childchild' + payload);
            });
        });

        describe('When a parent\'s mutation is called with a payload', () => {

            const payload: string = 'newToken';

            beforeEach(() => {
                childModule!.setParentToken(payload);
            });

            test('Then, the state token has been commited to the store with the right parameters', () => {
                expect(store!.commit).toHaveBeenCalledWith('childModuleName/setParentToken', [payload], undefined);
            });

            test('Then, the state token has been changed correctly', () => {
                expect(childModule!.getParentToken()).toBe(PARENT_PREFIX + PARENT_PREFIX + payload);
            });
        });

        describe('When an action is called with a payload', () => {

            const payload: string = 'token';

            beforeEach(() => {
                childModule!.setSpecialToken(payload);
            });

            test('Then, the store has dispatched the action with the right parameters', () => {
                expect(store!.dispatch).toHaveBeenCalledWith('childModuleName/setSpecialToken', [payload]);
            });

            test('Then, the state token has been changed correctly', () => {
                expect(childModule!.getToken()).toBe(CHILD_PREFIX + CHILD_PREFIX + SPECIAL_PREFIX + payload);
            });

        });

        describe('When a parent\'s action is called with a payload', () => {

            const payload: string = 'token';

            beforeEach(() => {
                childModule!.setSpecialParentToken(payload);
            });

            test('Then, the store has dispatched the action with the right parameters', () => {
                expect(store!.dispatch).toHaveBeenCalledWith('childModuleName/setSpecialParentToken', [payload]);
            });

            test('Then, the state token has been changed correctly', () => {
                expect(childModule!.getParentToken()).toBe(PARENT_PREFIX + PARENT_PREFIX + SPECIAL_PREFIX + payload);
            });

        });

    });

});
