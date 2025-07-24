'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import NotificationPreferences from './NotificationPreferences';

export default function NotificationPreferencesModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div
          key="notification-modal"
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="min-h-screen flex items-start justify-center p-4 pt-16 sm:pt-12 md:pt-8 lg:items-center lg:pt-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary backdrop-blur-md rounded-2xl p-4 sm:p-6 w-full border border-white/10 shadow-2xl
                         max-w-md max-h-[85vh] overflow-hidden relative z-[100]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Notificações</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto scrollbar-custom max-h-[70vh]">
                <NotificationPreferences />
              </div>
            </motion.div>
          </div>
        </div>
      )}
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(163, 255, 60, 0.3) transparent;
        }

        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(163, 255, 60, 0.3);
          border-radius: 2px;
          transition: background 0.2s ease;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 255, 60, 0.5);
        }

        .scrollbar-custom:hover {
          scrollbar-color: rgba(163, 255, 60, 0.5) transparent;
        }
      `}</style>
    </AnimatePresence>
  );
} 