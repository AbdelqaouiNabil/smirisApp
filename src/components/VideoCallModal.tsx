import React, { useState, useEffect } from 'react';
import { X, Phone, Video, Mic, MicOff, VideoOff, Settings, MessageCircle, Users } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: number;
    studentName: string;
    studentEmail: string;
    subject: string;
    duration: number;
  };
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({ isOpen, onClose, booking }) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Users className="text-emerald-600" size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{booking.subject}</div>
              <div className="text-sm text-gray-600">{booking.studentName}</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {formatTime(timeElapsed)} / {booking.duration}:00
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Area */}
          <div className="flex-1 relative bg-gray-900">
            {/* Main Video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <div className="text-lg font-medium">Video-Call wird vorbereitet...</div>
                <div className="text-sm text-gray-400 mt-2">
                  Verbindung zu {booking.studentName} wird hergestellt
                </div>
              </div>
            </div>

            {/* Self Video (Picture in Picture) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white">
              <div className="w-full h-full flex items-center justify-center text-white text-sm">
                Ihr Video
              </div>
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm">Aufnahme läuft</span>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="w-80 bg-gray-50 border-l flex flex-col">
            {/* Controls */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-3 rounded-full ${
                    isAudioEnabled ? 'bg-gray-200 text-gray-700' : 'bg-red-500 text-white'
                  }`}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`p-3 rounded-full ${
                    isVideoEnabled ? 'bg-gray-200 text-gray-700' : 'bg-red-500 text-white'
                  }`}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`p-3 rounded-full ${
                    isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="w-5 h-5 border-2 border-current rounded"></div>
                </button>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Section */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Chat</h3>
                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {isChatOpen && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-emerald-500 text-white px-3 py-2 rounded-lg max-w-xs">
                          <div className="text-sm">Hallo! Bereit für die Sitzung?</div>
                          <div className="text-xs opacity-75 mt-1">14:30</div>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg max-w-xs">
                          <div className="text-sm">Ja, gerne! Können wir mit der Grammatik beginnen?</div>
                          <div className="text-xs opacity-75 mt-1">14:31</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Nachricht eingeben..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                        Senden
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="p-4 border-t bg-white">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Student:</span>
                  <span className="font-medium">{booking.studentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fach:</span>
                  <span className="font-medium">{booking.subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dauer:</span>
                  <span className="font-medium">{booking.duration} Minuten</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-emerald-600 font-medium">Aktiv</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 