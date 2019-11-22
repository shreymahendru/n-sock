import * as SocketIOClient from "socket.io-client";
import { given } from "@nivinjoseph/n-defensive";
import { SocketClient } from "./socket-client";


export class SocketFrontEndClient  implements SocketClient
{
    private readonly _socketClient: SocketIOClient.Socket;
    
    
    public constructor(url: string)
    {
        given(url, "url").ensureHasValue().ensureIsString();
        
        this._socketClient = SocketIOClient(url, {
            // WARNING: in that case, there is no fallback to long-polling
            transports: ["websocket"] // or [ 'websocket', 'polling' ], which is the same thing
        });
        
        
    }
}