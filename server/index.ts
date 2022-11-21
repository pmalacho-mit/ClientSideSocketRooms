import { Server, Socket } from "socket.io";
import { DisconnectReason } from "socket.io/dist/socket";
import RoomCodeGenerator from "./RoomCodeGenerator";

const generator = new RoomCodeGenerator();

export type Response<T> = (Success & { value: T }) | (Failure & { error: string });
export interface ServerToClientEvents {
    update: (state: any) => void;
    process: (key: string, data: any, callback?: any) => void;
}

export interface ClientToServerEvents<TState> {
    startRoom: (password: string, callback: (code: Response<string>) => void) => void;
    joinRoom: (code: string, password: string, callback: (state: Response<TState>) => void) => void;
    toRoom: (code: string, key: string, data: any) => void;
}

type Success = { success: true };
type Failure = { success: false };
const succeed = <T>(value: T): Response<T> & Success => ({ success: true, value });
const fail = <T>(error: string): Response<T> & Failure => ({ success: false, error });

interface InterServerEvents {
}

interface SocketData {
    roomCode: string;
    domain?: Record<string, any>;
}

type ServerSideSocket = Socket<ClientToServerEvents<any>, ServerToClientEvents, InterServerEvents, SocketData>

type Room = {
    password: string;
    sockets: Map<string, ServerSideSocket>;
    main: ServerSideSocket;
    state: any;
};

const rooms = new Map<string, Room>();

const errorOut = (msg: string) => {
    console.error(msg);
    return false;
}

const updateMainSocket = (room: Room) => {
    // could be smarter, like prioritize most stable / optimal socket
    room.main = room.sockets.values[0];
}

const deleteSocketFromRoom = (room: Room, { id }: ServerSideSocket, deleteRoom: () => void) => {
    const { sockets, main } = room;
    sockets.delete(id);
    const roomEmpty = sockets.size === 0;
    if (roomEmpty) return deleteRoom();
    const wasMain = main.id === id;
    if (wasMain) updateMainSocket(room);
}

const tryRemoveSocketFromRoom = (socket: ServerSideSocket): boolean => {
    const { data } = socket;
    if (!data) return errorOut("Data not set on socket");

    const { roomCode } = data;
    if (!roomCode) return errorOut("Room code not found on socket's data");

    if (!rooms.has(roomCode)) return errorOut(`Room not found: ${roomCode}`);

    const room = rooms.get(roomCode) as Room;
    deleteSocketFromRoom(room, socket, () => {
        rooms.delete(roomCode);
        generator.release(roomCode);
    });

    return true;
}

const assignSocketToRoom = (code: string, room: Room, socket: ServerSideSocket) => {
    room.sockets.set(socket.id, socket);
    socket.data = {
        roomCode: code
    };
}

const io = new Server<ClientToServerEvents<any>, ServerToClientEvents, InterServerEvents, SocketData>();

io.on("connection", (socket) => {

    socket.on("disconnect", (reason: DisconnectReason) => {
        console.log(`Disconnect on: ${reason}`);
        tryRemoveSocketFromRoom(socket);
    });

    socket.on("startRoom", (password, initalState, callback) => {
        const code = generator.getNext();
        const room: Room = { password, main: socket, sockets: new Map(), state: initalState };
        rooms.set(code, room);
        assignSocketToRoom(code, room, socket)
        callback(succeed(code));
        socket.join(code);
    });

    socket.on("joinRoom", (code, password, callback) => {
        if (!rooms.has(code)) return callback(fail("Room does not exist"));

        const room = rooms.get(code) as Room;
        const { password: correctPassword, state } = room;
        if (password !== correctPassword) return callback(fail("Incorrect password"));

        assignSocketToRoom(code, room, socket)
        callback(succeed(state));
        socket.join(code);
    });

    socket.on("toRoom", (code, key, data, callback?) => {
        if (!rooms.has(code)) return console.log("Doesn't exist");

        const room = rooms.get(code) as Room;

        callback
            ? room.main.emit("process", key, data, (...params) => { callback(...params) })
            : room.main.emit("process", key, data);
    });

    // room specific comms
});