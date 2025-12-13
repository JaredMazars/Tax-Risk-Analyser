'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createCalendar, ResourceTimeline, Interaction } from '@event-calendar/core';
import '@event-calendar/core/index.css';
import './styles.css';
import { TeamMemberWithAllocations, TaskRole } from '@/types';
import { CalendarTask, CalendarResource, CalendarEvent, CalendarAllocation } from './types';
import { addYears } from 'date-fns';

interface TeamCalendarProps {
  task: CalendarTask;
  teamMembers: TeamMemberWithAllocations[];
  currentUserRole: TaskRole;
  onAllocationUpdate: () => void;
}

// Role color mapping following Forvis design system
const getRoleColor = (role: TaskRole): string => {
  switch (role) {
    case 'ADMIN':
      return '#2E5AAC'; // Forvis primary blue
    case 'REVIEWER':
      return '#5B93D7'; // Forvis light blue
    case 'EDITOR':
      return '#D9CBA8'; // Forvis gold
    case 'VIEWER':
      return '#6C757D'; // Forvis gray
    default:
      return '#6C757D';
  }
};

// Format allocation details for display
const formatAllocationTitle = (allocation: CalendarAllocation): string => {
  const parts: string[] = [allocation.role];
  
  if (allocation.allocatedHours !== null) {
    parts.push(`${allocation.allocatedHours}h`);
  } else if (allocation.allocatedPercentage !== null) {
    parts.push(`${allocation.allocatedPercentage}%`);
  }
  
  return parts.join(' - ');
};

export function TeamCalendar({
  task,
  teamMembers,
  currentUserRole,
  onAllocationUpdate
}: TeamCalendarProps) {
  const [calendarEl, setCalendarEl] = useState<HTMLDivElement | null>(null);
  const [selectedAllocation, setSelectedAllocation] = useState<{
    allocation: CalendarAllocation;
    teamMemberId: number;
  } | null>(null);
  
  // Store calendar instance in ref to prevent recreation
  const calendarInstanceRef = useRef<any>(null);

  // Check if current user can edit allocations
  const canEdit = currentUserRole === 'ADMIN';

  // Transform team members into calendar resources
  const resources = useMemo<CalendarResource[]>(() => {
    return teamMembers.map(member => {
      const user = member.user || { id: member.userId, name: null, email: 'Unknown' };
      return {
        id: member.userId,
        title: user.name || user.email || 'Unknown User',
        extendedProps: {
          user
        }
      };
    });
  }, [teamMembers]);

  // Transform allocations into calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    const allEvents: CalendarEvent[] = [];

    teamMembers.forEach(member => {
      if (!member.allocations || !Array.isArray(member.allocations)) {
        return;
      }

      member.allocations.forEach(allocation => {
        // Only show allocations with valid dates
        if (allocation.startDate && allocation.endDate) {
          const calendarAllocation: CalendarAllocation = {
            ...allocation,
            userId: member.userId
          };
          
          allEvents.push({
            id: `allocation-${allocation.id}`,
            resourceId: member.userId,
            start: new Date(allocation.startDate),
            end: new Date(allocation.endDate),
            title: formatAllocationTitle(calendarAllocation),
            backgroundColor: getRoleColor(allocation.role),
            textColor: '#FFFFFF',
            extendedProps: {
              allocation: calendarAllocation,
              teamMemberId: allocation.id
            }
          });
        }
      });
    });

    return allEvents;
  }, [teamMembers]);

  // Calculate valid date range for the calendar
  const validRange = useMemo(() => {
    if (!task || !task.TaskDateOpen) {
      return undefined;
    }
    
    const start = new Date(task.TaskDateOpen);
    const end = task.TaskDateTerminate 
      ? new Date(task.TaskDateTerminate)
      : addYears(start, 1);

    return { start, end };
  }, [task]);

  // Calendar options
  const options = useMemo(() => ({
    view: 'resourceTimelineWeek',
    date: new Date(),
    resources,
    events,
    validRange,
    headerToolbar: {
      start: 'title',
      center: '',
      end: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth today prev,next'
    },
    buttonText: {
      today: 'Today',
      resourceTimelineDay: 'Day',
      resourceTimelineWeek: 'Week',
      resourceTimelineMonth: 'Month'
    },
    slotDuration: { days: 1 },
    slotMinWidth: 50,
    height: 'auto',
    editable: false, // Disable built-in drag/drop for now
    selectable: canEdit,
    selectMinDistance: 5,
    pointer: true,
    nowIndicator: true,
    
    // Event click handler - open edit modal
    eventClick: (info: any) => {
      if (!canEdit) return;
      
      const allocation = info.event.extendedProps.allocation;
      const teamMemberId = info.event.extendedProps.teamMemberId;
      
      setSelectedAllocation({ allocation, teamMemberId });
    },

    // Date click handler - quick create allocation
    dateClick: async (info: any) => {
      if (!canEdit) return;
      if (!info.resource) return; // Only handle clicks on resource rows
      
      const userId = info.resource.id;
      const clickedDate = new Date(info.date);
      
      // Find the team member
      const member = teamMembers.find(m => m.userId === userId);
      if (!member) {
        console.warn('Cannot create allocation: team member not found');
        return;
      }

      // Get the teamMemberId - need to fetch it from the team allocations API
      // We'll use the first allocation's ID if it exists, otherwise fetch it
      let teamMemberId: number | null = null;
      
      if (member.allocations.length > 0 && member.allocations[0]) {
        teamMemberId = member.allocations[0].id;
      } else {
        // Need to fetch the TaskTeam record to get the ID
        try {
          const teamResponse = await fetch(`/api/tasks/${task.id}/team/allocations`);
          if (!teamResponse.ok) {
            throw new Error('Failed to fetch team data');
          }
          const teamData = await teamResponse.json();
          const teamMember = teamData.data.teamMembers.find((tm: any) => tm.userId === userId);
          if (teamMember?.allocations?.[0]?.id) {
            teamMemberId = teamMember.allocations[0].id;
          }
        } catch (error) {
          console.error('Error fetching team member ID:', error);
          alert('Failed to get team member information. Please try again.');
          return;
        }
      }

      if (!teamMemberId) {
        alert('Cannot create allocation for this team member. Please ensure they are properly added to the team.');
        return;
      }
      
      // Calculate end date (1 week from clicked date)
      const endDate = new Date(clickedDate);
      endDate.setDate(endDate.getDate() + 7);
      
      try {
        const response = await fetch(
          `/api/tasks/${task.id}/team/${teamMemberId}/allocation`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: clickedDate.toISOString(),
              endDate: endDate.toISOString(),
              role: 'VIEWER',
              allocatedHours: 0
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create allocation');
        }

        // Refresh the calendar data
        onAllocationUpdate();
      } catch (error) {
        console.error('Error creating allocation:', error);
        alert('Failed to create allocation. Please try again.');
      }
    },

    // Customize theme for Forvis design system
    theme: (theme: any) => ({
      ...theme,
      calendar: 'ec forvis-calendar'
    })
  }), [resources, events, validRange, canEdit, teamMembers, task.id, onAllocationUpdate]);

  // Initialize calendar once
  useEffect(() => {
    if (!calendarEl || calendarInstanceRef.current) return;

    // Create calendar instance only once
    const ec = createCalendar(
      calendarEl,
      [ResourceTimeline, Interaction],
      options
    );
    
    calendarInstanceRef.current = ec;

    // Cleanup on unmount
    return () => {
      if (calendarInstanceRef.current) {
        // Clear the container
        while (calendarEl.firstChild) {
          calendarEl.removeChild(calendarEl.firstChild);
        }
        calendarInstanceRef.current = null;
      }
    };
  }, [calendarEl]); // Only recreate if element changes

  // Update calendar options when they change (without recreating)
  useEffect(() => {
    const ec = calendarInstanceRef.current;
    if (!ec) return;

    // Update dynamic options
    try {
      ec.setOption('resources', resources);
      ec.setOption('events', events);
      ec.setOption('validRange', validRange);
      ec.setOption('selectable', canEdit);
    } catch (error) {
      console.error('Error updating calendar options:', error);
    }
  }, [resources, events, validRange, canEdit]);

  return (
    <div className="space-y-4">
      {/* Calendar container */}
      <div 
        ref={setCalendarEl}
        className="forvis-team-calendar rounded-lg shadow-corporate border border-forvis-blue-100 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #F0F7FD 0%, #FFFFFF 100%)'
        }}
      />

      {/* Info banner */}
      {!canEdit && (
        <div className="text-sm text-forvis-gray-600 italic">
          View-only mode. Only task admins can modify allocations.
        </div>
      )}

      {canEdit && (
        <div className="text-sm text-forvis-gray-600">
          Click on an empty date to quickly create an allocation, or click an existing allocation to edit it.
        </div>
      )}

      {/* TODO: Add allocation edit modal here if needed */}
    </div>
  );
}
