import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface VideoTestimonialProps {
  id: string;
  title: string;
  hospitalName: string;
  speakerName: string;
  speakerRole: string;
  videoUrl: string;
  thumbnail?: string;
  description: string;
  duration?: string;
}

export default function VideoTestimonial({
  id,
  title,
  hospitalName,
  speakerName,
  speakerRole,
  videoUrl,
  thumbnail,
  description,
  duration = "2:30",
}: VideoTestimonialProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { trackVideoWatched, trackTestimonialViewed } = useAnalytics("VideoTestimonial");

  const handlePlay = () => {
    if (!isPlaying) {
      trackTestimonialViewed(hospitalName, id);
      trackVideoWatched(id, title, parseInt(duration));
      setIsPlaying(true);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative bg-gray-900 aspect-video flex items-center justify-center group cursor-pointer" onClick={handlePlay}>
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-700" />
          )}

          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <div className="bg-green-500 hover:bg-green-600 rounded-full p-4 transform group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-red-500 rounded-full p-4">
                <Pause className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
            {duration}
          </div>
        </div>

        <div className="p-6 space-y-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-blue-600 font-semibold">{hospitalName}</p>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>

          <div className="border-t pt-3">
            <p className="font-semibold text-gray-900">{speakerName}</p>
            <p className="text-xs text-gray-500">{speakerRole}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * VideoTestimonialGrid component for displaying multiple testimonials
 */
export function VideoTestimonialGrid({
  testimonials,
}: {
  testimonials: VideoTestimonialProps[];
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial) => (
        <VideoTestimonial key={testimonial.id} {...testimonial} />
      ))}
    </div>
  );
}
