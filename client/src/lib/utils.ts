import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Local storage helpers for tracking user's attendees when session fails
const ATTENDEES_STORAGE_KEY = 'soccer-my-attendees';

export function getMyAttendeesFromStorage(): Record<number, number[]> {
  try {
    const stored = localStorage.getItem(ATTENDEES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading attendees from storage:', error);
  }
  return {};
}

export function addAttendeeToStorage(weekId: number, attendeeId: number) {
  try {
    const currentAttendees = getMyAttendeesFromStorage();
    if (!currentAttendees[weekId]) {
      currentAttendees[weekId] = [];
    }
    if (!currentAttendees[weekId].includes(attendeeId)) {
      currentAttendees[weekId].push(attendeeId);
      localStorage.setItem(ATTENDEES_STORAGE_KEY, JSON.stringify(currentAttendees));
    }
  } catch (error) {
    console.error('Error saving attendee to storage:', error);
  }
}

export function removeAttendeeFromStorage(weekId: number, attendeeId: number) {
  try {
    const currentAttendees = getMyAttendeesFromStorage();
    if (currentAttendees[weekId]) {
      currentAttendees[weekId] = currentAttendees[weekId].filter(id => id !== attendeeId);
      localStorage.setItem(ATTENDEES_STORAGE_KEY, JSON.stringify(currentAttendees));
    }
  } catch (error) {
    console.error('Error removing attendee from storage:', error);
  }
}

export function isMyAttendeeInStorage(weekId: number, attendeeId: number): boolean {
  try {
    const currentAttendees = getMyAttendeesFromStorage();
    return !!(currentAttendees[weekId] && currentAttendees[weekId].includes(attendeeId));
  } catch (error) {
    console.error('Error checking if attendee is mine:', error);
    return false;
  }
}
