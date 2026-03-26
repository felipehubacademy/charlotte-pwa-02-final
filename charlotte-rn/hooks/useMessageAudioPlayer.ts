/**
 * useMessageAudioPlayer
 *
 * Replaces the `useAudioPlayer(undefined) + player.replace()` pattern that
 * failed to hot-swap audio sources reliably on expo-audio SDK 54.
 *
 * Uses `createAudioPlayer` imperatively: each play creates a fresh player
 * instance bound to the exact URI, guaranteeing the correct track plays.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

export function useMessageAudioPlayer() {
  const playerRef              = useRef<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playing, setPlaying]     = useState(false);

  // Release player when the screen unmounts
  useEffect(() => {
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  /** Stop and destroy the current player instance */
  const _stop = useCallback(() => {
    try { playerRef.current?.remove(); } catch {}
    playerRef.current = null;
    setPlaying(false);
    setPlayingId(null);
  }, []);

  /** Start playing a message's audio. Always creates a fresh player. */
  const _play = useCallback((id: string, uri: string) => {
    // Destroy any previous player first
    try { playerRef.current?.remove(); } catch {}
    playerRef.current = null;

    const p = createAudioPlayer({ uri });
    p.volume = 0.75;

    // Listen for natural end of playback
    const sub = p.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
        sub.remove();
        setPlaying(false);
        setPlayingId(null);
      }
    });

    playerRef.current = p;
    p.play();
    setPlayingId(id);
    setPlaying(true);
  }, []);

  /**
   * Toggle playback for a message.
   * - Same id + playing  → pause & stop
   * - Same id + paused   → resume
   * - Different id       → stop current, start new
   */
  const toggle = useCallback(
    (id: string, uri: string) => {
      if (playingId === id) {
        if (playing) {
          _stop();
        } else {
          // Resume — reuse existing player if still alive
          if (playerRef.current) {
            playerRef.current.play();
            setPlaying(true);
            setPlayingId(id);
          } else {
            _play(id, uri); // player was removed, recreate
          }
        }
      } else {
        _play(id, uri);
      }
    },
    [playingId, playing, _play, _stop]
  );

  return {
    /** ID of the message currently playing (or null) */
    playingMessageId: playingId,
    /** Whether audio is actively playing */
    isPlaying: playing,
    /** Toggle playback — pass the message id and its audio URI */
    toggle,
    /** Imperatively stop playback */
    stop: _stop,
  };
}
