import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../src/App';

describe('App routing shell', () => {
  it('renders the wizard landing step', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByText(/your ai workspace, automated/i)).toBeInTheDocument();
    expect(screen.getByText(/download setup scripts/i)).toBeInTheDocument();
  });
});
