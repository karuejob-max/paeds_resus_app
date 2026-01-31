import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Volume2,
  VolumeX,
  Vibrate,
  Bell,
  BellOff,
  Settings,
  Play,
  X,
} from 'lucide-react';
import {
  getAlertConfig,
  setAlertConfig,
  triggerAlert,
  triggerHaptic,
  initAudioContext,
  isAudioSupported,
  isHapticSupported,
  isSpeechSupported,
  playSuccessChime,
  startCPRMetronome,
  stopCPRMetronome,
} from '@/lib/alertSystem';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AlertSettingsProps {
  compact?: boolean;
}

export default function AlertSettings({ compact = false }: AlertSettingsProps) {
  const [config, setConfig] = useState(getAlertConfig());
  const [isOpen, setIsOpen] = useState(false);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);

  useEffect(() => {
    setAlertConfig(config);
  }, [config]);

  const handleAudioToggle = (enabled: boolean) => {
    if (enabled) {
      initAudioContext();
    }
    setConfig((prev) => ({ ...prev, audioEnabled: enabled }));
  };

  const handleHapticToggle = (enabled: boolean) => {
    setConfig((prev) => ({ ...prev, hapticEnabled: enabled }));
    if (enabled) {
      triggerHaptic('short');
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setConfig((prev) => ({ ...prev, volume: value[0] }));
  };

  const testAlert = async (type: 'timer_warning' | 'critical_action' | 'success') => {
    initAudioContext();
    await triggerAlert(type);
  };

  const toggleMetronome = () => {
    if (isMetronomeRunning) {
      stopCPRMetronome();
      setIsMetronomeRunning(false);
    } else {
      initAudioContext();
      startCPRMetronome(110);
      setIsMetronomeRunning(true);
    }
  };

  if (compact) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Alert Settings</DialogTitle>
          </DialogHeader>
          <AlertSettingsContent
            config={config}
            onAudioToggle={handleAudioToggle}
            onHapticToggle={handleHapticToggle}
            onVolumeChange={handleVolumeChange}
            onTestAlert={testAlert}
            onToggleMetronome={toggleMetronome}
            isMetronomeRunning={isMetronomeRunning}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
          <Bell className="h-4 w-4" />
          Alert Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AlertSettingsContent
          config={config}
          onAudioToggle={handleAudioToggle}
          onHapticToggle={handleHapticToggle}
          onVolumeChange={handleVolumeChange}
          onTestAlert={testAlert}
          onToggleMetronome={toggleMetronome}
          isMetronomeRunning={isMetronomeRunning}
        />
      </CardContent>
    </Card>
  );
}

interface AlertSettingsContentProps {
  config: ReturnType<typeof getAlertConfig>;
  onAudioToggle: (enabled: boolean) => void;
  onHapticToggle: (enabled: boolean) => void;
  onVolumeChange: (value: number[]) => void;
  onTestAlert: (type: 'timer_warning' | 'critical_action' | 'success') => void;
  onToggleMetronome: () => void;
  isMetronomeRunning: boolean;
}

function AlertSettingsContent({
  config,
  onAudioToggle,
  onHapticToggle,
  onVolumeChange,
  onTestAlert,
  onToggleMetronome,
  isMetronomeRunning,
}: AlertSettingsContentProps) {
  const audioSupported = isAudioSupported();
  const hapticSupported = isHapticSupported();
  const speechSupported = isSpeechSupported();

  return (
    <div className="space-y-4">
      {/* Audio Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.audioEnabled ? (
            <Volume2 className="h-4 w-4 text-green-400" />
          ) : (
            <VolumeX className="h-4 w-4 text-slate-500" />
          )}
          <Label className="text-slate-300">Audio Alerts</Label>
        </div>
        <Switch
          checked={config.audioEnabled}
          onCheckedChange={onAudioToggle}
          disabled={!audioSupported}
        />
      </div>

      {/* Volume Slider */}
      {config.audioEnabled && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Volume: {Math.round(config.volume * 100)}%</Label>
          <Slider
            value={[config.volume]}
            onValueChange={onVolumeChange}
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>
      )}

      {/* Haptic Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vibrate className={`h-4 w-4 ${config.hapticEnabled ? 'text-green-400' : 'text-slate-500'}`} />
          <Label className="text-slate-300">Haptic Feedback</Label>
        </div>
        <Switch
          checked={config.hapticEnabled}
          onCheckedChange={onHapticToggle}
          disabled={!hapticSupported}
        />
      </div>

      {!hapticSupported && (
        <p className="text-xs text-slate-500">Haptic feedback not supported on this device</p>
      )}

      {/* Test Alerts */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">Test Alerts</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-yellow-500/50 text-yellow-400"
            onClick={() => onTestAlert('timer_warning')}
          >
            Warning
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400"
            onClick={() => onTestAlert('critical_action')}
          >
            Critical
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-green-500/50 text-green-400"
            onClick={() => onTestAlert('success')}
          >
            Success
          </Button>
        </div>
      </div>

      {/* CPR Metronome */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">CPR Metronome (110 BPM)</Label>
        <Button
          variant={isMetronomeRunning ? 'destructive' : 'outline'}
          size="sm"
          className={isMetronomeRunning ? '' : 'border-blue-500/50 text-blue-400'}
          onClick={onToggleMetronome}
        >
          {isMetronomeRunning ? (
            <>
              <X className="h-4 w-4 mr-2" /> Stop Metronome
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" /> Start Metronome
            </>
          )}
        </Button>
      </div>

      {/* Feature Support */}
      <div className="pt-2 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          Device Support:{' '}
          <span className={audioSupported ? 'text-green-400' : 'text-red-400'}>Audio</span>
          {' • '}
          <span className={hapticSupported ? 'text-green-400' : 'text-red-400'}>Haptic</span>
          {' • '}
          <span className={speechSupported ? 'text-green-400' : 'text-red-400'}>Speech</span>
        </p>
      </div>
    </div>
  );
}
