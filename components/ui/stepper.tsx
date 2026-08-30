"use client";

import { Check, LoaderCircle } from "lucide-react";
import * as React from "react";
import { createContext, useContext } from "react";

import { cn } from "@/lib/utils";

type StepperContextValue = {
  activeStep: number;
  setActiveStep: (step: number) => void;
  orientation: "horizontal" | "vertical";
};

type StepItemContextValue = {
  step: number;
  state: StepState;
  isDisabled: boolean;
  isLoading: boolean;
};

type StepState = "active" | "completed" | "inactive";

const StepperContext = createContext<StepperContextValue | undefined>(undefined);
const StepItemContext = createContext<StepItemContextValue | undefined>(undefined);

function useStepper() {
  const context = useContext(StepperContext);
  if (!context) throw new Error("useStepper must be used within a Stepper");
  return context;
}

function useStepItem() {
  const context = useContext(StepItemContext);
  if (!context) throw new Error("useStepItem must be used within a StepperItem");
  return context;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: "horizontal" | "vertical";
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  { defaultValue = 0, value, onValueChange, orientation = "horizontal", className, ...props },
  ref,
) {
  const [internalStep, setInternalStep] = React.useState(defaultValue);

  const setActiveStep = React.useCallback((step: number) => {
    if (value === undefined) setInternalStep(step);
    onValueChange?.(step);
  }, [onValueChange, value]);

  return (
    <StepperContext.Provider value={{ activeStep: value ?? internalStep, setActiveStep, orientation }}>
      <div
        ref={ref}
        className={cn(
          "group/stepper inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className,
        )}
        data-orientation={orientation}
        data-slot="stepper"
        role="list"
        {...props}
      />
    </StepperContext.Provider>
  );
});

export interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(function StepperItem(
  { step, completed = false, disabled = false, loading = false, className, children, ...props },
  ref,
) {
  const { activeStep } = useStepper();
  const state: StepState = completed || step < activeStep
    ? "completed"
    : activeStep === step
      ? "active"
      : "inactive";
  const isLoading = loading && state === "active";

  return (
    <StepItemContext.Provider value={{ step, state, isDisabled: disabled, isLoading }}>
      <div
        ref={ref}
        className={cn(
          "group/step flex items-center group-data-[orientation=horizontal]/stepper:flex-row group-data-[orientation=vertical]/stepper:flex-col",
          className,
        )}
        data-state={state}
        data-slot="stepper-item"
        data-loading={isLoading || undefined}
        role="listitem"
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
});

export interface StepperTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const StepperTrigger = React.forwardRef<HTMLButtonElement, StepperTriggerProps>(function StepperTrigger(
  { asChild = false, className, children, onClick, ...props },
  ref,
) {
  const { setActiveStep } = useStepper();
  const { step, isDisabled } = useStepItem();

  if (asChild) return <div className={className}>{children}</div>;

  return (
    <button
      ref={ref}
      type="button"
      className={cn("inline-flex items-center gap-3 disabled:pointer-events-none disabled:opacity-50", className)}
      onClick={(event) => {
        setActiveStep(step);
        onClick?.(event);
      }}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
});

export interface StepperIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const StepperIndicator = React.forwardRef<HTMLDivElement, StepperIndicatorProps>(function StepperIndicator(
  { asChild = false, className, children, ...props },
  ref,
) {
  const { state, step, isLoading } = useStepItem();

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=completed]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:text-primary-foreground",
        className,
      )}
      data-state={state}
      data-slot="stepper-indicator"
      {...props}
    >
      {asChild ? children : (
        <>
          <span className="transition-all group-data-[loading=true]/step:scale-0 group-data-[state=completed]/step:scale-0 group-data-[loading=true]/step:opacity-0 group-data-[state=completed]/step:opacity-0">
            {children ?? step}
          </span>
          <Check
            className="absolute scale-0 opacity-0 transition-all group-data-[state=completed]/step:scale-100 group-data-[state=completed]/step:opacity-100"
            size={15}
            strokeWidth={3}
            aria-hidden="true"
          />
          {isLoading ? (
            <LoaderCircle className="absolute animate-spin" size={14} strokeWidth={2} aria-hidden="true" />
          ) : null}
        </>
      )}
    </div>
  );
});

export const StepperTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(function StepperTitle(
  { className, ...props },
  ref,
) {
  return <h3 ref={ref} className={cn("text-sm font-medium", className)} {...props} />;
});

export const StepperDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(function StepperDescription(
  { className, ...props },
  ref,
) {
  return <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />;
});

export const StepperSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function StepperSeparator(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "m-0.5 bg-muted group-data-[orientation=horizontal]/stepper:h-0.5 group-data-[orientation=vertical]/stepper:h-12 group-data-[orientation=horizontal]/stepper:w-full group-data-[orientation=vertical]/stepper:w-0.5 group-data-[orientation=horizontal]/stepper:flex-1 group-data-[state=completed]/step:bg-primary",
        className,
      )}
      data-slot="stepper-separator"
      aria-hidden="true"
      {...props}
    />
  );
});
