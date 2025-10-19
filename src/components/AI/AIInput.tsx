/**
 * AI Input Component
 * Text input for sending AI commands
 */

import { useState, forwardRef, useEffect } from 'react';

interface AIInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const AIInput = forwardRef<HTMLInputElement, AIInputProps>(
  ({ onSendMessage, isLoading, initialValue }, ref) => {
    const [value, setValue] = useState('');

    // Set initial value if provided
    useEffect(() => {
      if (initialValue) {
        setValue(initialValue);
      }
    }, [initialValue]);

    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed || isLoading) return;

      onSendMessage(trimmed);
      setValue('');
    };

    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    // no external usage; keep local inside onstop

    const startRecording = async () => {
      if (isLoading || isRecording) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const localChunks: BlobPart[] = [];
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            localChunks.push(e.data);
          }
        };
        mr.onstop = async () => {
          const blob = new Blob(localChunks, { type: 'audio/webm' });
          const transcribeViaOpenAI = async (): Promise<string | null> => {
            try {
              if (!(import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY)) return null;
              const { default: OpenAI } = await import('openai');
              const client = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
                dangerouslyAllowBrowser: true,
              });
              const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
              const result = await client.audio.transcriptions.create({
                model: 'gpt-4o-mini-transcribe',
                file,
              });
              const text = (result as unknown as { text?: string }).text;
              return typeof text === 'string' ? text : null;
            } catch {
              return null;
            }
          };

          const transcribeViaServer = async (): Promise<string | null> => {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              const resp = await fetch('/api/stt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' }),
              });
              if (!resp.ok) return null;
              const data = await resp.json();
              return typeof data?.text === 'string' ? data.text : null;
            } catch {
              return null;
            }
          };

          try {
            // Prefer direct OpenAI in dev for local testing; then server
            let text: string | null = await transcribeViaOpenAI();
            if (!text) text = await transcribeViaServer();
            if (text) {
              onSendMessage(text);
            }
          } finally {
            setIsRecording(false);
            setMediaRecorder(null);
          }
        };
        mr.start();
        setMediaRecorder(mr);
        // keep chunks local
        setIsRecording(true);
      } catch {
        // microphone permission or setup error
      }
    };

    const stopRecording = () => {
      if (!mediaRecorder) return;
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      }
    };

    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 relative">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isLoading}
            placeholder={isLoading ? "AI is thinking..." : "Ask AI to create or move shapes..."}
            className="w-full px-3 py-2 bg-theme-surface-hover text-theme-primary placeholder-theme-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          disabled={isLoading}
          className={`flex-shrink-0 px-3 py-2 rounded-lg transition-colors text-sm ${isRecording ? 'bg-red-500 text-white' : 'bg-theme-surface-hover text-theme-primary border border-theme hover:bg-theme-surface'}`}
          title={isRecording ? 'Release to transcribe' : 'Hold to talk'}
        >
          {isRecording ? 'Recording…' : 'Hold to Talk'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-theme-surface-hover disabled:text-theme-secondary disabled:cursor-not-allowed font-medium text-sm"
          title="Send (Enter)"
        >
          Send
        </button>
      </div>
    );
  }
);

AIInput.displayName = 'AIInput';

