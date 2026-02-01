// ============================================================================
// ECG VISUAL EXAMPLES
// SVG rhythm strips for arrhythmia recognition
// ============================================================================

import React from 'react';

interface ECGVisualsProps {
  rhythm: string;
  size?: 'small' | 'medium' | 'large';
}

// SVG paths for different rhythms
const rhythmPaths: Record<string, { path: string; color: string; description: string }> = {
  // Normal Sinus Rhythm
  'normal_sinus': {
    path: 'M0,50 L10,50 L12,50 L14,45 L16,50 L18,50 L20,50 L22,20 L24,80 L26,50 L28,50 L35,50 L40,45 L45,50 L50,50 L60,50 L62,50 L64,45 L66,50 L68,50 L70,50 L72,20 L74,80 L76,50 L78,50 L85,50 L90,45 L95,50 L100,50',
    color: '#22c55e',
    description: 'Regular P waves, consistent PR interval, narrow QRS'
  },
  
  // Sinus Tachycardia
  'sinus_tach': {
    path: 'M0,50 L5,50 L7,45 L9,50 L11,20 L13,80 L15,50 L20,45 L25,50 L30,50 L32,45 L34,50 L36,20 L38,80 L40,50 L45,45 L50,50 L55,50 L57,45 L59,50 L61,20 L63,80 L65,50 L70,45 L75,50 L80,50 L82,45 L84,50 L86,20 L88,80 L90,50 L95,45 L100,50',
    color: '#eab308',
    description: 'Regular rhythm, rate >100 (adult) or age-adjusted, P waves present'
  },
  
  // SVT (Supraventricular Tachycardia)
  'svt': {
    path: 'M0,50 L3,50 L5,20 L7,80 L9,50 L12,50 L14,20 L16,80 L18,50 L21,50 L23,20 L25,80 L27,50 L30,50 L32,20 L34,80 L36,50 L39,50 L41,20 L43,80 L45,50 L48,50 L50,20 L52,80 L54,50 L57,50 L59,20 L61,80 L63,50 L66,50 L68,20 L70,80 L72,50 L75,50 L77,20 L79,80 L81,50 L84,50 L86,20 L88,80 L90,50 L93,50 L95,20 L97,80 L100,50',
    color: '#f97316',
    description: 'Very fast, regular, narrow QRS, no visible P waves, sudden onset'
  },
  
  // Ventricular Tachycardia
  'vtach': {
    path: 'M0,50 L5,50 L8,10 L12,30 L16,70 L20,90 L24,50 L28,50 L31,10 L35,30 L39,70 L43,90 L47,50 L51,50 L54,10 L58,30 L62,70 L66,90 L70,50 L74,50 L77,10 L81,30 L85,70 L89,90 L93,50 L100,50',
    color: '#ef4444',
    description: 'Wide QRS (>120ms), regular or slightly irregular, no P waves'
  },
  
  // Ventricular Fibrillation
  'vfib': {
    path: 'M0,50 L3,30 L6,70 L9,25 L12,65 L15,40 L18,80 L21,20 L24,60 L27,35 L30,75 L33,45 L36,55 L39,30 L42,70 L45,40 L48,65 L51,25 L54,80 L57,35 L60,60 L63,45 L66,70 L69,30 L72,55 L75,40 L78,75 L81,25 L84,65 L87,50 L90,35 L93,70 L96,45 L100,55',
    color: '#dc2626',
    description: 'Chaotic, no organized QRS, coarse or fine waves, no pulse'
  },
  
  // Asystole
  'asystole': {
    path: 'M0,50 L100,50',
    color: '#6b7280',
    description: 'Flat line, no electrical activity, confirm in 2 leads'
  },
  
  // PEA (looks like normal but no pulse)
  'pea': {
    path: 'M0,50 L15,50 L17,45 L19,50 L21,25 L23,75 L25,50 L35,50 L45,50 L47,45 L49,50 L51,25 L53,75 L55,50 L65,50 L75,50 L77,45 L79,50 L81,25 L83,75 L85,50 L100,50',
    color: '#a855f7',
    description: 'Organized rhythm on monitor but NO PULSE - check pulse!'
  },
  
  // Sinus Bradycardia
  'sinus_brady': {
    path: 'M0,50 L20,50 L22,45 L24,50 L26,20 L28,80 L30,50 L35,45 L40,50 L60,50 L62,45 L64,50 L66,20 L68,80 L70,50 L75,45 L80,50 L100,50',
    color: '#3b82f6',
    description: 'Regular rhythm, rate <60 (adult) or age-adjusted, P waves present'
  },
  
  // Complete Heart Block (3rd degree AV block)
  'chb': {
    path: 'M0,50 L5,45 L10,50 L15,50 L20,50 L25,20 L27,80 L30,50 L35,45 L40,50 L45,50 L55,50 L60,20 L62,80 L65,50 L70,45 L75,50 L80,50 L85,50 L90,20 L92,80 L95,50 L100,50',
    color: '#8b5cf6',
    description: 'P waves and QRS independent, atrial rate > ventricular rate'
  },
  
  // Atrial Fibrillation
  'afib': {
    path: 'M0,52 L3,48 L6,53 L9,47 L12,51 L15,49 L18,20 L20,80 L22,50 L28,48 L31,52 L34,47 L37,53 L40,49 L43,51 L46,20 L48,80 L50,50 L56,52 L59,48 L62,51 L65,49 L68,53 L71,47 L74,20 L76,80 L78,50 L84,48 L87,52 L90,49 L93,51 L96,47 L100,53',
    color: '#ec4899',
    description: 'Irregularly irregular, no P waves, fibrillatory baseline'
  },
  
  // Torsades de Pointes
  'torsades': {
    path: 'M0,50 L5,30 L10,70 L15,20 L20,80 L25,15 L30,85 L35,25 L40,75 L45,35 L50,65 L55,45 L60,55 L65,65 L70,35 L75,75 L80,25 L85,85 L90,15 L95,80 L100,20',
    color: '#f43f5e',
    description: 'Twisting QRS around baseline, polymorphic VT, check QTc and Mg'
  }
};

export const ECGVisuals: React.FC<ECGVisualsProps> = ({ rhythm, size = 'medium' }) => {
  const rhythmData = rhythmPaths[rhythm] || rhythmPaths['normal_sinus'];
  
  const dimensions = {
    small: { width: 150, height: 60 },
    medium: { width: 250, height: 80 },
    large: { width: 400, height: 120 }
  };
  
  const { width, height } = dimensions[size];
  
  return (
    <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
      {/* ECG Grid Background */}
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="w-full"
      >
        {/* Grid lines - small squares */}
        <defs>
          <pattern id={`smallGrid-${rhythm}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1e3a5f" strokeWidth="0.3"/>
          </pattern>
          <pattern id={`largeGrid-${rhythm}`} width="25" height="25" patternUnits="userSpaceOnUse">
            <rect width="25" height="25" fill={`url(#smallGrid-${rhythm})`}/>
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#2563eb" strokeWidth="0.5"/>
          </pattern>
        </defs>
        
        {/* Grid background */}
        <rect width="100" height="100" fill={`url(#largeGrid-${rhythm})`}/>
        
        {/* ECG Trace */}
        <path 
          d={rhythmData.path} 
          fill="none" 
          stroke={rhythmData.color} 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Rhythm Label */}
      <div className="mt-2 text-center">
        <span 
          className="text-xs font-medium px-2 py-1 rounded"
          style={{ backgroundColor: rhythmData.color + '20', color: rhythmData.color }}
        >
          {rhythm.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>
    </div>
  );
};

// Component to show all rhythms for comparison
export const ECGRhythmGallery: React.FC<{
  category?: 'arrest' | 'tachy' | 'brady' | 'all';
  onSelect?: (rhythm: string) => void;
  selectedRhythm?: string;
}> = ({ category = 'all', onSelect, selectedRhythm }) => {
  const categories = {
    arrest: ['vfib', 'vtach', 'asystole', 'pea'],
    tachy: ['sinus_tach', 'svt', 'vtach', 'afib', 'torsades'],
    brady: ['sinus_brady', 'chb'],
    all: Object.keys(rhythmPaths)
  };
  
  const rhythmsToShow = categories[category];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rhythmsToShow.map(rhythm => (
          <button
            key={rhythm}
            onClick={() => onSelect?.(rhythm)}
            className={`text-left transition-all ${
              selectedRhythm === rhythm 
                ? 'ring-2 ring-orange-500 rounded-lg' 
                : 'hover:opacity-80'
            }`}
          >
            <ECGVisuals rhythm={rhythm} size="medium" />
            <p className="text-slate-400 text-xs mt-1 px-2">
              {rhythmPaths[rhythm]?.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

// Quick reference card for a specific rhythm
export const ECGQuickReference: React.FC<{
  rhythm: string;
  showTreatment?: boolean;
  patientWeight?: number;
}> = ({ rhythm, showTreatment = true, patientWeight = 20 }) => {
  const rhythmData = rhythmPaths[rhythm];
  
  if (!rhythmData) return null;
  
  const treatments: Record<string, { action: string; dose?: string }[]> = {
    'vfib': [
      { action: 'Defibrillate', dose: `${(patientWeight * 2).toFixed(0)}J (2 J/kg), then ${(patientWeight * 4).toFixed(0)}J` },
      { action: 'CPR 2 minutes' },
      { action: 'Epinephrine', dose: `${(patientWeight * 0.01).toFixed(3)} mg (0.01 mg/kg) IV/IO q3-5min` },
      { action: 'Amiodarone', dose: `${(patientWeight * 5).toFixed(0)} mg (5 mg/kg) IV/IO` }
    ],
    'vtach': [
      { action: 'If pulseless: Defibrillate', dose: `${(patientWeight * 2).toFixed(0)}J` },
      { action: 'If pulse + unstable: Synchronized cardioversion', dose: `${(patientWeight * 0.5).toFixed(0)}-${patientWeight}J` },
      { action: 'If pulse + stable: Amiodarone', dose: `${(patientWeight * 5).toFixed(0)} mg IV over 20-60 min` }
    ],
    'asystole': [
      { action: 'CPR - High quality' },
      { action: 'Epinephrine', dose: `${(patientWeight * 0.01).toFixed(3)} mg IV/IO q3-5min` },
      { action: 'Identify reversible causes (Hs and Ts)' }
    ],
    'pea': [
      { action: 'CPR - High quality' },
      { action: 'Epinephrine', dose: `${(patientWeight * 0.01).toFixed(3)} mg IV/IO q3-5min` },
      { action: 'Treat reversible causes (Hs and Ts)' }
    ],
    'svt': [
      { action: 'Vagal maneuvers (ice to face in infant)' },
      { action: 'Adenosine', dose: `${(patientWeight * 0.1).toFixed(1)} mg (0.1 mg/kg) rapid IV push, max 6mg` },
      { action: 'If no response: Adenosine', dose: `${(patientWeight * 0.2).toFixed(1)} mg (0.2 mg/kg), max 12mg` },
      { action: 'If unstable: Synchronized cardioversion', dose: `${(patientWeight * 0.5).toFixed(0)}-${patientWeight}J` }
    ],
    'sinus_brady': [
      { action: 'Optimize oxygenation and ventilation first' },
      { action: 'If HR <60 with poor perfusion: CPR' },
      { action: 'Epinephrine', dose: `${(patientWeight * 0.01).toFixed(3)} mg IV/IO` },
      { action: 'Atropine (if vagal cause)', dose: `${(patientWeight * 0.02).toFixed(2)} mg (0.02 mg/kg), min 0.1mg` }
    ],
    'chb': [
      { action: 'Prepare for pacing' },
      { action: 'Epinephrine infusion', dose: `0.1-1 mcg/kg/min` },
      { action: 'Isoproterenol if available', dose: `0.1-1 mcg/kg/min` }
    ],
    'torsades': [
      { action: 'Magnesium sulfate', dose: `${(patientWeight * 25).toFixed(0)}-${(patientWeight * 50).toFixed(0)} mg IV over 10-20 min` },
      { action: 'If pulseless: Defibrillate', dose: `${(patientWeight * 2).toFixed(0)}J` },
      { action: 'Correct electrolytes (K, Ca)' },
      { action: 'Consider overdrive pacing' }
    ]
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <ECGVisuals rhythm={rhythm} size="large" />
      
      <div className="mt-4">
        <h4 className="text-white font-semibold mb-2">Key Features</h4>
        <p className="text-slate-300 text-sm">{rhythmData.description}</p>
      </div>
      
      {showTreatment && treatments[rhythm] && (
        <div className="mt-4">
          <h4 className="text-white font-semibold mb-2">Treatment</h4>
          <ol className="space-y-2">
            {treatments[rhythm].map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <span className="text-white text-sm">{step.action}</span>
                  {step.dose && (
                    <span className="text-orange-400 text-sm ml-2">({step.dose})</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default ECGVisuals;
