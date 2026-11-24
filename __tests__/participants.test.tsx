import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, act, renderHook } from '@testing-library/react';
import { ParticipantsBar } from '@/components/room/participants-bar';
import { RoomHeader } from '@/components/room/room-header';
import { useRoom } from '@/hooks/use-room';
import type { Room, Participant, PresenceParticipant } from '@/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Realtime channel mocks
let channelHandlers: { [event: string]: Function } = {};
const mockChannel: any = {
  on: jest.fn((type: string, filter: any, callback: Function) => {
    const key = type === 'presence' ? `presence:${filter.event}` : `${filter.event || type}`;
    channelHandlers[key] = callback;
    return mockChannel;
  }),
  subscribe: jest.fn((callback?: (status: string) => void) => {
    if (callback) callback('SUBSCRIBED');
    return mockChannel;
  }),
  track: jest.fn().mockResolvedValue('ok'),
  untrack: jest.fn().mockResolvedValue('ok'),
  send: jest.fn().mockResolvedValue('ok'),
  presenceState: jest.fn(() => ({})),
};

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    channel: () => mockChannel,
    removeChannel: jest.fn(),
  }),
}));

describe('Room Participants & Realtime Synchronization', () => {
  beforeEach(() => {
    channelHandlers = {};
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ participants: [] }),
      })
    ) as jest.Mock;
  });

  const mockRoom: Room = {
    id: 'room-111',
    code: '123456',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    is_active: true,
  };

  const currentUser: Participant = {
    id: 'part-current',
    room_id: 'room-111',
    display_name: 'Cedar',
    session_token_hash: 'hash1',
    joined_at: new Date().toISOString(),
    is_active: true,
  };

  test('ParticipantsBar renders all participants with their names and (You) on current user', () => {
    const participants: PresenceParticipant[] = [
      { id: 'part-current', display_name: 'Cedar', online: true },
      { id: 'part-peer1', display_name: 'Maple', online: true },
      { id: 'part-peer2', display_name: 'Oak', online: true },
    ];

    render(
      <ParticipantsBar
        participants={participants}
        currentParticipantId="part-current"
      />
    );

    expect(screen.getByText('In room:')).toBeInTheDocument();
    expect(screen.getByText('Cedar')).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();
    expect(screen.getByText('Maple')).toBeInTheDocument();
    expect(screen.getByText('Oak')).toBeInTheDocument();

    // Verify only the current user gets the (You) label
    const youLabels = screen.getAllByText('(You)');
    expect(youLabels).toHaveLength(1);
  });

  test('RoomHeader displays accurate peer count for single and multiple peers', () => {
    const { rerender } = render(
      <RoomHeader room={mockRoom} participantCount={1} />
    );
    expect(screen.getByText(/1 peer online/i)).toBeInTheDocument();

    rerender(<RoomHeader room={mockRoom} participantCount={3} />);
    expect(screen.getByText(/3 peers online/i)).toBeInTheDocument();
  });

  test('useRoom initializes with all participants from initialParticipants', async () => {
    const initialParticipants: PresenceParticipant[] = [
      { id: 'part-current', display_name: 'Cedar', online: true },
      { id: 'part-peer1', display_name: 'Maple', online: true },
    ];

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() =>
        useRoom({
          initialRoom: mockRoom,
          initialParticipant: currentUser,
          initialFiles: [],
          initialParticipants,
        })
      );
    });

    expect(hookResult.result.current.participants).toHaveLength(2);
    expect(hookResult.result.current.participants.map((p: any) => p.display_name)).toEqual(
      expect.arrayContaining(['Cedar', 'Maple'])
    );
  });

  test('useRoom dynamically adds new participant on participant_joined broadcast', async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() =>
        useRoom({
          initialRoom: mockRoom,
          initialParticipant: currentUser,
          initialFiles: [],
          initialParticipants: [
            { id: 'part-current', display_name: 'Cedar', online: true },
          ],
        })
      );
    });

    expect(hookResult.result.current.participants).toHaveLength(1);

    // Simulate realtime broadcast event when Maple joins
    act(() => {
      const joinHandler = channelHandlers['participant_joined'];
      if (joinHandler) {
        joinHandler({
          payload: {
            participant: { id: 'part-peer1', display_name: 'Maple', online: true },
          },
        });
      }
    });

    expect(hookResult.result.current.participants).toHaveLength(2);
    expect(hookResult.result.current.participants.some((p: any) => p.id === 'part-peer1')).toBe(true);

    // Test deduplication on repeated join event
    act(() => {
      const joinHandler = channelHandlers['participant_joined'];
      if (joinHandler) {
        joinHandler({
          payload: {
            participant: { id: 'part-peer1', display_name: 'Maple', online: true },
          },
        });
      }
    });

    expect(hookResult.result.current.participants).toHaveLength(2);
  });

  test('useRoom dynamically removes participant on participant_left broadcast', async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() =>
        useRoom({
          initialRoom: mockRoom,
          initialParticipant: currentUser,
          initialFiles: [],
          initialParticipants: [
            { id: 'part-current', display_name: 'Cedar', online: true },
            { id: 'part-peer1', display_name: 'Maple', online: true },
          ],
        })
      );
    });

    expect(hookResult.result.current.participants).toHaveLength(2);

    // Simulate realtime broadcast event when Maple leaves
    act(() => {
      const leaveHandler = channelHandlers['participant_left'];
      if (leaveHandler) {
        leaveHandler({
          payload: {
            participantId: 'part-peer1',
          },
        });
      }
    });

    expect(hookResult.result.current.participants).toHaveLength(1);
    expect(hookResult.result.current.participants[0].id).toBe('part-current');
  });

  test('useRoom never removes current user even if a leave event references current user id', async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() =>
        useRoom({
          initialRoom: mockRoom,
          initialParticipant: currentUser,
          initialFiles: [],
          initialParticipants: [
            { id: 'part-current', display_name: 'Cedar', online: true },
          ],
        })
      );
    });

    act(() => {
      const leaveHandler = channelHandlers['participant_left'];
      if (leaveHandler) {
        leaveHandler({
          payload: {
            participantId: 'part-current',
          },
        });
      }
    });

    expect(hookResult.result.current.participants).toHaveLength(1);
    expect(hookResult.result.current.participants[0].id).toBe('part-current');
  });
});
