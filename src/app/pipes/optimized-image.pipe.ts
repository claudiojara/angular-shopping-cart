import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to generate optimized image URLs with WebP format
 * Adds format=webp and quality parameters to Unsplash URLs
 */
@Pipe({
  name: 'optimizedImage',
  standalone: true,
})
export class OptimizedImagePipe implements PipeTransform {
  transform(url: string, width: number = 600): string {
    if (!url || !url.includes('unsplash.com')) {
      return url;
    }

    // Add WebP format and optimization parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=80&fm=webp`;
  }
}
