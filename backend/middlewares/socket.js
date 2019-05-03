/* eslint-disable import/prefer-default-export */
export const conneXionListener = (io, socket) => {
    console.log('Socket connecting... ');
    socket.send('You have been connected!')

    const connections = [];
    const users = [];
    connections.push(socket);
    const {id} = socket;

    const updateUserListRoom = (usersArray, sockets = {}, room, source) => {
    const roomUsers = []
    const socketIds = Object.keys(sockets)
    socketIds.forEach((sId) => {
        usersArray.forEach((user) => {
        if(user.socketId === sId) {
            roomUsers.push(user)
        }
        })
    });
    const data = {
        users: roomUsers,
        room
    }
    console.log('data: ', data);
    if(source === "disconnected") {
        socket.to(room).emit('update room users', data);
    } else {
        io.in(room).emit('update room users', data);
    }
    }

    const userLeftApp = (user) => {
    const data = {
        message: `${user || "someone"  } has left the APP.`
    }
    socket.to("general").emit("user left app", {...data, room: "general"})
    socket.to("socketio").emit("user left app", {...data, room: "socketio"})
    socket.to("news").emit("user left app", {...data, room: "news"})
    updateUserListRoom(users, io.sockets.adapter.rooms.general, "general", "disconnected")
    updateUserListRoom(users, io.sockets.adapter.rooms.socketio, "socketio", "disconnected")
    updateUserListRoom(users, io.sockets.adapter.rooms.news, "news", "disconnected")
    }

    socket.on('disconnect', () => {
    console.log("someone disconnected")
    let user = ''
    Object.entries(users).forEach(([key, value]) => {
        if(value.socketId === id) {
        user = value.name
        users.splice(key, 1);
        }
    })
    connections.splice(connections.indexOf(socket), 1);
    console.log(`${user} disconnected: %s sockets connected`, connections.length);
    userLeftApp(user)
    })

    socket.on('new user', (data) => {
    const userInfo = {
        socketId: socket.id,
        name: data.name,
        createdAt: new Date()
    }
    socket.userInfo = userInfo;
    users.push(userInfo)

    const newData = {
        socketId: socket.id,
        name: data.name,
        room: data.room,
        createdAt: new Date(),
        users
    }

    const newUserData = {
        ...newData,
        message: 'welcome to the app. Enjoy your stay!'
    }
    const newJoinUserData = {
        ...newData,
        message: 'has joined. Say Hi!'
    }
    socket.join(data.room);
    socket.to(data.room).emit('new user joined notify', newJoinUserData);
    socket.emit('welcome new user notify', newUserData)
    updateUserListRoom(users, io.sockets.adapter.rooms[data.room].sockets, data.room)
    })

    socket.on('send message', (data) => {
    const messageDetails = {
        ...data,
        ...socket.userInfo,
        createdAt: new Date()
    }
    console.log(messageDetails)
    if(data.type === "group") {
        io.in(messageDetails.room).emit('new message', messageDetails);
    } else {
        io.in(messageDetails.room).emit('new message', messageDetails);
    }
    });

    socket.on('join room', (data) => {
    const socketRoom = io.sockets.adapter.rooms[data.room];
    if(!socketRoom || !socketRoom.sockets[socket.userInfo.socketId]) {
        const payload = {
        ...socket.userInfo,
        room: data.room,
        message: `You are now a member of ${data.room}`
        }
        const otherPayload = {
        ...payload,
        room: data.room,
        message: `${payload.name} is now a member of this group. Say Hi!`
        }
        socket.join(data.room);
        socket.emit('group new member', payload);
        socket.to(data.room).emit('group new member notify other', otherPayload);
        updateUserListRoom(users, io.sockets.adapter.rooms[data.room].sockets, data.room)
    }
    });

    socket.on('user left', (data, callback) => {
    const userLeftData = {
        ...socket.userInfo,
        room: data.room,
        message: `${socket.userInfo.name} has left ${data.room}!`,
        createdAt: new Date()
    }
    socket.leave(userLeftData.room);
    socket.to(userLeftData.room).emit('user left notify', userLeftData);
    updateUserListRoom(users, io.sockets.adapter.rooms[data.room].sockets, data.room)
    callback();
    });
}