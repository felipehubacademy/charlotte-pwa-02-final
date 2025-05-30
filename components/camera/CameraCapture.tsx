'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Check, RotateCcw } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get instruction text based on user level
  const getInstructionText = () => {
    if (userLevel === 'Novice') {
      return 'Centralize o objeto';
    }
    return 'Center the object';
  };

  // Initialize camera stream
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('📸 Initializing camera for photo capture only...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      console.log('✅ Camera stream initialized');
    } catch (err) {
      console.error('❌ Camera initialization failed:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  // Cleanup camera stream
  const cleanupCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      initializeCamera();
    }
    
    return () => {
      if (!isOpen) {
        cleanupCamera();
      }
    };
  }, [isOpen, capturedImage, initializeCamera, cleanupCamera]);

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    // Stop camera stream
    cleanupCamera();
    
    setTimeout(() => setIsCapturing(false), 300);
  }, [cleanupCamera]);

  // Handle file selection (fallback)
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsCapturing(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        setIsCapturing(false);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle zoom with pinch gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      (e.currentTarget as any).initialDistance = distance;
      (e.currentTarget as any).initialZoom = zoom;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && (e.currentTarget as any).initialDistance) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = distance / (e.currentTarget as any).initialDistance;
      const newZoom = Math.min(Math.max((e.currentTarget as any).initialZoom * scale, 1), 3);
      setZoom(newZoom);
    }
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setZoom(1);
    initializeCamera();
  }, [initializeCamera]);

  // Send photo
  const sendPhoto = async () => {
    if (!capturedImage) return;
    
    setIsLoading(true);
    
    try {
      onCapture(capturedImage);
      onClose();
    } catch (error) {
      console.error('Failed to send photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    cleanupCamera();
    setCapturedImage(null);
    setZoom(1);
    onClose();
  };

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
                onClick={handleClose}
                className="p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-white font-semibold text-lg">
                {userLevel === 'Novice' ? 'Tire uma foto' : 'Take a photo'}
              </h2>
              
              <div className="w-10" /> {/* Spacer */}
            </div>
          </div>

          {/* Camera/Preview Area */}
          <div className="flex-1 relative overflow-hidden">
            {capturedImage ? (
              /* Photo Preview with Zoom */
              <div 
                ref={containerRef}
                className="w-full h-full flex items-center justify-center bg-black"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center'
                  }}
                />
              </div>
            ) : error ? (
              /* Error State */
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
                <Camera size={64} className="text-white/30 mb-4" />
                <p className="text-center text-lg mb-4">{error}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-primary text-black rounded-lg font-medium"
                >
                  {userLevel === 'Novice' ? 'Escolher da galeria' : 'Choose from gallery'}
                </button>
              </div>
            ) : (
              /* Live Camera Feed */
              <div className="relative w-full h-full bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Focus indicator with instruction */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 border-2 border-white/50 rounded-lg mb-4"></div>
                  <p className="text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                    {getInstructionText()}
                  </p>
                </div>

                {/* Capture Animation */}
                <AnimatePresence>
                  {isCapturing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
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
                <div className="flex items-center justify-center space-x-8">
                  {/* Gallery button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                  >
                    <div className="w-6 h-6 bg-white/70 rounded border-2 border-white/50"></div>
                  </button>
                  
                  {/* Capture button */}
                  <button
                    onClick={handleCameraCapture}
                    disabled={!stream}
                    className="w-20 h-20 bg-white rounded-full hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center shadow-lg disabled:opacity-50"
                  >
                    <div className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center">
                      <Camera size={24} className="text-gray-600" />
                    </div>
                  </button>
                  
                  {/* Switch camera button (placeholder) */}
                  <button
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                  >
                    <RotateCcw size={24} className="text-white" />
                  </button>
                </div>
              )}
              
              {/* Zoom indicator */}
              {capturedImage && zoom > 1 && (
                <div className="mt-4 text-center">
                  <p className="text-white/70 text-sm">
                    Zoom: {zoom.toFixed(1)}x
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Hidden file input for gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraCapture;