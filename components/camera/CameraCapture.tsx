'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get instruction text based on user level
  const getInstructionText = () => {
    if (userLevel === 'Novice') {
      return 'Centralize o objeto na foto para Charlotte te dizer o nome em inglês';
    }
    return 'Center the object in the photo for Charlotte to tell you its name in English';
  };

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Handle file selection
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
  }, []);

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
                  ref={imageRef}
                  src={capturedImage}
                  alt="Captured"
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center'
                  }}
                />
              </div>
            ) : (
              /* Camera Instructions */
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900">
                {/* Instruction Text */}
                <div className="absolute top-1/3 left-4 right-4 text-center z-10">
                  <p className="text-white text-lg font-medium mb-2">
                    {getInstructionText()}
                  </p>
                  <div className="w-32 h-32 border-2 border-white/50 rounded-lg mx-auto flex items-center justify-center">
                    <Camera size={48} className="text-white/50" />
                  </div>
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
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleCameraCapture}
                    className="w-20 h-20 bg-white rounded-full hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center shadow-lg"
                  >
                    <div className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center">
                      <Camera size={24} className="text-gray-600" />
                    </div>
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

          {/* Hidden file input for camera */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraCapture;