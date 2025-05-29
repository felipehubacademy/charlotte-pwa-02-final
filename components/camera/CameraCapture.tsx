'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Check, RotateCcw, Zap } from 'lucide-react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  userLevel
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      console.log('🎥 Initializing camera...');

      // iOS specific camera constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          // iOS specific settings
          aspectRatio: { ideal: 16/9 }
        }
      };

      console.log('🎥 Requesting camera with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera stream obtained:', mediaStream.getVideoTracks()[0]?.getSettings());

      setStream(mediaStream);
      
      if (videoRef.current && mediaStream) {
        console.log('🎥 Setting video source...');
        videoRef.current.srcObject = mediaStream;
        
        // iOS specific attributes
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        
        // Wait for metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded, starting playback...');
          if (videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('✅ Video playback started successfully');
                })
                .catch(error => {
                  console.error('❌ Video play failed:', error);
                });
            }
          }
        };
        
        // Handle video errors
        videoRef.current.onerror = (error) => {
          console.error('❌ Video error:', error);
        };
      }
    } catch (error) {
      console.error('❌ Camera access failed:', error);
      // Show user-friendly error message
    }
  }, [facingMode, stream]);

  // Start camera when modal opens
  React.useEffect(() => {
    if (isOpen && !capturedImage) {
      // Detect if it's mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       window.innerWidth <= 768;
      
      if (isMobile) {
        // Add a small delay to ensure modal is fully rendered
        setTimeout(() => {
          initializeCamera();
        }, 100);
      } else {
        // Show desktop message
        console.log('Camera only available on mobile devices');
      }
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
  }, [isOpen, capturedImage, initializeCamera, stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx?.drawImage(video, 0, 0);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    // Stop video stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Capture animation
    setTimeout(() => setIsCapturing(false), 200);
  }, [stream]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    initializeCamera();
  }, [initializeCamera]);

  // Send photo
  const sendPhoto = async () => {
    if (!capturedImage) return;
    
    setIsLoading(true);
    
    try {
      // Call the onCapture callback with image data
      onCapture(capturedImage);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to send photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle camera (front/back)
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-black/80 backdrop-blur-sm pt-safe">
            <div className="flex items-center justify-between px-4 py-4">
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-white font-semibold text-lg">
                {userLevel === 'Novice' ? 'Tire uma foto' : 'Take a photo'}
              </h2>
              
              <button
                onClick={toggleCamera}
                disabled={!!capturedImage}
                className="p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              >
                <RotateCcw size={24} />
              </button>
            </div>
          </div>

          {/* Camera/Preview Area */}
          <div className="flex-1 relative overflow-hidden">
            {capturedImage ? (
              /* Photo Preview */
              <div className="w-full h-full flex items-center justify-center bg-black">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              /* Live Camera Feed */
              <div className={`relative w-full h-full flex items-center justify-center bg-black ${
                typeof window !== 'undefined' && 
                ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches)
                  ? 'camera-container' 
                  : ''
              }`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  webkit-playsinline="true"
                  className="w-full h-full object-cover"
                  style={{
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                />
                
                {/* Camera overlay grid */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                </div>

                {/* Focus indicator */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  animate={isCapturing ? { opacity: [1, 0] } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-20 h-20 border-2 border-white rounded-lg" />
                </motion.div>

                {/* Capture flash effect */}
                <AnimatePresence>
                  {isCapturing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-white"
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 bg-black/80 backdrop-blur-sm pb-safe">
            <div className="px-6 py-6">
              {capturedImage ? (
                /* Preview Controls */
                <div className="flex items-center justify-center space-x-8">
                  <button
                    onClick={retakePhoto}
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                  >
                    <RotateCcw size={24} className="text-white" />
                  </button>
                  
                  <button
                    onClick={sendPhoto}
                    disabled={isLoading}
                    className="p-4 bg-primary hover:bg-primary-dark rounded-full transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full" />
                    ) : (
                      <Check size={24} className="text-black" />
                    )}
                  </button>
                </div>
              ) : (
                /* Camera Controls */
                <div className="flex items-center justify-center">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 bg-white rounded-full hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center shadow-lg"
                  >
                    <div className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center">
                      <Camera size={24} className="text-gray-600" />
                    </div>
                  </button>
                </div>
              )}
              
              {/* Instructions */}
              <div className="mt-4 text-center">
                <p className="text-white/70 text-sm">
                  {capturedImage ? (
                    userLevel === 'Novice' 
                      ? 'Charlotte vai identificar o objeto na foto'
                      : 'Charlotte will identify the object in the photo'
                  ) : (
                    userLevel === 'Novice' 
                      ? 'Posicione o objeto no centro da tela'
                      : 'Position the object in the center of the screen'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraCapture;