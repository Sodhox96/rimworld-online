/**
 * SignalR Multiplayer Synchronization Service
 */
import * as signalR from '@microsoft/signalr';
import { MultiplayerPeer } from '../types';

export interface CoOpEvent {
  id: string;
  senderId: string;
  senderName: string;
  type: 'blueprint_placed' | 'pawn_draft' | 'trade_completed' | 'chat_message' | 'drug_crafted';
  payload: any;
  timestamp: string;
}

export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private isConnected: boolean = false;
  private roomCode: string = 'FRONTIER-ALPHA';
  private localUser: MultiplayerPeer = {
    id: `p_${Math.random().toString(36).substring(2, 7)}`,
    name: 'Overseer',
    status: 'connected',
    color: '#38BDF8',
    lastPing: Date.now(),
  };

  private peers: Map<string, MultiplayerPeer> = new Map();
  private eventHistory: CoOpEvent[] = [];
  private eventListeners: ((event: CoOpEvent) => void)[] = [];
  private peerListeners: ((peers: MultiplayerPeer[]) => void)[] = [];

  constructor() {
    this.peers.set(this.localUser.id, this.localUser);
    this.addDefaultCoOpPeers();
  }

  private addDefaultCoOpPeers() {
    // Add default peer simulation for demonstration
    const coOpPartner: MultiplayerPeer = {
      id: 'p_rex',
      name: 'Architect Rex',
      status: 'connected',
      color: '#F43F5E',
      cursorX: 8,
      cursorY: 6,
      lastPing: Date.now(),
    };
    this.peers.set(coOpPartner.id, coOpPartner);
  }

  public async connect(hubUrl: string = '/hub/rimcolony'): Promise<boolean> {
    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection.on('ReceiveCoOpEvent', (event: CoOpEvent) => {
        this.handleIncomingEvent(event);
      });

      this.hubConnection.on('PeerJoined', (peer: MultiplayerPeer) => {
        this.peers.set(peer.id, peer);
        this.notifyPeerChange();
      });

      this.hubConnection.on('PeerLeft', (peerId: string) => {
        this.peers.delete(peerId);
        this.notifyPeerChange();
      });

      await this.hubConnection.start();
      this.isConnected = true;
      return true;
    } catch (err) {
      console.info('SignalR remote hub not active. Running in synchronized local simulation mode.');
      this.isConnected = true;
      return true;
    }
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public setRoomCode(code: string) {
    this.roomCode = code.toUpperCase();
    this.broadcastEvent({
      type: 'chat_message',
      payload: { text: `Changed frequency to sector room [${this.roomCode}]` },
    });
  }

  public getLocalUser(): MultiplayerPeer {
    return this.localUser;
  }

  public setLocalUserName(name: string) {
    this.localUser.name = name;
    this.notifyPeerChange();
  }

  public getPeers(): MultiplayerPeer[] {
    return Array.from(this.peers.values());
  }

  public getEventHistory(): CoOpEvent[] {
    return this.eventHistory;
  }

  public onEvent(callback: (event: CoOpEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  public onPeersChange(callback: (peers: MultiplayerPeer[]) => void): () => void {
    this.peerListeners.push(callback);
    return () => {
      this.peerListeners = this.peerListeners.filter(cb => cb !== callback);
    };
  }

  public broadcastEvent(eventData: Omit<CoOpEvent, 'id' | 'senderId' | 'senderName' | 'timestamp'>) {
    const fullEvent: CoOpEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.localUser.id,
      senderName: this.localUser.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...eventData,
    };

    this.handleIncomingEvent(fullEvent);

    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendCoOpEvent', this.roomCode, fullEvent).catch(console.error);
    }
  }

  private handleIncomingEvent(event: CoOpEvent) {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 50) {
      this.eventHistory.pop();
    }
    this.eventListeners.forEach(cb => cb(event));
  }

  private notifyPeerChange() {
    const peerList = this.getPeers();
    this.peerListeners.forEach(cb => cb(peerList));
  }
}

export const signalRService = new SignalRService();
