export interface ServerReadyEvent {
  port: number;
  url: string;
}

export interface PortEvent {
  port: number;
  type: 'open' | 'close';
  url: string;
}

export interface ServerInfo {
  port: number;
  url: string;
}
