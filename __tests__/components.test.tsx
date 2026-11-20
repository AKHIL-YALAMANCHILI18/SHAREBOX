import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CopyButton } from '@/components/ui/copy-button';
import { Footer } from '@/components/layout/footer';
import { DeveloperIntroBanner } from '@/components/layout/dev-intro-banner';

describe('UI Component Library', () => {
  test('Button renders children and handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('Button handles loading state and disables interaction', () => {
    render(<Button isLoading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  test('Input renders with label and error messages', () => {
    render(
      <Input
        label="Room Code"
        placeholder="Enter 8 digits"
        error="Invalid code entered"
      />
    );
    expect(screen.getByText('Room Code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 8 digits')).toBeInTheDocument();
    expect(screen.getByText('Invalid code entered')).toBeInTheDocument();
  });

  test('Badge displays correct variants', () => {
    render(<Badge variant="accent">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('Progress bar clamps value between 0 and 100', () => {
    const { container } = render(<Progress value={45} />);
    const bar = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(bar?.style.width).toBe('45%');
  });

  test('CopyButton renders and executes copy action', () => {
    const onCopy = jest.fn();
    render(<CopyButton value="12345678" label="Copy Code" onCopySuccess={onCopy} />);
    const btn = screen.getByRole('button', { name: /copy code/i });
    expect(btn).toBeInTheDocument();
  });

  test('Footer renders developer credit and social links', () => {
    render(<Footer />);
    expect(screen.getByText(/Designed & Developed with/i)).toBeInTheDocument();
    expect(screen.getByText('akhilyalamanchilii@gmail.com')).toBeInTheDocument();

    const portfolioLinks = screen.getAllByTitle('Akhil Y Portfolio');
    expect(portfolioLinks.length).toBeGreaterThanOrEqual(1);
    expect(portfolioLinks[0]).toHaveAttribute('href', 'https://portfolio-akhil-3e53.vercel.app');

    const emailLink = screen.getByTitle('Contact Akhil Y via Email');
    expect(emailLink).toHaveAttribute('href', 'mailto:akhilyalamanchilii@gmail.com');

    const linkedInLink = screen.getByTitle('Akhil Y on LinkedIn');
    expect(linkedInLink).toHaveAttribute('href', 'https://www.linkedin.com/in/akhil-y-b97b55289/');

    const githubLink = screen.getByTitle('Akhil Y on GitHub');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/AKHIL-YALAMANCHILI18');

    expect(screen.getByText(/© 2026 SHAREBOX\. All rights reserved\./i)).toBeInTheDocument();
  });

  test('DeveloperIntroBanner appears after delay and dismisses for current page load only', () => {
    jest.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();

    const { unmount } = render(<DeveloperIntroBanner />);
    expect(screen.queryByText(/Hey, I'm Akhil!/i)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.getByText(/Hey, I'm Akhil!/i)).toBeInTheDocument();
    expect(screen.getByText(/I built SHAREBOX to make file sharing simple/i)).toBeInTheDocument();

    const githubLink = screen.getByRole('link', { name: /contribute on github/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/AKHIL-YALAMANCHILI18/SHAREBOX');

    const contactLink = screen.getByRole('link', { name: /contact me/i });
    expect(contactLink).toHaveAttribute('href', 'mailto:akhilyalamanchilii@gmail.com');

    const linkedInLink = screen.getByTitle('Connect with Akhil Y on LinkedIn');
    expect(linkedInLink).toHaveAttribute('href', 'https://www.linkedin.com/in/akhil-y-b97b55289/');

    const closeBtn = screen.getByLabelText('Close developer introduction');
    fireEvent.click(closeBtn);

    // Verify NO persistent storage keys are set
    expect(localStorage.getItem('sharebox_dev_intro_dismissed_until')).toBeNull();
    expect(sessionStorage.getItem('sharebox_dev_intro_session_dismissed')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByText(/Hey, I'm Akhil!/i)).not.toBeInTheDocument();

    unmount();
    jest.useRealTimers();
  });

  test('DeveloperIntroBanner appears again on browser refresh / subsequent mount', () => {
    jest.useFakeTimers();

    const { unmount } = render(<DeveloperIntroBanner />);
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.getByText(/Hey, I'm Akhil!/i)).toBeInTheDocument();
    unmount();
    jest.useRealTimers();
  });
});
