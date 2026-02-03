/**
 * Clinical Header
 * 
 * Persistent header showing patient info, case timer, and critical actions.
 * Always visible during assessment. "Call for Help" button is always accessible.
 */

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  FileText, 
  Clock, 
  User, 
  Weight,
  AlertTriangle,
  Activity,
  Heart,
  ChevronDown,
  Volume2,
  VolumeX,
  Settings,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PatientInfo {
  ageYears: number;
  ageMonths: number;
  weight: number;
  chiefComplaint?: string;
}

interface ClinicalHeaderProps {
  patient: PatientInfo;
  caseStartTime: Date;
  emergencyActivated: boolean;
  cprActive: boolean;
  onCallForHelp: () => void;
  onGenerateHandover: () => void;
  onNewCase: () => void;
  onBackToHome?: () => void;
  onToggleAlerts: () => void;
  alertsEnabled: boolean;
  activeInterventionCount: number;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export const ClinicalHeader: React.FC<ClinicalHeaderProps> = ({
  patient,
  caseStartTime,
  emergencyActivated,
  cprActive,
  onCallForHelp,
  onGenerateHandover,
  onNewCase,
  onToggleAlerts,
  alertsEnabled,
  activeInterventionCount,
  onToggleSidebar,
  sidebarCollapsed,
  onBackToHome
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - caseStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [caseStartTime]);

  // Format elapsed time
  const formatElapsed = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format age
  const formatAge = (): string => {
    if (patient.ageYears > 0) {
      return patient.ageMonths > 0 
        ? `${patient.ageYears}y ${patient.ageMonths}m`
        : `${patient.ageYears}y`;
    }
    return `${patient.ageMonths}m`;
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${
      emergencyActivated ? 'bg-red-900' : 'bg-slate-900'
    } border-b border-slate-700 shadow-lg`}>
      {/* Emergency Banner */}
      {emergencyActivated && (
        <div className="bg-red-600 text-white py-1 px-4 text-center text-sm font-bold animate-pulse">
          <AlertTriangle className="inline h-4 w-4 mr-2" />
          EMERGENCY ACTIVATED - CALL FOR SENIOR HELP
          <AlertTriangle className="inline h-4 w-4 ml-2" />
        </div>
      )}

      {/* CPR Banner */}
      {cprActive && (
        <div className="bg-purple-600 text-white py-1 px-4 text-center text-sm font-bold">
          <Heart className="inline h-4 w-4 mr-2 animate-pulse" />
          CPR IN PROGRESS - Minimize interruptions
          <Heart className="inline h-4 w-4 ml-2 animate-pulse" />
        </div>
      )}

      {/* Main Header */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Patient Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ResusGPS</h1>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-slate-700">
              {/* Age */}
              <div className="flex items-center gap-1 text-slate-300">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{formatAge()}</span>
              </div>

              {/* Weight */}
              <div className="flex items-center gap-1 text-slate-300">
                <Weight className="h-4 w-4" />
                <span className="text-sm font-medium">{patient.weight.toFixed(1)} kg</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">{formatElapsed(elapsedTime)}</span>
              </div>
            </div>
          </div>

          {/* Center: Chief Complaint (if set) */}
          {patient.chiefComplaint && (
            <div className="hidden lg:block">
              <span className="bg-slate-800 px-3 py-1 rounded-full text-sm text-slate-300">
                {patient.chiefComplaint}
              </span>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Active Interventions Badge (mobile) */}
            {activeInterventionCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="md:hidden relative"
              >
                <Activity className="h-5 w-5 text-orange-500" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeInterventionCount}
                </span>
              </Button>
            )}

            {/* Alert Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAlerts}
              className="text-slate-400 hover:text-white"
            >
              {alertsEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>

            {/* Handover Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateHandover}
              className="hidden sm:flex bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <FileText className="h-4 w-4 mr-1" />
              Handover
            </Button>

            {/* CALL FOR HELP - Always Prominent */}
            <Button
              onClick={onCallForHelp}
              className={`font-bold ${
                emergencyActivated 
                  ? 'bg-white text-red-600 hover:bg-slate-200' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Phone className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Call for Help</span>
              <span className="sm:hidden">Help</span>
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={onGenerateHandover}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 sm:hidden"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Handover
                </DropdownMenuItem>
                {onBackToHome && (
                  <DropdownMenuItem 
                    onClick={onBackToHome}
                    className="text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={onNewCase}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  New Case
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Patient Info */}
        <div className="flex md:hidden items-center justify-center gap-4 mt-2 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <User className="h-3 w-3" />
            <span>{formatAge()}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Weight className="h-3 w-3" />
            <span>{patient.weight.toFixed(1)} kg</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock className="h-3 w-3" />
            <span className="font-mono">{formatElapsed(elapsedTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalHeader;
