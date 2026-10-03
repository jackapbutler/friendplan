import React, { useState } from 'react';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';

interface ShareModalProps {
  eventName: string;
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  eventName,
  url,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy error', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${eventName} — Date Poll`,
          text: `Mark dates you cannot attend for "${eventName}":`,
          url: url
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=292524&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 relative animate-pop shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-2.5">
            <Share2 className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-stone-900">
            Share this Poll
          </h3>
          <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
            Send this link to your group. Responses sync in real time.
          </p>
        </div>

        {/* Link Box */}
        <div className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200/80 rounded-2xl mb-4">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent px-2 text-xs font-mono text-stone-700 truncate outline-none select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-medium">
          <button
            onClick={handleNativeShare}
            className="py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Send to Friends</span>
          </button>

          <button
            onClick={() => setShowQR(!showQR)}
            className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-stone-500" />
            <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
          </button>
        </div>

        {/* In-person QR code */}
        {showQR && (
          <div className="mt-4 pt-4 border-t border-stone-100 text-center animate-in fade-in duration-150">
            <div className="inline-block p-3 bg-white border border-stone-200 rounded-2xl shadow-2xs">
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="w-44 h-44 mx-auto rounded-lg"
                loading="lazy"
              />
            </div>
            <p className="text-[11px] text-stone-600 mt-2">
              Scan with phone camera to join
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
