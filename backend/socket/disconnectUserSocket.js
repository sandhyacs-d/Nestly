export async function disconnectUserSockets(io, userId) {
    const userRoom = `user:${userId}`;

    const sockets = await io.in(userRoom).fetchSockets();

    for (const socket of sockets) {
        socket.disconnect(true);
    }
}