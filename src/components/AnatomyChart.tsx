import React from 'react';
import { motion } from 'motion/react';
import { POOLS } from '../data/exercises';

interface SessionSet {
  exerciseName: string;
  weight: number;
  reps: number;
}

interface AnatomyChartProps {
  sets: SessionSet[];
}

const AnatomyChart: React.FC<AnatomyChartProps> = ({ sets }) => {
  // Volume per muscle pool
  const muscleVolume = sets.reduce((acc, set) => {
    let pool: string | null = null;
    for (const [key, exercises] of Object.entries(POOLS)) {
      if (exercises.some(e => e.name === set.exerciseName)) {
        pool = key;
        break;
      }
    }
    if (pool) {
      acc[pool] = (acc[pool] || 0) + (set.weight * set.reps);
    }
    return acc;
  }, {} as Record<string, number>);

  const volumes: number[] = Object.values(muscleVolume);
  let maxVol = 1;
  volumes.forEach(v => {
    if (v > maxVol) maxVol = v;
  });
  const maxVolume = maxVol;

  const getIntensity = (pool: string) => {
    const vol = muscleVolume[pool] || 0;
    return vol / maxVolume;
  };

  const getFill = (pool: string) => {
    const intensity = getIntensity(pool);
    if (intensity === 0) return "rgba(255, 255, 255, 0.05)";
    // Gradient from gold-dark to gold-light
    return `rgba(212, 175, 55, ${0.2 + intensity * 0.8})`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10">
      {/* Front View */}
      <div className="flex flex-col items-center">
        <h4 className="text-[10px] text-gym-accent font-bold uppercase tracking-[0.3em] mb-8">Front Evolution</h4>
        <svg viewBox="0 0 200 400" className="w-full max-w-[240px] h-auto drop-shadow-[0_0_20px_rgba(212,175,55,0.1)]">
          {/* Stylized Body Outline - Front */}
          <g fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
            {/* Template Body */}
            <path d="M100,40 Q110,40 115,50 L115,70 Q130,75 140,90 L145,130 L135,135 L130,110 Q125,180 120,250 L130,350 L110,350 L105,260 L95,260 L90,350 L70,350 L80,250 Q75,180 70,110 L65,135 L55,130 L60,90 Q70,75 85,70 L85,50 Q90,40 100,40 Z" />
          </g>

          {/* Muscle Groups - Front */}
          {/* Shoulders */}
          <path 
            d="M85,75 Q75,75 70,90 L75,105 Q80,105 85,95 Z M115,75 Q125,75 130,90 L125,105 Q120,105 115,95 Z" 
            fill={getFill('shoulders')} 
            className="transition-colors duration-1000"
          />
          {/* Chest */}
          <path 
            d="M88,90 Q100,85 112,90 L115,115 Q100,120 85,115 Z" 
            fill={getFill('chest')} 
            className="transition-colors duration-1000"
          />
          {/* Abs (Core) */}
          <path 
            d="M90,125 Q100,122 110,125 L108,185 Q100,188 92,185 Z" 
            fill={getFill('core')} 
            className="transition-colors duration-1000"
          />
          {/* Biceps */}
          <path 
            d="M65,105 Q60,115 62,130 L70,125 Q72,115 70,105 Z M135,105 Q140,115 138,130 L130,125 Q128,115 130,105 Z" 
            fill={getFill('biceps')} 
            className="transition-colors duration-1000"
          />
          {/* Quads (Legs) */}
          <path 
            d="M82,200 Q90,195 98,200 L95,255 L85,255 Z M102,200 Q110,195 118,200 L115,255 L105,255 Z" 
            fill={getFill('legs')} 
            className="transition-colors duration-1000"
          />
        </svg>
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center">
        <h4 className="text-[10px] text-gym-accent font-bold uppercase tracking-[0.3em] mb-8">Rear Evolution</h4>
        <svg viewBox="0 0 200 400" className="w-full max-w-[240px] h-auto drop-shadow-[0_0_20px_rgba(212,175,55,0.1)]">
          {/* Stylized Body Outline - Back */}
          <g fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
            <path d="M100,40 Q110,40 115,50 L115,70 Q130,75 140,90 L145,130 L135,135 L130,110 Q125,180 120,250 L130,350 L110,350 L105,260 L95,260 L90,350 L70,350 L80,250 Q75,180 70,110 L65,135 L55,130 L60,90 Q70,75 85,70 L85,50 Q90,40 100,40 Z" />
          </g>

          {/* Muscle Groups - Back */}
          {/* Upper/Mid Back */}
          <path 
            d="M85,85 Q100,75 115,85 L120,135 Q100,145 80,135 Z" 
            fill={getFill('back')} 
            className="transition-colors duration-1000"
          />
          {/* Lower Back */}
          <path 
            d="M90,140 Q100,145 110,140 L115,180 Q100,185 85,180 Z" 
            fill={getFill('back')} 
            className="transition-colors duration-1000 opacity-80"
          />
          {/* Shoulders (Rear Delts) */}
          <path 
            d="M85,75 Q75,75 70,90 L75,105 Q80,105 85,95 Z M115,75 Q125,75 130,90 L125,105 Q120,105 115,95 Z" 
            fill={getFill('shoulders')} 
            className="transition-colors duration-1000"
          />
          {/* Triceps */}
          <path 
            d="M62,105 Q58,115 60,130 L68,135 Q70,120 68,105 Z M138,105 Q142,115 140,130 L132,135 Q130,120 132,105 Z" 
            fill={getFill('triceps')} 
            className="transition-colors duration-1000"
          />
          {/* Hamstrings/Glutes (Legs) */}
          <path 
            d="M80,195 Q90,190 100,195 L95,260 L82,260 Z M100,195 Q110,190 120,195 L118,260 L105,260 Z" 
            fill={getFill('legs')} 
            className="transition-colors duration-1000"
          />
        </svg>
      </div>

      <div className="md:col-span-2 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.keys(POOLS).map(pool => (
            <div key={pool} className="bg-white/5 border border-white/10 p-4 rounded-sm flex flex-col items-center text-center">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-1">{pool}</span>
              <div className="text-sm font-medium text-white">{muscleVolume[pool] ? `${Math.round(intensityToLoad(getIntensity(pool)))}%` : "0%"}</div>
              <div className="w-full bg-white/5 h-1 mt-3 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${getIntensity(pool) * 100}%` }}
                   className="h-full bg-gym-accent"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const intensityToLoad = (i: number) => i * 100;

export default AnatomyChart;
