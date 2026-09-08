import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';

  switch (status) {
    case 'New':
      variant = 'primary';
      break;
    case 'Under Review':
      variant = 'warning';
      break;
    case 'Shortlisted':
    case 'Interview Scheduled':
      variant = 'primary';
      break;
    case 'Selected':
      variant = 'success';
      break;
    case 'Rejected':
      variant = 'danger';
      break;
    default:
      variant = 'default';
  }

  // Adjust style for slightly custom colors if needed
  if (status === 'Shortlisted') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        {status}
      </span>
    );
  }

  return <Badge variant={variant}>{status}</Badge>;
}
