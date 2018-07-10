# modul-vuex
Series of Vuex utilities

## Install
Add the following dependency in your package.json:

```
"@ulaval/modul-vuex": "latest"
```

## Annotations and Module class
Here's a simple module declaration
```
import { ModuleBase, Mutation, Action, Getter } from '@ulaval/modul-vuex/dist/vuex-annotations';

export class MyModule extends ModuleBase<MyState> {
    @Action()
    public doSomething(value: any): void {
        // an action
    }

    @Action()
    public async doSomethingAsync(value: any): Promise<string> {
        // returns a string object asynchronously
    }

    @Mutation()
    public mutate(payload: any): void {
        this.state.value1 = payload;
    }

    @Getter()
    public get giveMeTheValue(): string {
        return this.state.value1;
    }
}
```

## Store initialization

First, create the store object
```
Vue.use(Vuex);

const store: Store<MyState> = new Store<MyState>({
    strict: true // debug mode
});
```
Then create the module
```
let myStoreModule: MyModule = new MyModule('myModuleName', myState, store);
```
Use it in your component
```
private changeState(value: string): void {
    myStoreModule.mutate(value);
}

public get value(): string {
    return myStoreModule.giveMeTheValue;
}
```

### Known issue
Time tavelling is not working in the Vuex dev tools.