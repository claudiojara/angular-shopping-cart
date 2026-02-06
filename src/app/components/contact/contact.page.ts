import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SeoService } from '../../services/seo.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="contact-page">
      <div class="container">
        <div class="contact-header">
          <h1 class="page-title">Contacto</h1>
          <p class="page-subtitle">Estamos aquí para ayudarte</p>
        </div>

        <div class="contact-grid">
          <mat-card class="contact-card">
            <mat-icon class="contact-icon">email</mat-icon>
            <h3>Email</h3>
            <p>Escríbenos y te responderemos en menos de 24 horas</p>
            <a href="mailto:hola@forjadeldestino.cl" mat-raised-button color="primary">
              hola&#64;forjadeldestino.cl
            </a>
          </mat-card>

          <mat-card class="contact-card">
            <mat-icon class="contact-icon">whatsapp</mat-icon>
            <h3>WhatsApp</h3>
            <p>Chat directo para consultas rápidas</p>
            <a href="https://wa.me/569XXXXXXXX" target="_blank" mat-raised-button color="accent">
              +56 9 XXXX XXXX
            </a>
          </mat-card>

          <mat-card class="contact-card">
            <mat-icon class="contact-icon">schedule</mat-icon>
            <h3>Horario</h3>
            <p>Lunes a Viernes: 9:00 - 18:00</p>
            <p>Sábado: 10:00 - 14:00</p>
            <span class="badge">Respondemos en 24h</span>
          </mat-card>
        </div>

        <div class="contact-info">
          <mat-card class="info-card">
            <h2>¿Por qué elegirnos?</h2>
            <ul class="feature-list">
              <li>
                <mat-icon>verified</mat-icon>
                <span>Diseños únicos impresos en 3D</span>
              </li>
              <li>
                <mat-icon>local_shipping</mat-icon>
                <span>Envío gratis en compras sobre $45.000</span>
              </li>
              <li>
                <mat-icon>workspace_premium</mat-icon>
                <span>Garantía de calidad en todos nuestros productos</span>
              </li>
              <li>
                <mat-icon>support_agent</mat-icon>
                <span>Atención al cliente personalizada</span>
              </li>
            </ul>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .contact-page {
        padding: var(--spacing-xl) 0;
      }

      .contact-header {
        text-align: center;
        margin-bottom: var(--spacing-xxl);
      }

      .page-title {
        font-family: var(--font-heading);
        font-size: 42px;
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
        color: var(--color-text-primary);
      }

      .page-subtitle {
        font-size: 18px;
        color: var(--color-text-secondary);
      }

      .contact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xxl);
      }

      .contact-card {
        padding: var(--spacing-xl);
        text-align: center;
        transition: transform 0.3s ease;

        &:hover {
          transform: translateY(-4px);
        }
      }

      .contact-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--color-accent);
        margin-bottom: var(--spacing-md);
      }

      .contact-card h3 {
        font-family: var(--font-heading);
        font-size: 24px;
        margin-bottom: var(--spacing-sm);
      }

      .contact-card p {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-md);
      }

      .badge {
        display: inline-block;
        background: var(--color-accent);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .contact-info {
        max-width: 800px;
        margin: 0 auto;
      }

      .info-card {
        padding: var(--spacing-xl);
      }

      .info-card h2 {
        font-family: var(--font-heading);
        font-size: 28px;
        margin-bottom: var(--spacing-lg);
        text-align: center;
      }

      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .feature-list li {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--color-border);

        &:last-child {
          border-bottom: none;
        }
      }

      .feature-list mat-icon {
        color: var(--color-accent);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private seoService = inject(SeoService);

  constructor() {
    this.seoService.updateSeo({
      title: 'Contacto | Forja del Destino',
      description:
        'Contáctanos para cualquier consulta sobre nuestras lámparas de diseño. Estamos aquí para ayudarte.',
    });
  }
}
