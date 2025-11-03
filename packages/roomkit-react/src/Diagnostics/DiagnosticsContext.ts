import { createContext, Dispatch, SetStateAction, useContext } from 'react';
import { HMSDiagnosticsInterface } from '@100mslive/react-sdk';

export enum DiagnosticsStep {
  BROWSER,
  VIDEO,
  AUDIO,
  CONNECTIVITY,
}

export const initialSteps = {
  [DiagnosticsStep.BROWSER]: { name: 'Browser Support' },
  [DiagnosticsStep.VIDEO]: { name: 'Test Video' },
  [DiagnosticsStep.AUDIO]: { name: 'Test Audio' },
  [DiagnosticsStep.CONNECTIVITY]: { name: 'Connection Quality' },
};

export interface DiagnosticsStepInfo {
  name: string;
  hasFailed?: boolean;
  isCompleted?: boolean;
}

export const DiagnosticsContext = createContext<{
  hmsDiagnostics?: HMSDiagnosticsInterface;
  activeStepIndex: DiagnosticsStep;
  setActiveStep: Dispatch<SetStateAction<DiagnosticsStep>>;
  steps: Record<DiagnosticsStep, DiagnosticsStepInfo>;
  updateStep: (step: DiagnosticsStep, value: Omit<DiagnosticsStepInfo, 'name'>) => void;
}>({
  activeStepIndex: 0,
  setActiveStep: () => {
    return;
  },
  steps: initialSteps,
  updateStep: () => {
    return;
  },
});

export const useDiagnostics = () => {
  const context = useContext(DiagnosticsContext);
  const activeStep = context.steps[context.activeStepIndex];

  return { ...context, activeStep };
};
