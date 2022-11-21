import { ClientToServerEvents } from "../server";

type ParametersFromFunction<T> = T extends (...params: any[]) => any ? Parameters<T> : never;
type Last<T extends any[]> = T extends [...infer I, infer L] ? L : never;
type WithoutLast<T extends any[]> = T extends [...infer I, infer L] ? I : never;

type AnyFunction = (...params: any[]) => any;
type FunctionKey<TKey extends keyof TObj, TObj> = TKey extends "onJoin" ? never : TObj[TKey] extends AnyFunction ? TKey : never;

type FunctionWithCallbackKey<TKey extends keyof TObj, TObj> = TKey extends "onJoin" ? never : TObj[TKey] extends AnyFunction ? Last<Parameters<TObj[TKey]>> extends AnyFunction ? TKey : never : never;

type OnlyLastParam<TKey extends keyof TObj, TObj> = TObj[TKey] extends AnyFunction ? Last<Parameters<TObj[TKey]>> : never;
type ParamsOfLastCallback<TKey extends keyof TObj, TObj> = OnlyLastParam<TKey, TObj> extends AnyFunction ? Parameters<OnlyLastParam<TKey, TObj>> : never;

type RemoveLastParam<TKey extends keyof TObj, TObj> = TObj[TKey] extends AnyFunction ? WithoutLast<Parameters<TObj[TKey]>> : never;

type RoomManager<TToClientEvents, TState, TSocketData> = {
    getState: () => TState;
    setState: (state: TState) => void;
    setElement: <TKey extends keyof TState>(key: TKey, value: TState[TKey]) => void;
    setSenderData: (data: TSocketData) => void;
    getSenderData: () => TSocketData;
    toSender: <TKey extends keyof TToClientEvents>(event: TKey, ...params: ParametersFromFunction<TToClientEvents[TKey]>) => void,
    toRoomIncludingSender: () => void,
    toRoomExcludingSender: () => void
}

type HandleCommunicationFromClient<T> = T & {
    onJoin: () => void
};

type RoomAccessor<TToManagerEvents, TState> = {
    getRoomState: () => TState,
    startRoom: ClientToServerEvents<TState>["startRoom"],
    joinRoom: ClientToServerEvents<TState>["joinRoom"],
    toRoomManager: <TKey extends keyof TToManagerEvents>(key: FunctionKey<TKey, TToManagerEvents>, ...params: TToManagerEvents[TKey] extends AnyFunction ? Parameters<TToManagerEvents[TKey]> : never) => void,
    toRoomManagerAsync: <TKey extends keyof TToManagerEvents>(key: FunctionWithCallbackKey<TKey, TToManagerEvents>, ...params: RemoveLastParam<TKey, TToManagerEvents>) => Promise<ParamsOfLastCallback<TKey, TToManagerEvents>>,
}

/**
 * 
 * @param receiver Handle the events being sent to the client
 * @param manageRoom Setup the functionality used to handle the room's activity
 * @param initialState The intial room state
 * @param initialSocketData The intial data tied to each client socket
 * @returns 
 */
export const makeSocketRoomConnector = <TEventsOnClient, TEventsOnManager, TInitialRoomState, TInitialSocketData>(
    receiver: TEventsOnClient,
    manageRoom: (manager: RoomManager<TEventsOnClient, TInitialRoomState, TInitialSocketData>) => HandleCommunicationFromClient<TEventsOnManager>,
    initialState: TInitialRoomState,
    initialSocketData: TInitialSocketData
): RoomAccessor<TEventsOnManager, TInitialRoomState> => {
    return {
        getRoomState: () => ({}) as TInitialRoomState,
        startRoom: (password, callback) => {

        },
        joinRoom: () => {

        },
        toRoomManager: (key, ...params) => {

        },
        async toRoomManagerAsync(key, ...params) {
            return await Promise.resolve() as any;
        },
    }
};