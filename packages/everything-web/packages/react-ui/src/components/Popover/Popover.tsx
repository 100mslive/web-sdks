import { Popover as PopoverRoot, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';

export type PopoverComponentType = {
    Root: typeof PopoverRoot;
    Trigger: typeof PopoverTrigger;
    Content: typeof PopoverContent;
};

export const Popover: PopoverComponentType = {
    Root: PopoverRoot,
    Trigger: PopoverTrigger,
    Content: PopoverContent
};
