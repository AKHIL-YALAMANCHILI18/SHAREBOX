import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 border border-sb-border text-secondary-text mb-2">
          <FileQuestion className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-primary-text">
            Page not found
          </h1>
          <p className="text-sm text-secondary-text leading-relaxed">
            The link you followed may be broken, or the room may have expired and been cleaned up.
          </p>
        </div>
        <div>
          <Link href="/">
            <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
