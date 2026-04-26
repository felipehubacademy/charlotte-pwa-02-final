// Complementa os tipos do react-native-webrtc com propriedades ausentes nas definições oficiais

declare module 'react-native-webrtc' {
  interface RTCPeerConnection {
    ontrack: ((event: any) => void) | null;
    oniceconnectionstatechange: ((event: any) => void) | null;
  }

  interface RTCDataChannel {
    onopen: ((event: any) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
  }

  const mediaDevices: {
    getUserMedia(constraints: { audio: boolean; video: boolean }): Promise<any>;
  };
}
