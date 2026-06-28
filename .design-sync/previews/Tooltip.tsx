import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
  Button,
} from 'magic-auth-dashboard';

// Tooltips need TooltipProvider in context; rendered open for the static card.
export const OnButton = () => (
  <TooltipProvider>
    <Tooltip open>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm">Role: Administrator</Button>
      </TooltipTrigger>
      <TooltipContent>Members inherit permissions from their role.</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const Hint = () => (
  <TooltipProvider>
    <Tooltip open>
      <TooltipTrigger asChild>
        <Button variant="secondary" size="icon" aria-label="Help">?</Button>
      </TooltipTrigger>
      <TooltipContent>Last sign-in is shown in your local timezone.</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
