'use client';

/**
 * Project Stage Indicator Component
 * 
 * Displays the current stage of a project with appropriate styling.
 * This is a placeholder implementation - future versions will include
 * stage management functionality (dropdown to change stages, etc.)
 */

import { ProjectStage } from '@/types/project-stages';
import { formatProjectStage, getProjectStageColor } from '@/lib/utils/projectStages';

interface TaskStageIndicatorProps {
  stage: ProjectStage | string;
  className?: string;
}

export function TaskStageIndicator({ stage, className = '' }: TaskStageIndicatorProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getProjectStageColor(
        stage
      )} ${className}`}
    >
      {formatProjectStage(stage)}
    </span>
  );
}

interface TaskStageIndicatorWithLabelProps {
  stage: ProjectStage | string;
  showLabel?: boolean;
  className?: string;
}

export function TaskStageIndicatorWithLabel({
  stage,
  showLabel = true,
  className = '',
}: TaskStageIndicatorWithLabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && <span className="text-sm text-forvis-gray-600 font-medium">Stage:</span>}
      <TaskStageIndicator stage={stage} />
    </div>
  );
}

