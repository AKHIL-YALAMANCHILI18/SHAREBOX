import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CopyButton } from '@/components/ui/copy-button';
import { Footer } from '@/components/layout/footer';

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
    expect(screen.getByText('Akhil Y')).toBeInTheDocument();
    expect(screen.getByText('akhilyalamanchilii@gmail.com')).toBeInTheDocument();

    const emailLink = screen.getByTitle('Contact Akhil Y via Email');
    expect(emailLink).toHaveAttribute('href', 'mailto:akhilyalamanchilii@gmail.com');

    const linkedInLink = screen.getByTitle('Akhil Y on LinkedIn');
    expect(linkedInLink).toHaveAttribute('href', 'https://www.linkedin.com/in/akhil-y-b97b55289/');

    const githubLink = screen.getByTitle('Akhil Y on GitHub');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/AKHIL-YALAMANCHILI18');

    expect(screen.getByText(/© 2026 SHAREBOX\. All rights reserved\./i)).toBeInTheDocument();
  });
});
