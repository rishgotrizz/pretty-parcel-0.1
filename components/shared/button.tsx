import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const variants = {
  primary: "ui-button ui-button-primary",
  secondary: "ui-button ui-button-secondary",
  ghost: "ui-button ui-button-ghost"
} as const;

type ButtonVariant = keyof typeof variants;

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type ButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkButtonProps = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function Button(props: ButtonProps | LinkButtonProps) {
  const variant = props.variant ?? "primary";
  const className = cn(variants[variant], props.className);

  if ("href" in props && props.href) {
    const { href, children, className: _className, variant: _variant, ...linkProps } = props as LinkButtonProps;
    return (
      <Link href={href} className={className} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { children, className: _className, variant: _variant, type, ...buttonProps } = props as ButtonProps;
  const buttonType = (type as "button" | "submit" | "reset" | undefined) ?? "button";
  return (
    <button type={buttonType} className={className} {...buttonProps}>
      {children}
    </button>
  );
}
