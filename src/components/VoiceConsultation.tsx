import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface VoiceConsultationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptMessage {
  role: string;
  text: string;
  timestamp: Date;
}

// Audio utilities
const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

const createWavFromPCM = (pcmData: Uint8Array): Uint8Array => {
  const int16Data = new Int16Array(pcmData.length / 2);
  for (let i = 0; i < pcmData.length; i += 2) {
    int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
  }
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + int16Data.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, int16Data.byteLength, true);

  const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
  wavArray.set(new Uint8Array(wavHeader), 0);
  wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
  
  return wavArray;
};

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = createWavFromPCM(audioData);
      const arrayBuffer = wavData.buffer.slice(0);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer as ArrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

const VoiceConsultation = ({ isOpen, onClose }: VoiceConsultationProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioQueueRef.current) {
      audioQueueRef.current.clear();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startCall = async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      mediaStreamRef.current = stream;
      
      // Initialize audio context and queue
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      
      // Connect to WebSocket
      const wsUrl = `wss://dowwgiiqwfxfvnnwurxq.supabase.co/functions/v1/voice-consultation`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Connected to voice service');
        setIsCallActive(true);
        setIsConnecting(false);
        
        // Set up audio recording
        if (audioContextRef.current && mediaStreamRef.current) {
          sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
          processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
          
          processorRef.current.onaudioprocess = (e) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64Audio = encodeAudioForAPI(new Float32Array(inputData));
              wsRef.current.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: base64Audio
              }));
            }
          };
          
          sourceRef.current.connect(processorRef.current);
          processorRef.current.connect(audioContextRef.current.destination);
        }
      };
      
      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data.type);
        
        if (data.type === 'response.audio.delta') {
          setIsSpeaking(true);
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await audioQueueRef.current?.addToQueue(bytes);
        } else if (data.type === 'response.audio.done') {
          setIsSpeaking(false);
        } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
          setTranscript(prev => [...prev, {
            role: 'user',
            text: data.transcript,
            timestamp: new Date()
          }]);
        } else if (data.type === 'response.audio_transcript.delta') {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return prev.map((msg, i) => 
                i === prev.length - 1 
                  ? { ...msg, text: msg.text + data.delta }
                  : msg
              );
            }
            return [...prev, {
              role: 'assistant',
              text: data.delta,
              timestamp: new Date()
            }];
          });
        } else if (data.type === 'error') {
          console.error('Error:', data.error);
          toast.error(data.error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error. Please try again.');
        setIsConnecting(false);
        cleanup();
      };
      
      wsRef.current.onclose = () => {
        console.log('Connection closed');
        setIsCallActive(false);
        setIsSpeaking(false);
        setIsConnecting(false);
      };
      
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Could not access microphone. Please grant permission.');
      setIsConnecting(false);
      cleanup();
    }
  };

  const endCall = () => {
    cleanup();
    setIsCallActive(false);
    setIsSpeaking(false);
    setTranscript([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-deep-charcoal rounded-2xl shadow-2xl max-w-2xl w-full border border-auro-gold/30">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-auro-gold/20 to-electric-blue/20 p-6 border-b border-auro-gold/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-auro-gold flex items-center justify-center text-2xl">
                🧘
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AuraQ Wellness Coach</h2>
                <p className="text-soft-graphite text-sm">Physical & Mental Fitness Support</p>
              </div>
            </div>
            <button onClick={onClose} className="text-soft-graphite hover:text-white transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {!isCallActive && !isConnecting ? (
            // Start Screen
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-auro-gold/20 flex items-center justify-center mb-6">
                <svg className="w-16 h-16 text-auro-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              
              <h3 className="text-white text-2xl font-bold mb-4">
                Free AI Wellness Consultation
              </h3>
              
              <p className="text-soft-graphite mb-6 leading-relaxed max-w-lg mx-auto">
                Get personalized guidance for starting your fitness journey or support with motivation 
                and mental wellness challenges. No signup required.
              </p>
              
              <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-white">
                  <strong className="text-electric-blue">We can help with:</strong><br/>
                  Starting fitness routines • Goal setting • Motivation & energy<br/>
                  Overcoming anxiety • Depression support • Building habits
                </p>
              </div>

              <button
                onClick={startCall}
                className="bg-auro-gold hover:bg-auro-gold/90 text-deep-charcoal font-bold py-4 px-8 rounded-lg text-lg transition-all hover:scale-105 mb-4">
                🎤 Start Voice Consultation
              </button>
              
              <p className="text-soft-graphite text-xs">
                Your microphone will be accessed for this call
              </p>
            </div>
          ) : isConnecting ? (
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-auro-gold/20 flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-16 h-16 text-auro-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Connecting...</h3>
              <p className="text-soft-graphite text-sm">Setting up your wellness consultation</p>
            </div>
          ) : (
            // Active Call Screen
            <div>
              <div className="text-center mb-6">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${
                  isSpeaking ? 'bg-auro-gold animate-pulse scale-110' : 'bg-auro-gold/20'
                }`}>
                  <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
                
                <h3 className="text-white text-xl font-semibold mb-2">
                  {isSpeaking ? 'Coach is speaking...' : 'Listening...'}
                </h3>
                <p className="text-soft-graphite text-sm">
                  Speak naturally about your fitness or wellness concerns
                </p>
              </div>

              {/* Transcript */}
              {transcript.length > 0 && (
                <div className="bg-deep-charcoal/50 rounded-lg p-4 max-h-64 overflow-y-auto mb-6 space-y-3">
                  {transcript.map((msg, idx) => (
                    <div key={idx} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block px-4 py-2 rounded-lg max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-auro-gold/20 text-white'
                          : 'bg-electric-blue/20 text-white border border-electric-blue/30'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={endCall}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg transition-all">
                End Consultation
              </button>
            </div>
          )}
        </div>

        {/* Sign-Up CTA (shows after conversation starts) */}
        {transcript.length > 3 && (
          <div className="p-6 bg-gradient-to-r from-auro-gold/20 to-electric-blue/20 border-t border-auro-gold/30">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="text-white font-semibold">Ready to start your journey?</h4>
                <p className="text-soft-graphite text-sm">Sign up to track your goals and progress</p>
              </div>
              <button 
                onClick={() => { onClose(); }}
                className="bg-auro-gold hover:bg-auro-gold/90 text-deep-charcoal font-bold py-3 px-6 rounded-lg transition-all">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceConsultation;
