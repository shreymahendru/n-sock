import * as Http from "http";
import { given } from "@nivinjoseph/n-defensive";
import * as SocketIo from "socket.io";
import * as SocketIoRedis from "socket.io-redis";
import * as Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";


/**
 * This should only manage socket connections, should not emit (publish) or listen (subscribe)??
 */
export class SocketServer implements Disposable
{
    private readonly _socketServer: SocketIo.Server;
    private readonly _redisClient: Redis.RedisClient;
    private _isDisposed = false;
    private _disposePromise: Promise<void> | null = null;
    
    
    public constructor(httpServer: Http.Server, corsOrigin: string, redisUrl?: string)
    {
        given(httpServer, "httpServer").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Http.Server);
        given(corsOrigin, "corsOrigin").ensureHasValue().ensureIsString();
        
        // this._socketServer = new SocketIo.Server(httpServer, {
        //     transports: ["websocket"],
        //     pingInterval: 10000,
        //     pingTimeout: 5000,
        //     serveClient: false
        // });
        
        this._socketServer = new SocketIo.Server(httpServer, {
            transports: ["websocket"],
            serveClient: false,
            cors: {
                origin: corsOrigin,
                methods: ["GET", "POST"]
            }
        });
        
        given(redisUrl, "redisUrl").ensureIsString();
        this._redisClient = redisUrl && redisUrl.isNotEmptyOrWhiteSpace()
            ? Redis.createClient(redisUrl)
            : Redis.createClient();
        
        this._socketServer.adapter(SocketIoRedis.createAdapter({
            pubClient: this._redisClient,
            subClient: this._redisClient
        }));
        
        this.initialize();
    }   
    
    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            this._disposePromise = new Promise((resolve, _) =>
                this._socketServer.close(() => this._redisClient.quit(() => resolve())));
        }

        return this._disposePromise;
    }
    
    private initialize(): void
    {
        this._socketServer.on("connection", (socket: SocketIo.Socket) =>
        {
            console.log("Client connected", socket.id);

            socket.on("n-sock-join_channel", (data: { channel: string }) =>
            {
                given(data, "data").ensureHasValue().ensureIsObject().ensureHasStructure({ channel: "string" });

                console.log(`Client ${socket.id} joining channel ${data.channel}`);
                
                const nsp = this._socketServer.of(`/${data.channel}`);
                
                socket.emit(`n-sock-joined_channel/${data.channel}`, { channel: nsp.name.substr(1) });
                
                console.log(`Client ${socket.id} joined channel ${nsp.name.substr(1)}`);
            });
        });
    }
}