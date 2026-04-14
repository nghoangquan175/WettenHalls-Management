import * as LucideIcons from 'lucide-react';
import { type LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = LucideIcons[
    name as keyof typeof LucideIcons
  ] as React.ElementType;

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...props} />;
}
