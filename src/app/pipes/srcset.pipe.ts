import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to generate srcset for responsive images
 * Generates multiple sizes for different screen densities
 */
@Pipe({
  name: 'srcSet',
  standalone: true,
})
export class SrcSetPipe implements PipeTransform {
  transform(url: string): string {
    if (!url || !url.includes('unsplash.com')) {
      return url;
    }

    const baseUrl = url.split('?')[0];
    const sizes = [200, 400, 600, 800];

    return sizes.map((size) => `${baseUrl}?w=${size}&q=80&fm=webp ${size}w`).join(', ');
  }
}
