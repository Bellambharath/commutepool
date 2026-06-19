import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CommutePool',
    short_name: 'CommutePool',
    description: 'Bike-pillion commute sharing for Hyderabad',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#01696f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
