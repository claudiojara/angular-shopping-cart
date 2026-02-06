import { Pipe, PipeTransform } from '@angular/core';

/**
 * Custom pipe for Chilean Peso currency formatting
 * Formats: 24000 → $24.000
 */
@Pipe({
  name: 'clpCurrency',
  standalone: true,
})
export class ClpCurrencyPipe implements PipeTransform {
  transform(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }

    // Format with thousands separator (.) and no decimals
    const formatted = Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `$${formatted}`;
  }
}
