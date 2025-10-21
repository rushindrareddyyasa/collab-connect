// Filename: components/ShareModal.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingUrl: string;
}

const ShareModal = ({ isOpen, onClose, recordingUrl }: ShareModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recordingUrl).then(() => {
      setCopied(true);
      toast({ title: 'Link Copied' });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[520px] bg-dark-1 text-white border-none p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share Recording</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-sky-1">
            Anyone with this link can view the recording.
          </p>
          <div className="relative flex items-center">
            <Input
              value={recordingUrl}
              readOnly
              className="bg-dark-2 border-dark-2 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-dark-3 hover:bg-dark-4 p-2 h-auto"
            >
              {copied ? (
                <Check size={20} className="text-green-500" />
              ) : (
                <Copy size={20} />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;