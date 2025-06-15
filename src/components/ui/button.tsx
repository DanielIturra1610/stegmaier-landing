import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';
import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

type Variant = 'default' | 'secondary' | 'ghost' | 'ghost-dark' | 'link';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  asChild?: boolean;     // para usar con <Link> o <a>
}

/* ----- Tabla de clases utilitarias ------------------------------------ */
const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stegmaier-blue-dark disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  default:     'bg-stegmaier-blue text-white hover:bg-stegmaier-blue-dark',
  secondary:   'bg-stegmaier-gray-light text-stegmaier-blue hover:bg-slate-200',
  ghost:       'bg-transparent text-stegmaier-blue hover:bg-stegmaier-blue-light/30',
  'ghost-dark':'bg-transparent text-white hover:bg-white/10',
  link:        'bg-transparent underline-offset-4 text-stegmaier-blue hover:underline',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button: FC<ButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  asChild = false,
  ...rest
}) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={clsx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export default Button;
