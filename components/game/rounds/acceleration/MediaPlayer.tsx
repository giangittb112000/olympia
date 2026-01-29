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
        className="w-full h-full object-contain rounded-xl"
        autoPlay
        controls={false}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={mediaUrl}
      alt="Question media"
      className="w-full h-full object-contain rounded-xl"
    />
  );
}
