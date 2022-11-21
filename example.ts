import { makeSocketRoomConnector } from "./client";

const initialState = {
    happy: 4,
    people: [] as string[]
};

const initalSocketData = {
    name: ""
}

const receiver = {
    setRole: (role: string) => {

    },
    update: () => {

    }
};

const a = makeSocketRoomConnector(
    receiver,
    (manager) => ({
        getRole: (callback: (role: string) => void) => {
            const { people } = manager.getState();
            const newPerson = "someone else";
            manager.setElement("people", [...people, newPerson]);
            callback(newPerson);
            manager.toSender("update");
            manager.setSenderData({
                name: "Role"
            });
        },
        init: (x: number) => {
            manager.toSender("update");
            //manager.setState("")
        },
        onJoin: () => {
            const { people } = manager.getState();
            manager.setSenderData({ name: people[0] });
            manager.toSender("setRole", "captain");
            manager.toRoomExcludingSender();
        }
    }),
    initialState,
    initalSocketData
);


a.startRoom("secret123", (code) => {
    a.getRoomState().people;
    console.log(code);
});

a.toRoomManager("getRole", (role: string) => {

});

a.joinRoom("334", "secret123", (state) => {
    if (!state.success) {
        // handler error
        return;
    }

    const { value } = state;
})

a.toRoomManager("init", 4);

const role = await a.toRoomManagerAsync("getRole");
