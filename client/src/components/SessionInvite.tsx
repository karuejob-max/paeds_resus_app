/**
 * Session Invite Component
 * 
 * Allows Team Leader to share session code for other providers to join.
 * Generates QR code and displays shareable session code.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, QrCode, Users, X } from 'lucide-react';

interface SessionInviteProps {
  sessionCode: string;
  sessionId: number;
  onClose: () => void;
}

export function SessionInvite({ sessionCode, sessionId, onClose }: SessionInviteProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinUrl = `${window.location.origin}/join-session?code=${sessionCode}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR code as data URL using a simple QR code library approach
  // For now, we'll use a QR code API service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-blue-500" />
              Invite Team Members
            </CardTitle>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
            <p className="text-blue-100 text-sm mb-2">
              Share this code with team members to join the resuscitation:
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={sessionCode}
                readOnly
                className="bg-gray-800 border-gray-600 text-white text-2xl font-mono text-center tracking-widest"
              />
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-green-400 text-xs mt-2 text-center">Copied to clipboard!</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white">Join URL</Label>
            <div className="flex items-center gap-2">
              <Input
                value={joinUrl}
                readOnly
                className="bg-gray-800 border-gray-600 text-white text-sm"
              />
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={() => setShowQR(!showQR)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </Button>

          {showQR && (
            <div className="bg-white p-4 rounded flex justify-center">
              <img
                src={qrCodeUrl}
                alt="Session QR Code"
                className="w-64 h-64"
              />
            </div>
          )}

          <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded">
            <p className="text-yellow-200 text-xs">
              <strong>Instructions:</strong> Team members can scan the QR code or enter the session code manually on the join page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
