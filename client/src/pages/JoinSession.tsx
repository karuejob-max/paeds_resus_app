/**
 * Join Session Page
 * 
 * Allows providers to join an existing CPR session by entering a session code.
 * After joining, they select their role and are redirected to the appropriate interface.
 */

import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { Users, AlertCircle, Loader2, Heart } from 'lucide-react';

export default function JoinSession() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlCode = new URLSearchParams(searchParams).get('code');

  const [sessionCode, setSessionCode] = useState(urlCode || '');
  const [providerName, setProviderName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [error, setError] = useState('');

  const joinSessionMutation = trpc.cprSession.joinSession.useMutation();

  const roles = [
    { value: 'team_leader', label: 'Team Leader', description: 'Oversee resuscitation, assign roles' },
    { value: 'compressions', label: 'Compressions', description: 'Perform chest compressions' },
    { value: 'airway', label: 'Airway', description: 'Manage airway and ventilation' },
    { value: 'iv_access', label: 'IV/IO Access', description: 'Establish vascular access' },
    { value: 'medications', label: 'Medications', description: 'Prepare and administer drugs' },
    { value: 'recorder', label: 'Recorder/Documentation', description: 'Log events and times' },
    { value: 'observer', label: 'Observer', description: 'Observe without active role' },
  ];

  const handleJoin = async () => {
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }
    if (!providerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    try {
      const result = await joinSessionMutation.mutateAsync({
        sessionCode: sessionCode.toUpperCase(),
        providerName: providerName.trim(),
        role: selectedRole as any,
      });

      if (result.success) {
        // Redirect to collaborative session view with role-specific interface
        setLocation(`/collaborative-session/${result.sessionId}?role=${selectedRole}&memberId=${result.memberId}`);
      } else {
        setError(result.message || 'Failed to join session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join session');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-900/95 border-gray-700 max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-2xl">
            <Heart className="h-6 w-6 text-red-500" />
            Join Resuscitation Session
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Enter the session code to join an active CPR session as a team member
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700 p-3 rounded flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sessionCode" className="text-white">
              Session Code
            </Label>
            <Input
              id="sessionCode"
              value={sessionCode}
              onChange={(e) => {
                setSessionCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Enter 8-character code"
              className="bg-gray-800 border-gray-600 text-white text-2xl font-mono text-center tracking-widest uppercase"
              maxLength={8}
            />
            <p className="text-gray-400 text-xs">
              Ask the Team Leader for the session code or scan the QR code
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="providerName" className="text-white">
              Your Name
            </Label>
            <Input
              id="providerName"
              value={providerName}
              onChange={(e) => {
                setProviderName(e.target.value);
                setError('');
              }}
              placeholder="Enter your full name"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Select Your Role</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {roles.map((role) => (
                <Button
                  key={role.value}
                  onClick={() => {
                    setSelectedRole(role.value);
                    setError('');
                  }}
                  variant={selectedRole === role.value ? 'default' : 'outline'}
                  className={`h-auto py-3 px-4 flex flex-col items-start ${
                    selectedRole === role.value
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <span className="font-semibold text-sm">{role.label}</span>
                  <span className="text-xs opacity-80">{role.description}</span>
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleJoin}
            disabled={joinSessionMutation.isPending || !sessionCode || !providerName || !selectedRole}
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
          >
            {joinSessionMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Joining Session...
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Join Session
              </>
            )}
          </Button>

          <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
            <p className="text-blue-100 text-sm font-semibold mb-2">How it works:</p>
            <ol className="text-blue-200 text-xs space-y-1 list-decimal list-inside">
              <li>Get the session code from the Team Leader</li>
              <li>Enter the code and your name above</li>
              <li>Select your role in the resuscitation team</li>
              <li>Join the session and see real-time updates</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
