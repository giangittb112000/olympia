'use client';

interface MediaPlayerProps {
  mediaType: 'VIDEO' | 'IMAGE';
  mediaUrl: string;
}

export default function MediaPlayer({ mediaType, mediaUrl }: MediaPlayerProps) {
  if (mediaType === 'VIDEO') {
    return (
      <video
        key={mediaUrl}
        src={mediaUrl}
        controls
        className="w-full h-full object-contain rounded-xl"
        autoPlay={false}
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt="Question media"
      className="w-full h-full object-contain rounded-xl"
    />
  );
}
