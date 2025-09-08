import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface TestimonialData {
  id: string;
  content: string;
  subreddit: string;
  timeAgo: string;
  redditUrl: string;
}

interface TestimonialCarouselProps {
  testimonials: TestimonialData[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function TestimonialCarousel({ 
  testimonials, 
  autoPlay = true, 
  autoPlayInterval = 5000 
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main Testimonial Card */}
      <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-xl">
        <CardContent className="p-8 sm:p-12">

          {/* Testimonial Content */}
          <blockquote className="text-center mb-8">
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed italic mb-6">
              "{currentTestimonial.content}"
            </p>
            
            {/* Reddit Info */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">r</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {currentTestimonial.subreddit}
                </span>
              </div>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{currentTestimonial.timeAgo}</span>
            </div>

          </blockquote>

          {/* Reddit Link */}
          <div className="text-center">
            <a
              href={currentTestimonial.redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-gray-600 hover:text-orange-600 transition-colors border-b border-gray-300 hover:border-orange-400 pb-1"
            >
              View on Reddit
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      {testimonials.length > 1 && (
        <>
          {/* Arrow Navigation */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-12">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-12">
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

        </>
      )}
    </div>
  );
}
