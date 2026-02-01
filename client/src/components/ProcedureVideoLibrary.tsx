import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PROCEDURE_VIDEOS,
  getVideosByCategory,
  getVideoById,
  searchVideos,
  getRelatedVideos,
  getCategoriesWithCounts,
  formatDuration,
  type ProcedureVideo,
  type ProcedureCategory,
  type SkillLevel,
} from '../../../shared/procedureVideoLibrary';
import {
  Play,
  Pause,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  BookOpen,
  Stethoscope,
  Heart,
  Syringe,
  Activity,
  Baby,
  Shield,
} from 'lucide-react';

interface ProcedureVideoLibraryProps {
  onSelectProcedure?: (procedureId: string) => void;
  initialCategory?: ProcedureCategory;
  language?: 'en' | 'sw' | 'fr' | 'ar';
}

const categoryIcons: Record<ProcedureCategory, React.ReactNode> = {
  airway: <Wind className="h-5 w-5" />,
  breathing: <Activity className="h-5 w-5" />,
  circulation: <Heart className="h-5 w-5" />,
  vascular_access: <Syringe className="h-5 w-5" />,
  medications: <Pill className="h-5 w-5" />,
  monitoring: <Stethoscope className="h-5 w-5" />,
  neonatal: <Baby className="h-5 w-5" />,
  trauma: <Shield className="h-5 w-5" />,
};

// Placeholder icons for missing imports
function Wind({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>;
}

function Pill({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;
}

const skillLevelColors: Record<SkillLevel, string> = {
  basic: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function ProcedureVideoLibrary({
  onSelectProcedure,
  initialCategory = 'airway',
  language = 'en',
}: ProcedureVideoLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProcedureCategory>(initialCategory);
  const [selectedVideo, setSelectedVideo] = useState<ProcedureVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const categories = getCategoriesWithCounts();
  const filteredVideos = searchQuery
    ? searchVideos(searchQuery)
    : getVideosByCategory(selectedCategory);

  const handleVideoSelect = (video: ProcedureVideo) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    setCurrentTime(0);
    onSelectProcedure?.(video.id);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const getLocalizedContent = (video: ProcedureVideo) => {
    if (language === 'en') {
      return {
        title: video.title,
        description: video.description,
        keyPoints: video.keyPoints,
      };
    }
    const translation = video.translations[language as 'sw' | 'fr' | 'ar'];
    if (translation) {
      return {
        title: translation.title,
        description: translation.description,
        keyPoints: translation.keyPoints,
      };
    }
    return {
      title: video.title,
      description: video.description,
      keyPoints: video.keyPoints,
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-orange-500" />
              Procedure Video Library
            </h2>
            <p className="text-sm text-slate-400">
              Step-by-step instructional videos for critical procedures
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-600 text-white"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category Sidebar */}
        <div className="w-64 border-r border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Categories</h3>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-1">
              {categories.map(({ category, count, label }) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedCategory === category && !searchQuery
                      ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {categoryIcons[category]}
                    <span className="text-sm">{label}</span>
                  </div>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    {count}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Video List */}
        <div className="flex-1 p-4 overflow-auto">
          {selectedVideo ? (
            // Video Detail View
            <div className="space-y-6">
              <Button
                variant="ghost"
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-white"
              >
                ← Back to list
              </Button>

              {/* Video Player */}
              <Card className="bg-slate-800 border-slate-700">
                <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                  {/* Placeholder for video - in production would use actual video */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                      <p className="text-slate-400">Video: {selectedVideo.title}</p>
                      <p className="text-sm text-slate-500 mt-2">
                        Duration: {formatDuration(selectedVideo.durationSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 h-1 bg-slate-600 rounded-full">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${(currentTime / selectedVideo.durationSeconds) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-white">
                        {formatDuration(Math.floor(currentTime))} / {formatDuration(selectedVideo.durationSeconds)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">
                        {getLocalizedContent(selectedVideo).title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {getLocalizedContent(selectedVideo).description}
                      </CardDescription>
                    </div>
                    <Badge className={skillLevelColors[selectedVideo.skillLevel]}>
                      {selectedVideo.skillLevel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Key Points */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Key Points
                    </h4>
                    <ul className="space-y-2">
                      {getLocalizedContent(selectedVideo).keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-teal-500 mt-1">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Errors */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Common Errors to Avoid
                    </h4>
                    <ul className="space-y-2">
                      {selectedVideo.commonErrors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-yellow-500 mt-1">⚠</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Equipment Needed */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Equipment Needed</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.equipmentNeeded.map((item, index) => (
                        <Badge key={index} variant="outline" className="text-slate-300 border-slate-600">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Indications & Contraindications */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">Indications</h4>
                      <ul className="space-y-1">
                        {selectedVideo.indications.map((item, index) => (
                          <li key={index} className="text-sm text-slate-300">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-2">Contraindications</h4>
                      <ul className="space-y-1">
                        {selectedVideo.contraindications.map((item, index) => (
                          <li key={index} className="text-sm text-slate-300">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Related Procedures */}
                  {selectedVideo.relatedProcedures.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-3">Related Procedures</h4>
                      <div className="flex flex-wrap gap-2">
                        {getRelatedVideos(selectedVideo.id).map((related) => (
                          <Button
                            key={related.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleVideoSelect(related)}
                            className="text-slate-300 border-slate-600 hover:bg-slate-700"
                          >
                            {related.title}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source */}
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                      Source: {selectedVideo.source} | Last updated: {selectedVideo.lastUpdated}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Video List View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className="bg-slate-800 border-slate-700 hover:border-teal-500/50 transition-colors cursor-pointer"
                  onClick={() => handleVideoSelect(video)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-900 rounded-t-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-12 w-12 text-orange-500/80" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      {formatDuration(video.durationSeconds)}
                    </div>
                    <Badge
                      className={`absolute top-2 left-2 ${skillLevelColors[video.skillLevel]}`}
                    >
                      {video.skillLevel}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-white line-clamp-2">
                      {getLocalizedContent(video).title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {getLocalizedContent(video).description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                        {video.category.replace('_', ' ')}
                      </Badge>
                      {video.ageGroups.includes('neonate') && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                          Neonatal
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredVideos.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No procedures found matching "{searchQuery}"</p>
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery('')}
                    className="text-teal-500"
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProcedureVideoLibrary;
