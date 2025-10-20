/**
 * AdminDashboard Page Tests
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithAdminAuth } from '../../utils/test-utils';
import AdminDashboard from '../../../pages/admin/AdminDashboard';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8000/api/v1';

describe('AdminDashboard', () => {
  it('renders dashboard and loads data', async () => {
    renderWithAdminAuth(<AdminDashboard />);
    
    // Solo verificar que el dashboard se carga
    await waitFor(() => {
      expect(screen.getByText(/dashboard administrativo/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000); // Timeout total del test

  it('displays loading state initially', () => {
    renderWithAdminAuth(<AdminDashboard />);
    
    // Verificar elementos de loading - buscar el texto en español
    expect(screen.getByText(/cargando estadísticas/i)).toBeInTheDocument();
  });

  it('displays stats cards with correct titles', async () => {
    renderWithAdminAuth(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/total usuarios/i)).toBeInTheDocument();
      expect(screen.getByText(/total cursos/i)).toBeInTheDocument();
      expect(screen.getByText(/nuevos usuarios/i)).toBeInTheDocument();
      expect(screen.getByText(/cursos publicados/i)).toBeInTheDocument();
    });
  });

  it('renders quick action buttons', async () => {
    renderWithAdminAuth(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/crear nuevo curso/i)).toBeInTheDocument();
      expect(screen.getByText(/ver usuarios/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    // Override MSW handler to return error
    server.use(
      http.get(`${API_BASE}/admin/dashboard`, () => {
        return HttpResponse.json({ detail: 'API Error' }, { status: 500 });
      })
    );
    
    renderWithAdminAuth(<AdminDashboard />);
    
    // Esperar a que aparezca el contenido por defecto con valores 0
    await waitFor(() => {
      expect(screen.getByText(/dashboard administrativo/i)).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(4); // 4 métricas con valor 0
    });
  });

  it('displays quick actions section', async () => {
    renderWithAdminAuth(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/acciones rápidas/i)).toBeInTheDocument();
    });
  });
});
