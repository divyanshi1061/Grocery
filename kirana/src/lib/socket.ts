import {io, Socket} from "socket.io-client"

let socket:Socket|null=null
//connecting socket
export const getSocket=()=>{
    if(!socket){
        socket=io(process.env.NEXT_PUBLIC_SOCKET_SERVER)
    }
    return socket
}