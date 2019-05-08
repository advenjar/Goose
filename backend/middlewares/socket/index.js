/* eslint-disable import/prefer-default-export */
export const conneXionListener = (io, socket) => {
    socket.send('You\'re connected to the socketio')
    socket.on('error', (error) => {
        socket.send(error)
      });
    const connections = []
    connections.push(socket)
    
    socket.on('new_recon_app_user', (data) => {
        const rooms = []
        data.user.rooms.map((item) => rooms.push(item.room_name))
        socket.join(rooms, () => {
            const usrNotify = {
                data,
                message: data.source === 'login' ? 'welcome aboard' : 'welcome back',
                type: 'notify'
            }
            const usrNotifyOthers = {
                ...usrNotify,
                meesage: ''
            }

            socket.emit('new_recon_app_user_update', usrNotify);
            socket.broadcast.emit('new_recon_app_user_notify', {...usrNotifyOthers, message: "is back, say hi!"});

        })
    })

    socket.on('send_message', (data) => {
        const room = data.room.room_name
        io.in(room).emit('new_message', data);
    })

    socket.on('send_chat_invite_room', (data) => {
        io.to(data.recipient.socket_id).emit('invitation_notify', data)
    })

    socket.on('send_chat_invite_accepted', (data) => {
        const newData = {
            ...data,
            message: `${data.recipient.name} accepted your chat invitation!`
        }
        io.to(data.inviter.socket_id).emit('invitation_accepted', newData)
    })

    socket.on('add_new_room', (data) => {
        socket.join(data.room.room_name, () => {
            if(data.room.type === 'private') {
                socket.to(data.room.room_nam).emit('notify_new_convo', {...data.room, message: `You and ${data.user.user_name} are now connected!`});
            } else {
                // group
                // emit group data
            }
        })
        io.emit('new_room', data.room);
        socket.emit('new_room_update_me', {...data});
    })
    
}