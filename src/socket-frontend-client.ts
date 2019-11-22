import * as SocketIOClient from "socket.io-client";
import { given } from "@nivinjoseph/n-defensive";
import { Disposable } from "@nivinjoseph/n-util";


/**
 * This should only listen (subscribe) to events, should not emit (publish)
 */
export class SocketFrontEndClient implements Disposable
{
    private readonly _serverUrl: string;
    private readonly _channels: Map<string, SocketIOClient.Socket>;
    
    private _isDisposed: boolean;
    
    
    public constructor(serverUrl: string)
    {
        given(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        serverUrl = serverUrl.trim();
        if (serverUrl.endsWith("/"))
            serverUrl = serverUrl.substr(0, serverUrl.length - 1);
        
        this._serverUrl = serverUrl;    
        
        this._channels = new Map<string, SocketIOClient.Socket>();
        
        this._isDisposed = false;
    }
    
    
    public subscribe(channel: string, event: string, handler: (data: any) => void): void
    {
        given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        
        given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        
        given(handler, "handler").ensureHasValue().ensureIsFunction();
        
        if (!this._channels.has(channel))
            this._channels.set(channel, this.createChannel(channel));

        const socket = this._channels.get(channel);
        
        socket.on(event, handler);
    }
    
    public unsubscribe(channel: string, event?: string, handler?: (data: any) => void): void
    {
        given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        
        if (!this._channels.has(channel))
            return;
        
        const socket = this._channels.get(channel);
        
        if (!event)
        {
            socket.close();
            this._channels.delete(channel);
            return;
        }
        
        given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        
        given(handler as Function, "handler").ensureIsFunction();
        
        socket.off(event, handler || null);
    }
    
    
    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            for (const value of this._channels.values())
                value.close();
        }
        
        return Promise.resolve();
    }
    
    private createChannel(channel: string): SocketIOClient.Socket
    {
        given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        
        return SocketIOClient.connect(`${this._serverUrl}/${channel}`, {
            // WARNING: in that case, there is no fallback to long-polling
            transports: ["websocket"] // or [ 'websocket', 'polling' ], which is the same thing
        });
    }
}